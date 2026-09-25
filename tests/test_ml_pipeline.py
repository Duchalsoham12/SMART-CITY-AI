"""
SmartCityAI - ML Pipeline Tests
Verifies the end-to-end machine learning lifecycle:
Raw ingestion -> Feature Engineering -> Model Fitting ->
Model Serialization (pickle) -> Reloading -> Deterministic Inference.
"""

import os
import tempfile
import pickle
import numpy as np
import pandas as pd
import pytest

from features.temporal import TemporalFeatureGenerator
from ml.forecasting.quantile_forecaster import QuantileLightGBMForecaster
from ml.models.accident_risk_classifier import XGBoostAccidentRiskClassifier


def test_traffic_training_pipeline_and_serialization():
    """Verify traffic forecasting pipeline from feature generation to serialized model inference."""
    np.random.seed(42)
    n = 200
    timestamps = pd.date_range("2026-01-01", periods=n, freq="1h", tz="UTC")
    base_speed = 30 + 10 * np.sin(np.linspace(0, 8 * np.pi, n)) + np.random.normal(0, 1.5, n)

    df = pd.DataFrame({
        "segment_id": 101,
        "observation_time_utc": timestamps,
        "speed": base_speed,
    })

    # 1. Feature Engineering
    df = TemporalFeatureGenerator.add_cyclical_features(df, "observation_time_utc")
    df = TemporalFeatureGenerator.add_autoregressive_lags(
        df, value_col="speed", lags=[1, 2, 3], group_col="segment_id", time_col="observation_time_utc"
    ).dropna()

    feature_cols = ["hour_sin", "hour_cos", "speed_lag_1h", "speed_lag_2h", "speed_lag_3h"]
    X = df[feature_cols]
    y = df["speed"]

    # 2. Train Model
    forecaster = QuantileLightGBMForecaster(quantiles=[0.05, 0.50, 0.95], n_estimators=30)
    forecaster.fit(X, y)

    # 3. Predict before serialization
    preds_before = forecaster.predict(X)
    assert "q_05" in preds_before.columns
    assert "q_50" in preds_before.columns
    assert "q_95" in preds_before.columns

    # 4. Serialize to disk and reload
    with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as tmp:
        tmp_path = tmp.name
        pickle.dump(forecaster, tmp)

    try:
        with open(tmp_path, "rb") as f:
            reloaded_forecaster = pickle.load(f)

        # 5. Predict with reloaded model
        preds_after = reloaded_forecaster.predict(X)

        # 6. Verify deterministic numerical reproducibility
        np.testing.assert_allclose(
            preds_before["q_50"].values,
            preds_after["q_50"].values,
            rtol=1e-5,
            err_msg="Reloaded model predictions deviate from original model!"
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_accident_classifier_pipeline_end_to_end():
    """Verify accident risk classifier pipeline with multi-class probability outputs."""
    np.random.seed(42)
    n = 150
    X = pd.DataFrame({
        "speed_ratio": np.random.uniform(0.3, 1.2, n),
        "is_dark": np.random.binomial(1, 0.4, n),
        "is_rain": np.random.binomial(1, 0.25, n),
        "prior_hotspot_density": np.random.uniform(0.0, 5.0, n),
    })
    # Ensure all 3 severity classes are present (0=Minor, 1=Serious, 2=Fatal)
    y = np.random.choice([0, 1, 2], size=n, p=[0.70, 0.20, 0.10])

    classifier = XGBoostAccidentRiskClassifier()
    classifier.fit(X, y)

    # Inference check
    probs = classifier.predict_proba(X)
    assert probs.shape == (n, 3)
    row_sums = probs.sum(axis=1)
    np.testing.assert_allclose(row_sums, np.ones(n), atol=1e-5)

    # Scaled risk score check
    risk_scores = classifier.compute_risk_score(X)
    assert len(risk_scores) == n
    assert np.all((risk_scores >= 0.0) & (risk_scores <= 1.0))
