"""
SmartCityAI - Model Performance & Concept Drift Monitor
Matches delayed real-world ground-truth telemetry with historical model predictions
to compute rolling performance metrics and detect concept drift.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error


class PerformanceHealthReport:
    """Diagnostic health summary of production model accuracy over recent operational windows."""

    def __init__(
        self,
        model_name: str,
        rolling_mae: float,
        rolling_rmse: float,
        interval_coverage: float,
        baseline_mae: float,
        concept_drift_detected: bool,
        status: str,
        sample_size: int,
    ):
        self.model_name = model_name
        self.rolling_mae = rolling_mae
        self.rolling_rmse = rolling_rmse
        self.interval_coverage = interval_coverage
        self.baseline_mae = baseline_mae
        self.concept_drift_detected = concept_drift_detected
        self.status = status
        self.sample_size = sample_size
        self.timestamp_utc = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "model_name": self.model_name,
            "status": self.status,
            "rolling_mae": round(self.rolling_mae, 3),
            "rolling_rmse": round(self.rolling_rmse, 3),
            "interval_coverage": round(self.interval_coverage, 3),
            "baseline_mae": round(self.baseline_mae, 3),
            "concept_drift_detected": self.concept_drift_detected,
            "sample_size": self.sample_size,
            "timestamp_utc": self.timestamp_utc,
        }


class ModelPerformanceMonitor:
    """Tracks live model accuracy by reconciling delayed ground-truth observations."""

    def __init__(
        self,
        model_name: str,
        baseline_mae: float = 2.5,
        mae_degradation_ratio: float = 1.35,  # Alert if error increases by 35%
        min_coverage: float = 0.88,
    ):
        self.model_name = model_name
        self.baseline_mae = baseline_mae
        self.mae_degradation_ratio = mae_degradation_ratio
        self.min_coverage = min_coverage

    def evaluate_live_accuracy(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        q_05: Optional[np.ndarray] = None,
        q_95: Optional[np.ndarray] = None,
    ) -> PerformanceHealthReport:
        """Computes rolling error metrics and evaluates concept drift degradation."""
        sample_size = len(y_true)
        if sample_size == 0:
            return PerformanceHealthReport(
                model_name=self.model_name,
                rolling_mae=0.0,
                rolling_rmse=0.0,
                interval_coverage=1.0,
                baseline_mae=self.baseline_mae,
                concept_drift_detected=False,
                status="NO_DATA",
                sample_size=0,
            )

        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))

        # Coverage evaluation
        coverage = 1.0
        if q_05 is not None and q_95 is not None:
            inside = (y_true >= q_05) & (y_true <= q_95)
            coverage = float(np.mean(inside))

        # Concept drift detection logic
        concept_drift = mae > (self.baseline_mae * self.mae_degradation_ratio)

        status = "HEALTHY"
        if concept_drift or (coverage < self.min_coverage):
            status = "DEGRADED"

        return PerformanceHealthReport(
            model_name=self.model_name,
            rolling_mae=mae,
            rolling_rmse=rmse,
            interval_coverage=coverage,
            baseline_mae=self.baseline_mae,
            concept_drift_detected=concept_drift,
            status=status,
            sample_size=sample_size,
        )
