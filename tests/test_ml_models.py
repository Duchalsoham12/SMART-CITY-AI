"""
SmartCityAI - Machine Learning Unit Tests
Verifies time-aware splitters, baselines, production candidates, calibration, and spatial statistics.
"""

import numpy as np
import pandas as pd
import pytest
from ml.evaluation.splitters import RollingTimeSeriesSplit, SpatialGroupTimeSeriesSplit
from ml.models.traffic_forecaster import MovingAverageBaseline, LightGBMTrafficForecaster
from ml.models.accident_risk_classifier import PriorProbabilityBaseline, XGBoostAccidentRiskClassifier
from ml.models.aqi_forecaster import SeasonalPersistenceBaseline, LightGBMAQIForecaster
from ml.models.anomaly_detector import RollingZScoreBaseline, IsolationForestAnomalyDetector
from ml.models.hotspot_analyzer import DBSCANHotspotAnalyzer, GetisOrdSpatialAnalyzer


def test_rolling_time_series_split_zero_lookahead():
    df = pd.DataFrame({
        "observation_time_utc": pd.date_range("2023-01-01", periods=100, freq="1h"),
        "val": range(100),
    })
    splitter = RollingTimeSeriesSplit(n_splits=3, test_size_ratio=0.2)
    splits = list(splitter.split(df))

    assert len(splits) == 3
    for train_idx, test_idx in splits:
        max_train_time = df.loc[train_idx, "observation_time_utc"].max()
        min_test_time = df.loc[test_idx, "observation_time_utc"].min()
        # Non-negotiable time-series invariant: train strictly precedes test
        assert max_train_time < min_test_time


def test_spatial_group_time_series_split():
    df = pd.DataFrame({
        "segment_id": [101, 102] * 5,
        "observation_time_utc": pd.date_range("2023-01-01", periods=10, freq="1D", tz="UTC"),
    })
    splitter = SpatialGroupTimeSeriesSplit(time_cutoff="2023-01-05 23:59:59")
    train_idx, test_idx = splitter.split(df)

    assert len(train_idx) == 5
    assert len(test_idx) == 5
    assert (df.loc[train_idx, "observation_time_utc"] <= pd.to_datetime("2023-01-05 23:59:59", utc=True)).all()


def test_traffic_forecaster_fit_predict():
    X = pd.DataFrame({
        "segment_id": [101] * 50,
        "hour_of_day": list(range(24)) + list(range(24)) + [0, 1],
        "day_of_week": [0] * 50,
        "speed_lag_1h": [20.0 + (i % 5) for i in range(50)],
        "speed_rolling_mean_3h": [22.0] * 50,
    })
    y = pd.Series([21.0 + (i % 5) for i in range(50)])

    # Baseline fit & predict
    baseline = MovingAverageBaseline()
    baseline.fit(X, y)
    base_preds = baseline.predict(X)
    assert len(base_preds) == 50
    assert base_preds.mean() > 0.0

    # Production LightGBM fit & predict
    lgbm = LightGBMTrafficForecaster(n_estimators=10)
    lgbm.fit(X, y)
    preds = lgbm.predict(X)
    assert len(preds) == 50
    assert (preds >= 0.0).all()  # Non-negativity invariant


def test_accident_classifier_and_risk_calibration():
    # 3 classes: 0 (property damage), 1 (minor injury), 2 (fatal/severe)
    X = pd.DataFrame({
        "speed_mph": [25.0, 15.0, 50.0, 30.0, 45.0, 10.0] * 10,
        "precipitation_mm": [0.0, 10.0, 25.0, 0.0, 5.0, 20.0] * 10,
        "is_weekend": [0, 1, 0, 1, 0, 1] * 10,
    })
    y = pd.Series([0, 0, 2, 0, 1, 1] * 10)

    # Baseline
    baseline = PriorProbabilityBaseline()
    baseline.fit(X, y)
    priors = baseline.predict_proba(X)
    assert np.allclose(priors.sum(axis=1), 1.0)

    # Production XGBoost
    xgb_model = XGBoostAccidentRiskClassifier(n_estimators=10)
    xgb_model.fit(X, y)
    probs = xgb_model.predict_proba(X)
    assert np.allclose(probs.sum(axis=1), 1.0)

    # Continuous safety risk score must be bounded in [0.0, 1.0]
    risk_scores = xgb_model.compute_risk_score(X)
    assert (risk_scores >= 0.0).all() and (risk_scores <= 1.0).all()


def test_aqi_forecaster():
    X = pd.DataFrame({
        "pm25_lag_1h": [35.0, 40.0, 45.0, 30.0] * 5,
        "pm25_lag_24h": [30.0, 35.0, 40.0, 28.0] * 5,
        "temperature_celsius": [22.0, 23.0, 24.0, 21.0] * 5,
    })
    y = pd.Series([36.0, 42.0, 44.0, 32.0] * 5)

    base = SeasonalPersistenceBaseline(lag_col="pm25_lag_24h")
    base.fit(X, y)
    base_preds = base.predict(X)
    assert len(base_preds) == 20

    lgbm_aqi = LightGBMAQIForecaster(n_estimators=10)
    lgbm_aqi.fit(X, y)
    preds = lgbm_aqi.predict(X)
    assert (preds >= 0.0).all()
    categories = lgbm_aqi.map_to_naqi_category(preds)
    assert len(categories) == 20
    assert all(c in ["GOOD", "SATISFACTORY", "MODERATE", "POOR", "VERY_POOR", "SEVERE"] for c in categories)


def test_isolation_forest_anomaly_detector():
    normal_drop = [0.1, 0.2, 0.0, 0.3, 0.4] * 19  # 95 normal observations
    normal_var = [1.0, 1.1, 0.9, 1.2, 1.0] * 19
    outlier_drop = [25.0, 30.0, 28.0, 35.0, 40.0]  # 5 anomalous spikes
    outlier_var = [50.0, 60.0, 55.0, 70.0, 65.0]

    X = pd.DataFrame({
        "speed_drop": normal_drop + outlier_drop,
        "variance": normal_var + outlier_var,
    })
    detector = IsolationForestAnomalyDetector(contamination=0.05, n_estimators=50)
    detector.fit(X)

    labels = detector.predict(X)
    scores = detector.predict_scores(X)

    assert set(labels).issubset({0, 1})
    assert (scores >= 0.0).all() and (scores <= 1.0).all()
    assert labels.sum() > 0  # At least one anomaly detected


def test_spatial_dbscan_and_getis_ord():
    # Chicago coordinates cluster around (41.88, -87.62)
    coords = pd.DataFrame({
        "latitude": [41.8827, 41.8828, 41.8829, 41.8830, 41.8831, 41.8832, 41.8833, 41.8834, 41.8835, 41.8836, 42.0000],
        "longitude": [-87.6233, -87.6234, -87.6235, -87.6236, -87.6237, -87.6238, -87.6239, -87.6240, -87.6241, -87.6242, -87.9000],
    })
    analyzer = DBSCANHotspotAnalyzer(eps_meters=500.0, min_samples=5)
    analyzer.fit(coords)

    # 42.0000 is an isolated outlier coordinate and must be labeled noise (-1)
    assert analyzer.labels_[-1] == -1
    # Dense cluster points should be assigned cluster ID >= 0
    assert analyzer.labels_[0] >= 0

    # 16-cell (4x4) spatial grid with high-concentration cluster at cells 5, 6, 9, 10
    n = 16
    counts = pd.Series([5.0] * 16)
    counts.iloc[[5, 6, 9, 10]] = 50.0

    w = np.eye(n)
    for r in range(4):
        for c in range(4):
            idx = r * 4 + c
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < 4 and 0 <= nc < 4:
                    w[idx, nr * 4 + nc] = 1.0

    gi_df = GetisOrdSpatialAnalyzer.calculate_gi_star(counts, w)
    assert len(gi_df) == 16
    # Cluster cells 5 and 6 must be flagged as statistically significant hot spots (Gi* > 1.96)
    assert "HOT_SPOT" in gi_df["significance"].iloc[5]
