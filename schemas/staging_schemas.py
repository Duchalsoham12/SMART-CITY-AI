"""
SmartCityAI - Staging Data Schemas
Defines schema contracts for cleaned, harmonized, and audited staging records.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class StagingTrafficRecord(BaseModel):
    """Cleaned, harmonized traffic observation in staging."""
    segment_id: int
    street_name: str
    direction: str = "UNKNOWN"
    observation_time_utc: datetime
    speed_mph: float = Field(..., ge=0.0, le=150.0)
    free_flow_speed_mph: float = Field(..., ge=0.0)
    congestion_ratio: float = Field(..., ge=0.0)
    start_latitude: float
    start_longitude: float
    end_latitude: float
    end_longitude: float
    is_valid_coordinate: bool
    is_imputed_speed: bool
    is_outlier_speed: bool
    outlier_category: str = "NORMAL" # NORMAL, SENSOR_FAULT, EXTREME_CONGESTION
    source_batch_id: str


class StagingCrashRecord(BaseModel):
    """Cleaned, spatially conflated crash record in staging."""
    crash_record_id: str
    crash_time_utc: datetime
    severity_tier: int = Field(..., ge=0, le=2) # 0: Property Damage, 1: Minor, 2: Fatal/Severe
    injuries_total: int = Field(0, ge=0)
    injuries_fatal: int = Field(0, ge=0)
    weather_condition: str
    lighting_condition: str
    road_defect: str
    latitude: float
    longitude: float
    is_valid_coordinate: bool
    matched_segment_id: Optional[int] = None
    distance_to_segment_meters: Optional[float] = None
    h3_res8_index: Optional[str] = None
    source_batch_id: str


class StagingAirQualityRecord(BaseModel):
    """Cleaned, wide-format air quality observation in staging."""
    station_id: str
    station_name: str
    observation_time_utc: datetime
    pm25: float = Field(..., ge=0.0, le=2000.0)
    pm10: Optional[float] = Field(None, ge=0.0, le=3000.0)
    no2: Optional[float] = Field(None, ge=0.0, le=1000.0)
    o3: Optional[float] = Field(None, ge=0.0, le=1000.0)
    latitude: float
    longitude: float
    is_valid_coordinate: bool
    is_imputed_pm25: bool
    is_outlier_pm25: bool
    source_batch_id: str
