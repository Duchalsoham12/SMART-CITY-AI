"""
SmartCityAI - Pydantic Request & Response Schemas
Type-safe API contracts for request validation, pagination, filtering,
inference, analytics, geospatial GeoJSON, and insights.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field, ConfigDict

T = TypeVar("T")


# -------------------------------------------------------------------------
# Common & Pagination Schemas
# -------------------------------------------------------------------------

class PaginationParams(BaseModel):
    """Standard pagination query parameters."""
    page: int = Field(1, ge=1, description="Page number starting at 1")
    page_size: int = Field(20, ge=1, le=100, description="Items per page (max 100)")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic envelope for paginated collections."""
    items: List[T]
    total_count: int = Field(..., description="Total items matching filter")
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class ErrorResponse(BaseModel):
    """Unified API error format."""
    error_code: str
    detail: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    path: str


# -------------------------------------------------------------------------
# Traffic Schemas
# -------------------------------------------------------------------------

class TrafficRecordBase(BaseModel):
    segment_id: int = Field(..., ge=1, description="Roadway segment identifier")
    street_name: str = Field(..., min_length=2, max_length=100)
    speed_mph: float = Field(..., ge=0.0, le=120.0, description="Vehicle speed in mph")
    historical_speed_mph: Optional[float] = Field(None, ge=0.0, le=120.0)
    bus_count: int = Field(0, ge=0)
    recorded_at: datetime


class TrafficRecordCreate(TrafficRecordBase):
    pass


class TrafficRecordResponse(TrafficRecordBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TrafficForecastRequest(BaseModel):
    """Payload for real-time corridor traffic speed forecasting."""
    segment_id: int = Field(..., ge=1)
    current_speed_mph: float = Field(..., ge=0.0, le=120.0)
    horizon_hours: int = Field(1, ge=1, le=24, description="Forecast horizon: 1, 3, 6, 24 hours")
    hour_of_day: Optional[int] = Field(None, ge=0, le=23)
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    bus_count: int = Field(0, ge=0)


class TrafficForecastResponse(BaseModel):
    """Forecast response with 90% quantile prediction intervals."""
    segment_id: int
    predicted_speed_mph: float
    horizon_hours: int
    quantile_05: float
    quantile_50: float
    quantile_95: float
    congestion_level: str  # FREE_FLOW, MODERATE, CONGESTED, SEVERE
    model_version: str
    inference_timestamp_utc: datetime


# -------------------------------------------------------------------------
# Accident Safety Schemas
# -------------------------------------------------------------------------

class AccidentRecordBase(BaseModel):
    crash_record_id: str = Field(..., min_length=3, max_length=100)
    crash_date: datetime
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    injuries_total: int = Field(0, ge=0)
    fatalities_total: int = Field(0, ge=0)
    weather_condition: Optional[str] = "CLEAR"
    lighting_condition: Optional[str] = "DAYLIGHT"


class AccidentRecordCreate(AccidentRecordBase):
    pass


class AccidentRecordResponse(AccidentRecordBase):
    id: int
    h3_index: str
    risk_score: Optional[float] = None
    risk_tier: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AccidentRiskScoreRequest(BaseModel):
    """Real-time crash risk classification request."""
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    weather_condition: str = "CLEAR"
    lighting_condition: str = "DAYLIGHT"
    speed_ratio_to_freeflow: float = Field(1.0, ge=0.0, le=2.0)
    hour_of_day: int = Field(..., ge=0, le=23)
    is_weekend: bool = False


class AccidentRiskScoreResponse(BaseModel):
    """Safety risk inference with SHAP attributions and non-causal disclaimer."""
    h3_index: str
    predicted_risk_score: float
    risk_tier: str  # LOW, MEDIUM, HIGH, CRITICAL
    uncertainty_interval: List[float]  # [lower_bound, upper_bound]
    top_contributing_features: List[Dict[str, Any]]
    model_version: str
    epistemic_disclaimer: str


# -------------------------------------------------------------------------
# Environment / Air Quality Schemas
# -------------------------------------------------------------------------

class AirQualityRecordBase(BaseModel):
    station_id: str = Field(..., min_length=2, max_length=50)
    station_name: str = Field(..., min_length=2, max_length=100)
    recorded_at: datetime
    aqi: float = Field(..., ge=0.0, le=1000.0)
    pm25: Optional[float] = Field(None, ge=0.0)
    pm10: Optional[float] = Field(None, ge=0.0)
    no2: Optional[float] = Field(None, ge=0.0)
    o3: Optional[float] = Field(None, ge=0.0)
    temperature_c: Optional[float] = Field(None, ge=-50.0, le=60.0)
    humidity_pct: Optional[float] = Field(None, ge=0.0, le=100.0)


class AirQualityRecordCreate(AirQualityRecordBase):
    pass


class AirQualityRecordResponse(AirQualityRecordBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AQIForecastRequest(BaseModel):
    station_id: str
    current_aqi: float = Field(..., ge=0.0)
    temperature_c: float = 20.0
    humidity_pct: float = 50.0
    wind_speed_mps: float = 3.5
    horizon_hours: int = Field(24, ge=1, le=72)


class AQIForecastResponse(BaseModel):
    station_id: str
    horizon_hours: int
    predicted_aqi: float
    uncertainty_bounds: List[float]
    pollutant_breakdown: Dict[str, float]
    air_quality_category: str  # GOOD, MODERATE, UNHEALTHY_SENSITIVE, UNHEALTHY, VERY_UNHEALTHY, HAZARDOUS
    model_version: str


# -------------------------------------------------------------------------
# Anomaly Schemas
# -------------------------------------------------------------------------

class AnomalyRecordResponse(BaseModel):
    id: int
    segment_id: int
    street_name: str
    detected_at: datetime
    observed_value: float
    expected_value: float
    residual_z_score: float
    anomaly_score: float
    anomaly_type: str
    is_confirmed: bool

    model_config = ConfigDict(from_attributes=True)


class AnomalyDetectionRequest(BaseModel):
    """Request to score incoming sensor telemetry against baseline distributions."""
    segment_id: int
    street_name: str
    observed_speed_mph: float
    expected_speed_mph: float
    bus_count: int = 0
    hour_of_day: int = Field(12, ge=0, le=23)


class AnomalyDetectionResponse(BaseModel):
    segment_id: int
    street_name: str
    is_anomaly: bool
    residual_z_score: float
    anomaly_score: float
    anomaly_type: str
    severity: str  # NORMAL, MILD_DEVIATION, SEVERE_ANOMALY
    action_recommendation: str


# -------------------------------------------------------------------------
# Geospatial GeoJSON Schemas
# -------------------------------------------------------------------------

class GeoJSONGeometry(BaseModel):
    type: str  # "Polygon", "Point", "MultiPolygon"
    coordinates: Any


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: Dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]


# -------------------------------------------------------------------------
# AI Insights & Assistant Schemas
# -------------------------------------------------------------------------

class InsightQueryRequest(BaseModel):
    query_text: str = Field(..., min_length=3, description="Natural language question")
    session_id: str = "web_session"


class CityHealthSummaryResponse(BaseModel):
    city_name: str
    timestamp_utc: datetime
    active_traffic_congestion_zones: int
    high_risk_accident_corridors: int
    current_city_average_aqi: float
    aqi_status_category: str
    active_anomalies_detected_24h: int
    overall_urban_stress_index: float  # 0.0 to 1.0


# -------------------------------------------------------------------------
# System Health Check Schemas
# -------------------------------------------------------------------------

class ComponentHealth(BaseModel):
    status: str  # HEALTHY, DEGRADED, UNHEALTHY
    details: Optional[Dict[str, Any]] = None


class HealthCheckResponse(BaseModel):
    status: str
    version: str
    environment: str
    uptime_seconds: float
    timestamp_utc: datetime
    components: Dict[str, ComponentHealth]


# -------------------------------------------------------------------------
# Dataset Ingestion & Management Schemas
# -------------------------------------------------------------------------

class DataQualityReport(BaseModel):
    completeness_score: float = Field(..., ge=0.0, le=100.0, description="Percentage of non-null mandatory fields")
    validity_score: float = Field(..., ge=0.0, le=100.0, description="Percentage within valid physical range")
    uniqueness_score: float = Field(..., ge=0.0, le=100.0, description="Percentage of unique non-duplicate records")
    consistency_score: float = Field(..., ge=0.0, le=100.0, description="Cross-field logical consistency score")
    total_records: int
    valid_records: int
    quarantined_records: int
    is_approved: bool
    warnings: List[str] = []


class DatasetSummary(BaseModel):
    dataset_name: str
    category: str  # traffic, accidents, air_quality, custom
    version_id: str
    sha256_hash: str
    row_count: int
    columns: List[str]
    quality_score: float
    created_at_utc: str
    is_active: bool = True
    manifest_path: Optional[str] = None


class ColumnMappingItem(BaseModel):
    source_column: str
    suggested_target: str
    confidence: float
    data_type: str
    sample_values: List[str] = []


class DatasetUploadResponse(BaseModel):
    success: bool
    message: str
    dataset_name: str
    version_id: str
    sha256_hash: str
    total_rows: int
    valid_rows: int
    quarantined_rows: int
    quality_report: DataQualityReport
    preview_records: List[Dict[str, Any]] = []

