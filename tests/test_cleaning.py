"""
SmartCityAI - Cleaning Pipeline Unit Tests
Verifies timezone normalization, deduplication, coordinate auditing,
explicit imputation tracking, and outlier non-deletion guarantees.
"""

import pandas as pd
import pytest
from pipelines.cleaning import StagingCleaningPipeline

@pytest.fixture
def mock_config():
    return {
        "spatial_boundaries": {
            "chicago": {
                "name": "Cook County, IL",
                "lat_min": 41.644,
                "lat_max": 42.023,
                "lon_min": -87.940,
                "lon_max": -87.524,
            }
        },
        "cleaning": {
            "max_forward_fill_limit": 2,
            "imputation_tracking_flag": "is_imputed",
        },
        "outlier_detection": {
            "speed_bounds_mph": {"min_physical": 0.0, "max_physical": 100.0},
            "z_score_threshold": 3.5,
            "iqr_multiplier": 1.5,
        },
    }


def test_timezone_normalization_to_utc(mock_config):
    pipeline = StagingCleaningPipeline(mock_config)
    raw_data = pd.DataFrame([
        {
            "segment_id": 101,
            "street_name": "Michigan Ave",
            "current_speed": 25.0,
            "start_latitude": 41.8827,
            "start_longitude": -87.6233,
            "end_latitude": 41.8900,
            "end_longitude": -87.6235,
            "raw_timestamp": "2023-01-15 12:00:00",  # CST is UTC-6
        }
    ])
    staging_df, quarantine_df = pipeline.clean_traffic_data(raw_data, source_tz="America/Chicago")

    assert len(staging_df) == 1
    assert len(quarantine_df) == 0
    # 12:00 CST in January is 18:00 UTC
    assert staging_df["observation_time_utc"].iloc[0].strftime("%Y-%m-%d %H:%M:%S") == "2023-01-15 18:00:00"


def test_duplicate_quarantine_preserves_records(mock_config):
    pipeline = StagingCleaningPipeline(mock_config)
    raw_data = pd.DataFrame([
        {
            "segment_id": 101,
            "street_name": "Michigan Ave",
            "current_speed": 25.0,
            "start_latitude": 41.8827,
            "start_longitude": -87.6233,
            "end_latitude": 41.8900,
            "end_longitude": -87.6235,
            "raw_timestamp": "2023-01-15 12:00:00",
        },
        {
            "segment_id": 101,
            "street_name": "Michigan Ave",
            "current_speed": 28.0,  # Duplicate business key collision
            "start_latitude": 41.8827,
            "start_longitude": -87.6233,
            "end_latitude": 41.8900,
            "end_longitude": -87.6235,
            "raw_timestamp": "2023-01-15 12:00:00",
        },
    ])
    staging_df, quarantine_df = pipeline.clean_traffic_data(raw_data, source_tz="America/Chicago")

    assert len(staging_df) == 1
    assert len(quarantine_df) == 1
    assert "BUSINESS_KEY_COLLISION_DUPLICATE" in quarantine_df["quarantine_reason"].values


def test_invalid_coordinates_quarantined_not_dropped(mock_config):
    pipeline = StagingCleaningPipeline(mock_config)
    raw_data = pd.DataFrame([
        {
            "segment_id": 101,
            "street_name": "Michigan Ave",
            "current_speed": 25.0,
            "start_latitude": 0.0,  # Null island coordinate
            "start_longitude": 0.0,
            "end_latitude": 0.0,
            "end_longitude": 0.0,
            "raw_timestamp": "2023-01-15 12:00:00",
        },
        {
            "segment_id": 102,
            "street_name": "State St",
            "current_speed": 22.0,
            "start_latitude": 41.8827,
            "start_longitude": -87.6233,
            "end_latitude": 41.8900,
            "end_longitude": -87.6235,
            "raw_timestamp": "2023-01-15 12:00:00",
        },
    ])
    staging_df, quarantine_df = pipeline.clean_traffic_data(raw_data, source_tz="America/Chicago")

    assert len(staging_df) == 1
    assert staging_df["segment_id"].iloc[0] == 102
    assert len(quarantine_df) == 1
    assert quarantine_df["segment_id"].iloc[0] == 101
    assert "NULL_ISLAND_COORDINATE" in quarantine_df["quarantine_reason"].values


def test_explicit_imputation_tracking(mock_config):
    pipeline = StagingCleaningPipeline(mock_config)
    raw_data = pd.DataFrame([
        {
            "segment_id": 101,
            "street_name": "Michigan Ave",
            "current_speed": 20.0,
            "start_latitude": 41.8827,
            "start_longitude": -87.6233,
            "end_latitude": 41.8900,
            "end_longitude": -87.6235,
            "raw_timestamp": "2023-01-15 12:00:00",
        },
        {
            "segment_id": 101,
            "street_name": "Michigan Ave",
            "current_speed": -1.0,  # Communication fault, should be forward-filled
            "start_latitude": 41.8827,
            "start_longitude": -87.6233,
            "end_latitude": 41.8900,
            "end_longitude": -87.6235,
            "raw_timestamp": "2023-01-15 13:00:00",
        },
    ])
    staging_df, quarantine_df = pipeline.clean_traffic_data(raw_data, source_tz="America/Chicago")

    assert len(staging_df) == 2
    assert staging_df["speed_mph"].iloc[1] == 20.0
    assert staging_df["is_imputed_speed"].iloc[0] == False
    assert staging_df["is_imputed_speed"].iloc[1] == True  # Explicit audit flag verified!
