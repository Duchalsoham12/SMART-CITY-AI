"""
SmartCityAI - Schema Unit Tests
Verifies Pydantic v2 input/output validation contracts.
"""

import pytest
from pydantic import ValidationError
from schemas.raw_schemas import RawTrafficRecord, RawCrashRecord, RawWeatherRecord


def test_raw_traffic_record_valid():
    record = RawTrafficRecord(
        segment_id=101,
        street_name="Michigan Ave",
        direction="NB",
        current_speed=25.5,
        free_flow_speed=30.0,
        start_latitude=41.8827,
        start_longitude=-87.6233,
        end_latitude=41.8900,
        end_longitude=-87.6235,
        raw_timestamp="2023-05-10 14:30:00",
    )
    assert record.segment_id == 101
    assert record.current_speed == 25.5


def test_raw_traffic_record_speed_boundary_violation():
    with pytest.raises(ValidationError):
        # Speed 250 mph exceeds sensor plausibility threshold
        RawTrafficRecord(
            segment_id=101,
            street_name="Michigan Ave",
            current_speed=250.0,
            start_latitude=41.8827,
            start_longitude=-87.6233,
            end_latitude=41.8900,
            end_longitude=-87.6235,
            raw_timestamp="2023-05-10 14:30:00",
        )


def test_raw_crash_record_defaults():
    crash = RawCrashRecord(
        crash_record_id="CRASH_TEST_001",
        crash_date="2023-06-15 08:45:00",
        injuries_total=1,
    )
    assert crash.weather_condition == "UNKNOWN"
    assert crash.injuries_fatal == 0
    assert crash.posted_speed_limit is None
