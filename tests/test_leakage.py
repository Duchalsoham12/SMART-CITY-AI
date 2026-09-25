"""
SmartCityAI - Data Leakage Prevention Unit Tests
Verifies zero lookahead in rolling windows and strict temporal train/val/test isolation.
"""

import numpy as np
import pandas as pd
from features.temporal import TemporalFeatureGenerator
from validation.leakage_guard import LeakageGuard
from validation.preflight_gate import PreflightGate


def test_rolling_window_zero_lookahead():
    """
    Validates that the observation at time t is NEVER part of the rolling summary at t.
    If an extreme spike occurs at t=3, the rolling_mean_3h at t=3 must NOT reflect that spike!
    """
    df = pd.DataFrame({
        "segment_id": [1] * 5,
        "observation_time_utc": pd.date_range("2023-01-01 00:00:00", periods=5, freq="1h"),
        "speed_mph": [10.0, 10.0, 10.0, 999.0, 10.0],  # Extreme spike at index 3
    })
    df = TemporalFeatureGenerator.add_rolling_statistics(
        df, value_col="speed_mph", windows=[3], group_col="segment_id"
    )

    # At index 3, the rolling mean must be based on indices 0, 1, 2 (all 10.0), NOT 999.0!
    assert df["speed_mph_rolling_mean_3h"].iloc[3] == 10.0
    # The spike at index 3 can only appear in the rolling mean at index 4
    assert df["speed_mph_rolling_mean_3h"].iloc[4] > 10.0


def test_temporal_split_leakage_detection():
    train_df = pd.DataFrame({
        "observation_time_utc": pd.date_range("2023-01-01", periods=10, freq="1D")
    })
    # Overlapping validation set (starts before train ends)
    val_df = pd.DataFrame({
        "observation_time_utc": pd.date_range("2023-01-08", periods=5, freq="1D")
    })
    test_df = pd.DataFrame({
        "observation_time_utc": pd.date_range("2023-01-15", periods=5, freq="1D")
    })

    is_valid, violations = LeakageGuard.verify_temporal_splits(train_df, val_df, test_df)
    assert not is_valid
    assert len(violations) > 0
    assert "Temporal Leakage" in violations[0]


def test_preflight_gate_blocks_target_leakage():
    gate = PreflightGate(min_required_records=5)
    train_df = pd.DataFrame({
        "observation_time_utc": pd.date_range("2023-01-01", periods=10, freq="1D"),
        "feature_1": [1.0] * 10,
        "target": [2.0] * 10,
    })
    val_df = pd.DataFrame({
        "observation_time_utc": pd.date_range("2023-01-11", periods=5, freq="1D"),
        "feature_1": [1.0] * 5,
        "target": [2.0] * 5,
    })
    test_df = pd.DataFrame({
        "observation_time_utc": pd.date_range("2023-01-16", periods=5, freq="1D"),
        "feature_1": [1.0] * 5,
        "target": [2.0] * 5,
    })

    # Accidental leakage: 'target' included in feature_cols
    report = gate.evaluate_dataset(
        dataset_name="leakage_test",
        train_df=train_df,
        val_df=val_df,
        test_df=test_df,
        target_col="target",
        feature_cols=["feature_1", "target"],
    )

    assert not report.is_approved_for_training
    assert report.is_leakage_detected
    assert any("Direct Target Inclusion" in r for r in report.rejection_reasons)
