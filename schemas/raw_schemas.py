"""
SmartCityAI - Raw Data Schemas
Defines strict Pydantic v2 validation contracts for raw ingestion from external APIs.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class RawTrafficRecord(BaseModel):
    """Validation contract for raw segment traffic observations."""
    segment_id: int = Field(..., description="Unique integer ID of the road segment")
    street_name: str = Field(..., min_length=1, description="Arterial street name")
    direction: Optional[str] = Field(None, description="Compass direction (NB, SB, EB, WB)")
    current_speed: float = Field(..., description="Observed vehicular speed in mph")
    free_flow_speed: Optional[float] = Field(None, description="Free-flow speed baseline in mph")
    start_latitude: float = Field(..., ge=-90.0, le=90.0, description="Segment start latitude")
    start_longitude: float = Field(..., ge=-180.0, le=180.0, description="Segment start longitude")
    end_latitude: float = Field(..., ge=-90.0, le=90.0, description="Segment end latitude")
    end_longitude: float = Field(..., ge=-180.0, le=180.0, description="Segment end longitude")
    raw_timestamp: str = Field(..., min_length=5, description="Raw source timestamp string")

    @field_validator("current_speed")
    @classmethod
    def validate_speed(cls, v: float) -> float:
        # Note: Raw data might have sensor communication errors (e.g. -1),
        # which must not cause schema rejection so they can be captured, audited, and cleaned.
        if v < -1.0 or v > 200.0:
            raise ValueError(f"Speed value {v} outside acceptable raw sensor range [-1.0, 200.0]")
        return v


class RawCrashRecord(BaseModel):
    """Validation contract for raw police traffic collision reports."""
    crash_record_id: str = Field(..., min_length=1, description="Primary unique crash report hash")
    crash_date: str = Field(..., description="Raw incident timestamp string")
    posted_speed_limit: Optional[int] = Field(None, ge=0, le=120)
    weather_condition: Optional[str] = Field("UNKNOWN", description="Reported weather")
    lighting_condition: Optional[str] = Field("UNKNOWN", description="Reported lighting")
    first_crash_type: Optional[str] = Field("UNKNOWN", description="Collision classification")
    trafficway_type: Optional[str] = Field("UNKNOWN", description="Roadway geometry")
    road_defect: Optional[str] = Field("UNKNOWN", description="Road surface defect")
    injuries_total: int = Field(0, ge=0, description="Total injury count")
    injuries_fatal: int = Field(0, ge=0, description="Total fatality count")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)


class RawAirQualityRecord(BaseModel):
    """Validation contract for raw ambient air monitoring stations."""
    station_id: str = Field(..., min_length=1, description="Unique monitor station identifier")
    station_name: str = Field(..., min_length=1)
    parameter_name: str = Field(..., description="Pollutant (PM2.5, PM10, NO2, O3, CO)")
    sample_measurement: float = Field(..., description="Measured pollutant concentration")
    units_of_measure: str = Field(..., min_length=1)
    raw_timestamp: str = Field(..., min_length=5)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class RawWeatherRecord(BaseModel):
    """Validation contract for raw meteorological observation/reanalysis."""
    raw_timestamp: str = Field(..., min_length=5)
    temperature_celsius: float = Field(..., ge=-60.0, le=65.0)
    relative_humidity: float = Field(..., ge=0.0, le=100.0)
    precipitation_mm: float = Field(..., ge=0.0)
    wind_speed_kmh: float = Field(..., ge=0.0, le=300.0)
    wind_direction_deg: float = Field(..., ge=0.0, le=360.0)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
