"""
SmartCityAI - MLOps Subsystem Test Suite
Verifies dataset versioning, MLflow tracking, evaluation reporting,
model registry promotion gates, inference logging, drift monitoring,
and the full 8-stage model lifecycle.
"""

import os
import tempfile
import numpy as np
import pandas as pd
import pytest

from mlops.dataset_versioner import DatasetVersioner
from mlops.tracking import MLflowTracker
from mlops.evaluation_report import ModelEvaluationReport
from mlops.registry import PromotionCriteria
from mlops.inference_logger import InferenceLogger
from mlops.drift_monitor import DriftMonitor
from mlops.performance_monitor import ModelPerformanceMonitor
from mlops.lifecycle_orchestrator import ModelLifecycleOrchestrator


def test_dataset_versioner_determinism_and_hashing():
    """Verify SHA-256 dataset fingerprinting is invariant to column reordering."""
    df1 = pd.DataFrame({
        "segment_id": [101, 102, 103],
        "speed": [25.0, 30.5, 18.2],
        "street": ["FC Road", "Karve", "Hinjewadi"],
    })
    # Same content, different column order
    df2 = pd.DataFrame({
        "street": ["FC Road", "Karve", "Hinjewadi"],
        "segment_id": [101, 102, 103],
        "speed": [25.0, 30.5, 18.2],
    })
    # Mutated content
    df3 = df1.copy()
    df3.loc[0, "speed"] = 99.9

    hash1 = DatasetVersioner.compute_sha256(df1)
    hash2 = DatasetVersioner.compute_sha256(df2)
    hash3 = DatasetVersioner.compute_sha256(df3)

    assert hash1 == hash2, "Dataset hash must be invariant to column order"
    assert hash1 != hash3, "Data mutation must alter SHA-256 fingerprint"

    with tempfile.TemporaryDirectory() as tmp_dir:
        manifest = DatasetVersioner.version_dataset(
            df1, dataset_name="test_traffic", manifest_dir=tmp_dir
        )
        assert manifest.row_count == 3
        assert manifest.sha256_hash == hash1
        assert os.path.exists(os.path.join(tmp_dir, f"{manifest.version_id}.json"))


def test_promotion_criteria_evaluation():
    """Verify champion-challenger promotion gating logic."""
    criteria = PromotionCriteria(
        min_improvement_pct=2.0,
        max_regression_mae=3.5,
        min_quantile_coverage=0.88,
        max_inference_latency_ms=50.0,
        max_feature_drift_psi=0.10,
    )

    champion_metrics = {"mae": 2.50}

    # 1. Superior candidate: 10% lower MAE, good coverage, low latency
    candidate_pass = {
        "mae": 2.25,
        "interval_coverage": 0.91,
        "latency_p95_ms": 12.4,
        "max_feature_psi": 0.04,
    }
    passed, violations = criteria.evaluate(candidate_pass, champion_metrics)
    assert passed is True
    assert len(violations) == 0

    # 2. Deficient candidate: higher MAE than champion
    candidate_worse = {
        "mae": 2.55,
        "interval_coverage": 0.91,
        "latency_p95_ms": 12.4,
        "max_feature_psi": 0.04,
    }
    passed, violations = criteria.evaluate(candidate_worse, champion_metrics)
    assert passed is False
    assert any("below required 2.0%" in v for v in violations)

    # 3. Deficient candidate: insufficient coverage
    candidate_bad_coverage = {
        "mae": 2.10,
        "interval_coverage": 0.82,  # < 0.88
        "latency_p95_ms": 15.0,
        "max_feature_psi": 0.02,
    }
    passed, violations = criteria.evaluate(candidate_bad_coverage, champion_metrics)
    assert passed is False
    assert any("falls below minimum 88.0%" in v for v in violations)


def test_inference_audit_logger():
    """Verify live inference logging to append-only JSONL."""
    with tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        logger = InferenceLogger(log_path=tmp_path)
        inf_id = logger.log_inference(
            model_name="traffic_quantile_forecaster",
            model_version="v1.4.0",
            input_payload={"segment_id": 101, "hour": 14},
            prediction=28.4,
            uncertainty_bounds={"q_05": 24.1, "q_95": 32.8},
            latency_ms=4.82,
        )

        assert inf_id is not None
        assert os.path.exists(tmp_path)

        with open(tmp_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            assert len(lines) == 1
            assert "traffic_quantile_forecaster" in lines[0]
            assert "28.4" in lines[0]
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_drift_monitor_and_psi_detection():
    """Verify drift monitor flags stable vs critical distribution shifts."""
    monitor = DriftMonitor(alert_psi_threshold=0.10, critical_psi_threshold=0.25)
    np.random.seed(42)

    ref_df = pd.DataFrame({"speed": np.random.normal(30.0, 5.0, 500)})
    stable_df = pd.DataFrame({"speed": np.random.normal(30.1, 5.0, 500)})
    shifted_df = pd.DataFrame({"speed": np.random.normal(18.0, 8.0, 500)})

    report_stable = monitor.evaluate_drift(ref_df, stable_df)
    assert report_stable.overall_status == "STABLE"
    assert report_stable.retrain_recommended is False

    report_shifted = monitor.evaluate_drift(ref_df, shifted_df)
    assert report_shifted.overall_status == "CRITICAL_DRIFT"
    assert report_shifted.retrain_recommended is True


def test_performance_monitor_concept_drift():
    """Verify performance monitor detects error degradation beyond tolerance."""
    monitor = ModelPerformanceMonitor(model_name="traffic_model", baseline_mae=2.0, mae_degradation_ratio=1.35)

    y_true = np.array([25.0, 30.0, 28.0, 32.0, 22.0])
    
    # Accurate predictions: MAE ~ 1.0
    y_pred_good = np.array([24.5, 30.2, 28.8, 31.5, 22.2])
    rep_good = monitor.evaluate_live_accuracy(y_true, y_pred_good)
    assert rep_good.status == "HEALTHY"
    assert rep_good.concept_drift_detected is False

    # Degraded predictions: MAE ~ 4.2 > 2.0 * 1.35 = 2.7
    y_pred_bad = np.array([20.0, 25.0, 22.0, 26.0, 18.0])
    rep_bad = monitor.evaluate_live_accuracy(y_true, y_pred_bad)
    assert rep_bad.status == "DEGRADED"
    assert rep_bad.concept_drift_detected is True


def test_end_to_end_model_lifecycle_orchestrator():
    """Verify complete 8-stage lifecycle execution: Data -> Training -> Retraining."""
    np.random.seed(42)
    n = 200
    timestamps = pd.date_range("2026-01-01", periods=n, freq="1h", tz="UTC")
    speeds = 28.0 + 8.0 * np.sin(np.linspace(0, 6 * np.pi, n)) + np.random.normal(0, 1.0, n)

    df = pd.DataFrame({
        "segment_id": 101,
        "observation_time_utc": timestamps,
        "speed": speeds,
    })

    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp_tracking_dir:
        tracking_uri = f"sqlite:///{os.path.join(tmp_tracking_dir, 'test_mlruns.db')}"
        orchestrator = ModelLifecycleOrchestrator(
            model_name="traffic_test_model", tracking_uri=tracking_uri
        )

        lifecycle_result = orchestrator.run_lifecycle(raw_df=df)

        assert "stages" in lifecycle_result
        stages = lifecycle_result["stages"]

        # Stage 1: Data
        assert stages["1_data"]["status"] == "COMPLETED"
        assert len(stages["1_data"]["sha256"]) == 64

        # Stage 2: Validation
        assert stages["2_validation"]["status"] == "PASSED"

        # Stage 3 & 4: Training & Evaluation
        assert stages["3_training"]["status"] == "COMPLETED"
        assert stages["4_evaluation"]["mae"] <= 3.5

        # Stage 5 & 6: Registration & Deployment
        assert stages["5_registration"]["status"] == "STAGING"
        assert stages["6_deployment"]["promoted_to_production"] is True

        # Stage 7 & 8: Monitoring & Retraining
        assert stages["7_monitoring"]["drift_status"] in ["STABLE", "DRIFT_WARNING", "CRITICAL_DRIFT"]
        assert "retraining_triggered" in stages["8_retraining"]
        assert stages["8_retraining"]["retraining_triggered"] is True
