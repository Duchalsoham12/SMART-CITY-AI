"""
SmartCityAI - Model Regression Benchmark Test Suite
Ensures that model quality on a frozen 'Golden Dataset' does not degrade below
defined threshold standards (Regression Prevention Quality Gate).
"""

import numpy as np
import pandas as pd
import pytest
from sklearn.metrics import mean_absolute_error, mean_squared_error

from ml.models.traffic_forecaster import LightGBMTrafficForecaster
from ml.models.aqi_forecaster import LightGBMAQIForecaster


@pytest.fixture(scope="module")
def golden_traffic_benchmark():
    """Deterministic golden time series dataset for traffic regression benchmarking."""
    np.random.seed(1337)
    n = 300
    # Synthetic time-series with daily seasonality
    hours = np.tile(np.arange(24), n // 24 + 1)[:n]
    sin_h = np.sin(2 * np.pi * hours / 24)
    cos_h = np.cos(2 * np.pi * hours / 24)
    base_flow = 28.0 + 8.0 * sin_h - 4.0 * cos_h
    noise = np.random.normal(0, 1.2, n)
    speed = base_flow + noise

    df = pd.DataFrame({
        "sin_hour": sin_h,
        "cos_hour": cos_h,
        "speed_lag_1": np.roll(speed, 1),
        "speed_lag_2": np.roll(speed, 2),
        "speed": speed,
    }).iloc[2:].reset_index(drop=True)

    train_size = int(len(df) * 0.8)
    train_df = df.iloc[:train_size]
    test_df = df.iloc[train_size:]

    feature_cols = ["sin_hour", "cos_hour", "speed_lag_1", "speed_lag_2"]
    return {
        "X_train": train_df[feature_cols],
        "y_train": train_df["speed"],
        "X_test": test_df[feature_cols],
        "y_test": test_df["speed"],
    }


def test_traffic_forecaster_regression_gate(golden_traffic_benchmark):
    """
    Quality Gate: Traffic Forecaster MAE on the golden test partition
    must NOT exceed 3.5 mph (strict regression tolerance).
    """
    data = golden_traffic_benchmark
    forecaster = LightGBMTrafficForecaster(n_estimators=50)
    forecaster.fit(data["X_train"], data["y_train"])

    preds = forecaster.predict(data["X_test"])
    mae = mean_absolute_error(data["y_test"], preds)

    assert mae <= 3.5, f"Regression Gate Failed: Traffic MAE is {mae:.3f} mph > 3.5 mph threshold"


def test_aqi_forecaster_regression_gate():
    """
    Quality Gate: AQI Forecaster RMSE on synthetic golden benchmark
    must NOT exceed 12.0 AQI points.
    """
    np.random.seed(1337)
    n = 250
    X_train = pd.DataFrame({
        "sin_hour": np.random.uniform(-1, 1, n),
        "cos_hour": np.random.uniform(-1, 1, n),
        "pm25_lag_1": np.random.uniform(20, 80, n),
        "temp_c": np.random.uniform(18, 38, n),
    })
    y_train = 1.2 * X_train["pm25_lag_1"] + 0.4 * X_train["temp_c"] + np.random.normal(0, 3.0, n)

    X_test = pd.DataFrame({
        "sin_hour": np.random.uniform(-1, 1, 60),
        "cos_hour": np.random.uniform(-1, 1, 60),
        "pm25_lag_1": np.random.uniform(20, 80, 60),
        "temp_c": np.random.uniform(18, 38, 60),
    })
    y_test = 1.2 * X_test["pm25_lag_1"] + 0.4 * X_test["temp_c"] + np.random.normal(0, 3.0, 60)

    forecaster = LightGBMAQIForecaster()
    forecaster.fit(X_train, y_train)
    preds = forecaster.predict(X_test)

    rmse = np.sqrt(mean_squared_error(y_test, preds))
    assert rmse <= 12.0, f"Regression Gate Failed: AQI RMSE is {rmse:.2f} > 12.0 threshold"
