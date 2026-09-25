"""
SmartCityAI - Model Inference & Metamorphic Testing Suite
Verifies:
1. Directional expectation (metamorphic) properties (physics & domain sanity)
2. Invariance properties (noise resilience & stability)
3. Inference latency budgets (single-sample <= 50ms, batch <= 500ms)
"""

import time
import numpy as np
import pandas as pd
import pytest

from ml.forecasting.quantile_forecaster import QuantileLightGBMForecaster
from ml.models.accident_risk_classifier import XGBoostAccidentRiskClassifier


@pytest.fixture(scope="module")
def trained_models():
    """Provides pre-trained forecaster and classifier for inference tests."""
    np.random.seed(42)
    n = 200

    # Traffic data
    X_traffic = pd.DataFrame({
        "sin_hour": np.sin(np.linspace(0, 4 * np.pi, n)),
        "cos_hour": np.cos(np.linspace(0, 4 * np.pi, n)),
        "speed_lag_1": np.random.uniform(15.0, 45.0, n),
        "speed_lag_2": np.random.uniform(15.0, 45.0, n),
    })
    y_traffic = 0.6 * X_traffic["speed_lag_1"] + 0.3 * X_traffic["speed_lag_2"] + np.random.normal(0, 1.0, n)

    forecaster = QuantileLightGBMForecaster(quantiles=[0.05, 0.50, 0.95], n_estimators=20)
    forecaster.fit(X_traffic, y_traffic)

    # Accident risk data
    X_acc = pd.DataFrame({
        "speed_ratio": np.random.uniform(0.3, 1.2, n),
        "is_dark": np.random.binomial(1, 0.4, n),
        "is_rain": np.random.binomial(1, 0.25, n),
        "density": np.random.uniform(0.0, 5.0, n),
    })
    # Target: 0=Minor, 1=Serious, 2=Fatal
    risk_signal = 0.5 * X_acc["speed_ratio"] + 0.3 * X_acc["is_dark"] + 0.4 * X_acc["is_rain"]
    y_acc = np.where(risk_signal > 0.8, 2, np.where(risk_signal > 0.4, 1, 0))

    classifier = XGBoostAccidentRiskClassifier()
    classifier.fit(X_acc, y_acc)

    return {"traffic": forecaster, "accident": classifier}


def test_metamorphic_accident_risk_monotonicity(trained_models):
    """
    Directional Test: Severe conditions (RAIN=1, DARK=1, high speed) MUST yield a
    strictly higher predicted crash risk score than benign conditions (CLEAR=0, DAYLIGHT=0, low speed).
    """
    classifier = trained_models["accident"]

    benign_sample = pd.DataFrame([{
        "speed_ratio": 0.4,
        "is_dark": 0,
        "is_rain": 0,
        "density": 0.5,
    }])

    hazardous_sample = pd.DataFrame([{
        "speed_ratio": 1.1,
        "is_dark": 1,
        "is_rain": 1,
        "density": 4.5,
    }])

    benign_risk = classifier.compute_risk_score(benign_sample)[0]
    hazardous_risk = classifier.compute_risk_score(hazardous_sample)[0]

    assert hazardous_risk > benign_risk, (
        f"Metamorphic Failure: Hazardous risk ({hazardous_risk:.3f}) "
        f"not greater than benign risk ({benign_risk:.3f})"
    )


def test_metamorphic_traffic_lag_monotonicity(trained_models):
    """
    Directional Test: Higher past corridor speeds must predict higher median future speeds.
    """
    forecaster = trained_models["traffic"]

    congested_state = pd.DataFrame([{
        "sin_hour": 0.5,
        "cos_hour": 0.5,
        "speed_lag_1": 15.0,
        "speed_lag_2": 14.0,
    }])

    freeflow_state = pd.DataFrame([{
        "sin_hour": 0.5,
        "cos_hour": 0.5,
        "speed_lag_1": 42.0,
        "speed_lag_2": 40.0,
    }])

    pred_congested = forecaster.predict(congested_state)["q_50"].iloc[0]
    pred_freeflow = forecaster.predict(freeflow_state)["q_50"].iloc[0]

    assert pred_freeflow > pred_congested, (
        f"Traffic Directional Failure: Freeflow ({pred_freeflow:.1f}) <= Congested ({pred_congested:.1f})"
    )


def test_traffic_quantile_monotonicity(trained_models):
    """
    Invariant: At all query points, the 5th quantile must be strictly <= 50th <= 95th quantile.
    q_05 <= q_50 <= q_95 (Zero quantile crossing)
    """
    forecaster = trained_models["traffic"]
    test_samples = pd.DataFrame({
        "sin_hour": np.random.uniform(-1, 1, 20),
        "cos_hour": np.random.uniform(-1, 1, 20),
        "speed_lag_1": np.random.uniform(10.0, 50.0, 20),
        "speed_lag_2": np.random.uniform(10.0, 50.0, 20),
    })

    preds = forecaster.predict(test_samples)
    assert np.all(preds["q_05"] <= preds["q_50"] + 1e-5), "Quantile crossing: q_05 > q_50"
    assert np.all(preds["q_50"] <= preds["q_95"] + 1e-5), "Quantile crossing: q_50 > q_95"


def test_model_inference_latency_budgets(trained_models):
    """
    Performance Quality Gate:
    Single-sample latency <= 50ms
    Batch-100 latency <= 500ms
    """
    classifier = trained_models["accident"]
    single_sample = pd.DataFrame([{
        "speed_ratio": 0.6,
        "is_dark": 0,
        "is_rain": 1,
        "density": 1.2,
    }])

    # Warmup
    _ = classifier.compute_risk_score(single_sample)

    # 1. Single sample latency test
    t0 = time.perf_counter()
    _ = classifier.compute_risk_score(single_sample)
    t_single_ms = (time.perf_counter() - t0) * 1000.0

    assert t_single_ms < 50.0, f"Single inference exceeded latency budget: {t_single_ms:.2f}ms > 50ms"

    # 2. Batch-100 latency test
    batch_100 = pd.concat([single_sample] * 100, ignore_index=True)
    t0 = time.perf_counter()
    _ = classifier.compute_risk_score(batch_100)
    t_batch_ms = (time.perf_counter() - t0) * 1000.0

    assert t_batch_ms < 500.0, f"Batch-100 inference exceeded latency budget: {t_batch_ms:.2f}ms > 500ms"
