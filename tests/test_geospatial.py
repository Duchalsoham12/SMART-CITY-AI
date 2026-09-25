"""
SmartCityAI - Geospatial Intelligence Unit Tests
Verifies coordinate inversion detection, privacy geomasking, Empirical Bayes smoothing,
Kernel Density Estimation, and GeoJSON generation.
"""

import numpy as np
import pandas as pd
import pytest
from ml.geospatial.coordinate_transformer import CoordinateTransformer
from ml.geospatial.density_estimator import KernelDensityEstimator
from ml.geospatial.hex_aggregator import HexSpatialAggregator
from ml.geospatial.hotspot_detector import GeospatialHotspotDetector


@pytest.fixture
def mock_bbox():
    return {
        "lat_min": 41.644,
        "lat_max": 42.023,
        "lon_min": -87.940,
        "lon_max": -87.524,
    }


def test_coordinate_inversion_correction(mock_bbox):
    transformer = CoordinateTransformer(bounding_box=mock_bbox)
    # Row 0: Inverted! lat=-87.62, lon=41.88
    # Row 1: Normal! lat=41.88, lon=-87.62
    df = pd.DataFrame({
        "latitude": [-87.6233, 41.8827],
        "longitude": [41.8827, -87.6233],
    })
    valid_df, quarantine_df = transformer.validate_and_correct_inversion(df)

    assert len(valid_df) == 2
    assert len(quarantine_df) == 0
    # Inverted row must have its coordinates swapped and flagged
    assert valid_df["latitude"].iloc[0] == pytest.approx(41.8827, abs=1e-4)
    assert valid_df["longitude"].iloc[0] == pytest.approx(-87.6233, abs=1e-4)


def test_privacy_geomasking(mock_bbox):
    transformer = CoordinateTransformer(bounding_box=mock_bbox, privacy_jitter_meters=25.0)
    df = pd.DataFrame({
        "latitude": [41.8827] * 10,
        "longitude": [-87.6233] * 10,
    })
    masked_df = transformer.apply_privacy_geomasking(df, seed=42)

    assert "latitude_masked" in masked_df.columns
    assert "longitude_masked" in masked_df.columns
    assert masked_df["is_privacy_geomasked"].all()

    # Coordinates must be altered but remain within ~100m (< 0.001 deg)
    diff_lat = np.abs(masked_df["latitude_masked"] - df["latitude"])
    assert (diff_lat > 0.0).all()
    assert (diff_lat < 0.002).all()


def test_k_anonymity_suppression(mock_bbox):
    transformer = CoordinateTransformer(bounding_box=mock_bbox, k_anonymity_threshold=3)
    df = pd.DataFrame({
        "cell_id": ["cell_1", "cell_2", "cell_3"],
        "incident_count": [1, 2, 15],  # cell_1 and cell_2 must be suppressed
    })
    audited_df = transformer.apply_k_anonymity_suppression(df, cell_id_col="cell_id")

    assert audited_df["is_suppressed_for_privacy"].iloc[0] == True
    assert audited_df["is_suppressed_for_privacy"].iloc[1] == True
    assert audited_df["is_suppressed_for_privacy"].iloc[2] == False
    assert np.isnan(audited_df["incident_count_public"].iloc[0])
    assert audited_df["incident_count_public"].iloc[2] == 15


def test_empirical_bayes_rate_smoothing():
    # cell_0: low exposure (5 vehicles), 1 accident -> raw rate = 20% (Small Number Problem!)
    # cell_1: high exposure (10,000 vehicles), 50 accidents -> raw rate = 0.5%
    df = pd.DataFrame({
        "spatial_cell_id": ["sparse_cell", "dense_cell"],
        "incident_count": [1.0, 50.0],
        "traffic_volume_est": [5.0, 10000.0],
    })
    smoothed_df = HexSpatialAggregator.apply_empirical_bayes_smoothing(df)

    assert "raw_crash_rate" in smoothed_df.columns
    assert "eb_smoothed_rate" in smoothed_df.columns
    # Sparse cell raw rate is 0.20 (20%)
    assert smoothed_df["raw_crash_rate"].iloc[0] == 0.20
    # EB smoothed rate must shrink dramatically towards global mean (well below 0.10)
    assert smoothed_df["eb_smoothed_rate"].iloc[0] < 0.05
    assert smoothed_df["is_sparse_exposure"].iloc[0] == True


def test_kernel_density_estimator():
    df = pd.DataFrame({
        "latitude": [41.8827, 41.8828, 41.8829, 41.8830, 41.9500],
        "longitude": [-87.6233, -87.6234, -87.6235, -87.6236, -87.8000],
        "severity_tier": [2, 1, 0, 1, 0],
    })
    kde = KernelDensityEstimator(bandwidth_meters=200.0)
    kde.fit(df)

    # Query near dense cluster epicenter
    dense_density = kde.evaluate_points(np.array([41.8828]), np.array([-87.6234]))
    # Query far in sparse region
    sparse_density = kde.evaluate_points(np.array([41.7000]), np.array([-87.7000]))

    assert dense_density[0] > sparse_density[0]


def test_geojson_feature_collection_generation():
    df = pd.DataFrame({
        "latitude": [41.8827, 41.8828, 41.8829, 41.9500],
        "longitude": [-87.6233, -87.6234, -87.6235, -87.8000],
    })
    detector = GeospatialHotspotDetector(eps_meters=300.0, min_samples=2)
    clustered_df = detector.detect_clusters(df)

    geojson = GeospatialHotspotDetector.to_geojson_feature_collection(clustered_df)

    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) >= 1
    first_feat = geojson["features"][0]
    assert first_feat["geometry"]["type"] == "Point"
    assert "cluster_id" in first_feat["properties"]
    assert "severity_label" in first_feat["properties"]
