"""
SmartCityAI - Forecasting Subsystem Unit Tests
Verifies quantile prediction intervals, multi-pollutant forecasting, and benchmark evaluation.
"""

import numpy as np
import pandas as pd
import pytest
from ml.forecasting.evaluator import ForecastingBenchmarkEvaluator
from ml.forecasting.pollutant_forecaster import MultiPollutantForecaster
from ml.forecasting.quantile_forecaster import QuantileLightGBMForecaster


def test_quantile_forecaster_monotonicity():
    np.random.seed(42)
    n = 100
    X = pd.DataFrame({
        "speed_lag_1h": np.random.uniform(10.0, 45.0, n),
        "hour_of_day": np.random.randint(0, 24, n),
        "is_weekend": np.random.choice([0, 1], n),
    })
    y = pd.Series(X["speed_lag_1h"] * 0.9 + np.random.normal(0, 2.0, n))

    model = QuantileLightGBMForecaster(quantiles=[0.05, 0.50, 0.95], n_estimators=20)
    model.fit(X, y)
    preds = model.predict(X)

    assert "q_05" in preds.columns
    assert "q_50" in preds.columns
    assert "q_95" in preds.columns
    assert "point_forecast" in preds.columns

    # Non-negotiable mathematical invariant: q_05 <= q_50 <= q_95
    assert (preds["q_05"] <= preds["q_50"]).all()
    assert (preds["q_50"] <= preds["q_95"]).all()
    # All predictions non-negative
    assert (preds["q_05"] >= 0.0).all()


def test_coverage_metrics():
    X = pd.DataFrame({"lag": [10.0, 20.0, 30.0, 40.0] * 5})
    y = pd.Series([11.0, 21.0, 29.0, 42.0] * 5)

    model = QuantileLightGBMForecaster(n_estimators=10)
    model.fit(X, y)
    metrics = model.evaluate_coverage(X, y)

    assert "picp_90" in metrics
    assert "mpiw_90" in metrics
    assert 0.0 <= metrics["picp_90"] <= 1.0
    assert metrics["mpiw_90"] > 0.0


def test_multi_pollutant_forecaster():
    n = 60
    X = pd.DataFrame({
        "temp": np.random.uniform(15.0, 35.0, n),
        "humidity": np.random.uniform(30.0, 80.0, n),
    })
    Y = pd.DataFrame({
        "pm25": np.random.uniform(20.0, 150.0, n),
        "pm10": np.random.uniform(40.0, 250.0, n),
        "no2": np.random.uniform(10.0, 60.0, n),
    })

    model = MultiPollutantForecaster(target_pollutants=["pm25", "pm10", "no2"])
    model.fit(X, Y)
    preds = model.predict(X)

    assert "pm25_pred" in preds.columns
    assert "pm10_pred" in preds.columns
    assert "no2_pred" in preds.columns
    assert "composite_naqi_category" in preds.columns
    assert len(preds) == n


def test_benchmark_evaluator_leaderboard():
    n = 80
    X_train = pd.DataFrame({
        "speed_lag_1h": np.random.uniform(15.0, 40.0, n),
        "hour_of_day": [i % 24 for i in range(n)],
        "day_of_week": [(i // 24) % 7 for i in range(n)],
    })
    y_train = pd.Series(X_train["speed_lag_1h"] * 0.95 + 1.0)

    X_test = pd.DataFrame({
        "speed_lag_1h": np.random.uniform(15.0, 40.0, 20),
        "hour_of_day": [i % 24 for i in range(20)],
        "day_of_week": [(i // 24) % 7 for i in range(20)],
    })
    y_test = pd.Series(X_test["speed_lag_1h"] * 0.95 + 1.0)

    leaderboard = ForecastingBenchmarkEvaluator.evaluate_model_suite(
        X_train, y_train, X_test, y_test, lag_1h_col="speed_lag_1h"
    )

    assert len(leaderboard) == 4
    assert set(leaderboard["model"].values) == {
        "1. Naive Persistence",
        "2. Seasonal Moving Average",
        "3. Regularized Ridge Regression",
        "4. Quantile LightGBM (Production)",
    }
    for col in ["mae", "rmse", "wape", "smape", "r2"]:
        assert col in leaderboard.columns
