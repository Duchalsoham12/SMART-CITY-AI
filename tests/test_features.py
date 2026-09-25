"""
SmartCityAI - Feature Engineering Unit Tests
Verifies cyclical time encodings, autoregressive lags, and rolling window properties.
"""

import numpy as np
import pandas as pd
from features.temporal import TemporalFeatureGenerator


def test_cyclical_encoding_bounds():
    df = pd.DataFrame({
        "observation_time_utc": pd.date_range("2023-01-01 00:00:00", periods=24, freq="1h")
    })
    df = TemporalFeatureGenerator.add_cyclical_features(df)

    assert "hour_sin" in df.columns
    assert "hour_cos" in df.columns
    assert (df["hour_sin"] >= -1.0).all() and (df["hour_sin"] <= 1.0).all()
    assert (df["hour_cos"] >= -1.0).all() and (df["hour_cos"] <= 1.0).all()
    # At midnight (hour 0), sin is 0.0, cos is 1.0
    assert np.isclose(df["hour_sin"].iloc[0], 0.0)
    assert np.isclose(df["hour_cos"].iloc[0], 1.0)


def test_autoregressive_lag_generation():
    df = pd.DataFrame({
        "segment_id": [101] * 5,
        "observation_time_utc": pd.date_range("2023-01-01 00:00:00", periods=5, freq="1h"),
        "speed_mph": [10.0, 20.0, 30.0, 40.0, 50.0],
    })
    df = TemporalFeatureGenerator.add_autoregressive_lags(
        df, value_col="speed_mph", lags=[1, 2], group_col="segment_id"
    )

    assert pd.isna(df["speed_mph_lag_1h"].iloc[0])
    assert df["speed_mph_lag_1h"].iloc[1] == 10.0
    assert df["speed_mph_lag_1h"].iloc[2] == 20.0
    assert df["speed_mph_lag_2h"].iloc[2] == 10.0
