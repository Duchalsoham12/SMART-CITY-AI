"""
SmartCityAI - Data Validation Test Suite
Verifies strict schema boundaries, coordinate bounding boxes, speed range checks,
explicit null-value tracking (no silent deletion), and duplicate detection quarantines.
"""

import pandas as pd
import numpy as np
import pytest

from pipelines.cleaning import StagingCleaningPipeline
from schemas.raw_schemas import RawTrafficRecord, RawCrashRecord, RawAirQualityRecord


@pytest.fixture
def cleaning_config():
    return {
        "spatial_boundaries": {
            "chicago": {
                "name": "Cook County / Urban Grid",
                "lat_min": 18.0,
                "lat_max": 42.5,
                "lon_min": -88.5,
                "lon_max": 74.5,
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


def test_speed_range_boundary_enforcement():
    """Verify that physical speed bounds [-1.0, 200.0] are strictly validated."""
    # Speed < -1.0 should fail validation
    with pytest.raises(Exception):
        RawTrafficRecord(
            segment_id=1,
            street_name="FC Road",
            current_speed=-5.0,
            start_latitude=18.5204,
            start_longitude=73.8567,
            end_latitude=18.5210,
            end_longitude=73.8570,
            raw_timestamp="2026-09-25 12:00:00",
        )

    # Speed > 200.0 should fail validation
    with pytest.raises(Exception):
        RawTrafficRecord(
            segment_id=1,
            street_name="FC Road",
            current_speed=240.0,
            start_latitude=18.5204,
            start_longitude=73.8567,
            end_latitude=18.5210,
            end_longitude=73.8570,
            raw_timestamp="2026-09-25 12:00:00",
        )


def test_coordinate_validity_and_bounding_box():
    """Verify coordinate domain constraints [-90, 90] lat, [-180, 180] lon."""
    # Invalid latitude > 90
    with pytest.raises(Exception):
        RawCrashRecord(
            crash_record_id="CR-BAD-LAT",
            crash_date="2026-09-25 12:00:00",
            latitude=95.0,
            longitude=73.8567,
        )

    # Invalid longitude > 180
    with pytest.raises(Exception):
        RawCrashRecord(
            crash_record_id="CR-BAD-LON",
            crash_date="2026-09-25 12:00:00",
            latitude=18.5204,
            longitude=195.0,
        )


def test_zero_silent_data_deletion_policy(cleaning_config):
    """Ensure data cleaner quarantines or explicitly tracks nulls rather than silently dropping."""
    cleaner = StagingCleaningPipeline(cleaning_config)

    df = pd.DataFrame([
        {
            "segment_id": 101,
            "street_name": "FC Road",
            "current_speed": 30.0,
            "start_latitude": 18.5204,
            "start_longitude": 73.8567,
            "end_latitude": 18.5210,
            "end_longitude": 73.8570,
            "raw_timestamp": "2026-09-25 10:00:00",
        },
        {
            "segment_id": 101,
            "street_name": "FC Road",
            "current_speed": -1.0,  # Missing indicator
            "start_latitude": 18.5204,
            "start_longitude": 73.8567,
            "end_latitude": 18.5210,
            "end_longitude": 73.8570,
            "raw_timestamp": "2026-09-25 10:15:00",
        },
    ])

    cleaned_df, quarantine_df = cleaner.clean_traffic_data(df)

    assert len(cleaned_df) + len(quarantine_df) == 2
    assert "is_imputed_speed" in cleaned_df.columns
    assert cleaned_df["is_imputed_speed"].sum() >= 1


def test_air_quality_record_validation():
    """Verify RawAirQualityRecord coordinates and structure."""
    record = RawAirQualityRecord(
        station_id="STN-01",
        station_name="Shivajinagar Ambient",
        parameter_name="PM2.5",
        sample_measurement=42.5,
        units_of_measure="ug/m3",
        raw_timestamp="2026-09-25 12:00:00",
        latitude=18.5204,
        longitude=73.8567,
    )
    assert record.station_id == "STN-01"
    assert record.sample_measurement == 42.5

    with pytest.raises(Exception):
        RawAirQualityRecord(
            station_id="STN-01",
            station_name="Shivajinagar",
            parameter_name="PM2.5",
            sample_measurement=42.5,
            units_of_measure="ug/m3",
            raw_timestamp="2026-09-25 12:00:00",
            latitude=118.5204,
            longitude=73.8567,
        )


def test_duplicate_detection_quarantine_integrity(cleaning_config):
    """Verify duplicate sensor records are isolated into quarantine without data destruction."""
    cleaner = StagingCleaningPipeline(cleaning_config)

    records = [
        {
            "segment_id": 101,
            "street_name": "Karve Road",
            "current_speed": 25.0,
            "start_latitude": 18.5204,
            "start_longitude": 73.8567,
            "end_latitude": 18.5210,
            "end_longitude": 73.8570,
            "raw_timestamp": "2026-09-25 10:00:00",
        },
        {
            "segment_id": 101,
            "street_name": "Karve Road",
            "current_speed": 25.0,
            "start_latitude": 18.5204,
            "start_longitude": 73.8567,
            "end_latitude": 18.5210,
            "end_longitude": 73.8570,
            "raw_timestamp": "2026-09-25 10:00:00",  # Exact duplicate
        },
    ]

    cleaned, quarantine = cleaner.clean_traffic_data(pd.DataFrame(records))
    assert len(cleaned) == 1
    assert len(quarantine) == 1
    assert quarantine.iloc[0]["quarantine_reason"] == "BUSINESS_KEY_COLLISION_DUPLICATE"
