"""
SmartCityAI - SQLAlchemy ORM Models
Declarative schemas for urban domain data tables and platform audit logging.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
)
from backend.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class TrafficRecordModel(Base):
    """Traffic telemetry and corridor speed measurements."""
    __tablename__ = "traffic_records"
    __table_args__ = (
        Index("idx_traffic_segment_recorded", "segment_id", "recorded_at"),
        Index("idx_traffic_street_recorded", "street_name", "recorded_at"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    segment_id = Column(Integer, index=True, nullable=False)
    street_name = Column(String(100), index=True, nullable=False)
    speed_mph = Column(Float, nullable=False)
    historical_speed_mph = Column(Float, nullable=True)
    bus_count = Column(Integer, default=0)
    recorded_at = Column(DateTime(timezone=True), index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class AccidentRecordModel(Base):
    """Accident incident records and risk assessment tiers."""
    __tablename__ = "accident_records"
    __table_args__ = (
        Index("idx_accident_h3_date", "h3_index", "crash_date"),
        Index("idx_accident_tier_date", "risk_tier", "crash_date"),
        Index("idx_accident_lat_lon", "latitude", "longitude"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    crash_record_id = Column(String(100), unique=True, index=True, nullable=False)
    crash_date = Column(DateTime(timezone=True), index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    h3_index = Column(String(20), index=True, nullable=False)
    injuries_total = Column(Integer, default=0)
    fatalities_total = Column(Integer, default=0)
    weather_condition = Column(String(50), nullable=True, default="CLEAR")
    lighting_condition = Column(String(50), nullable=True, default="DAYLIGHT")
    risk_score = Column(Float, nullable=True)
    risk_tier = Column(String(20), nullable=True, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    created_at = Column(DateTime(timezone=True), default=utc_now)


class AirQualityRecordModel(Base):
    """Environmental sensor readings and pollutant concentrations."""
    __tablename__ = "air_quality_records"
    __table_args__ = (
        Index("idx_aqi_station_recorded", "station_id", "recorded_at"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(String(50), index=True, nullable=False)
    station_name = Column(String(100), nullable=False)
    recorded_at = Column(DateTime(timezone=True), index=True, nullable=False)
    aqi = Column(Float, nullable=False)
    pm25 = Column(Float, nullable=True)
    pm10 = Column(Float, nullable=True)
    no2 = Column(Float, nullable=True)
    o3 = Column(Float, nullable=True)
    temperature_c = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class AnomalyRecordModel(Base):
    """Detected urban metric anomalies and statistical residual scores."""
    __tablename__ = "anomaly_records"
    __table_args__ = (
        Index("idx_anomaly_segment_detected", "segment_id", "detected_at"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    segment_id = Column(Integer, index=True, nullable=False)
    street_name = Column(String(100), nullable=False)
    detected_at = Column(DateTime(timezone=True), index=True, nullable=False)
    observed_value = Column(Float, nullable=False)
    expected_value = Column(Float, nullable=False)
    residual_z_score = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    anomaly_type = Column(String(50), nullable=False)  # UNEXPECTED_SLOWDOWN, REVERSE_FLOW, etc.
    is_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class AuditLogModel(Base):
    """Platform security and access governance audit records."""
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_role_timestamp", "user_role", "timestamp_utc"),
        Index("idx_audit_endpoint_timestamp", "endpoint", "timestamp_utc"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trace_id = Column(String(50), index=True, nullable=False)
    timestamp_utc = Column(DateTime(timezone=True), index=True, nullable=False)
    user_role = Column(String(50), nullable=False)
    endpoint = Column(String(200), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    duration_ms = Column(Float, nullable=False)
    ip_address = Column(String(50), nullable=True)
    request_summary = Column(Text, nullable=True)
