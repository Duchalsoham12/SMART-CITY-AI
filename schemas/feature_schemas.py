"""
SmartCityAI - Feature Matrix Schemas
Defines schema contracts for ML-ready feature matrices in the processed layer.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TrafficFeatureRecord(BaseModel):
    """Schema contract for an engineered traffic feature row."""
    segment_id: int
    observation_time_utc: datetime

    # Base state
    speed_mph: float = Field(..., ge=0.0)

    # Autoregressive lag features (lookback strictly backwards in time)
    speed_lag_1h: float = Field(..., ge=0.0)
    speed_lag_2h: float = Field(..., ge=0.0)
    speed_lag_3h: float = Field(..., ge=0.0)
    speed_lag_24h: float = Field(..., ge=0.0)
    speed_lag_168h: Optional[float] = Field(None, ge=0.0)

    # Rolling window aggregations (closed='left' to prevent leakage)
    speed_rolling_mean_3h: float = Field(..., ge=0.0)
    speed_rolling_std_3h: float = Field(..., ge=0.0)
    speed_rolling_mean_24h: float = Field(..., ge=0.0)
    speed_rolling_std_24h: float = Field(..., ge=0.0)

    # Cyclical temporal encodings
    hour_sin: float = Field(..., ge=-1.0, le=1.0)
    hour_cos: float = Field(..., ge=-1.0, le=1.0)
    day_sin: float = Field(..., ge=-1.0, le=1.0)
    day_cos: float = Field(..., ge=-1.0, le=1.0)
    is_weekend: int = Field(..., ge=0, le=1)

    # Weather covariates
    temperature_celsius: float
    precipitation_mm: float = Field(..., ge=0.0)
    wind_speed_kmh: float = Field(..., ge=0.0)

    # Imputation & Outlier tracking flags (preventing silent modifications)
    is_imputed: int = Field(..., ge=0, le=1)
    is_outlier: int = Field(..., ge=0, le=1)

    # Prediction target (lead at t+1h)
    target_speed_lead_1h: float = Field(..., ge=0.0)


class FeatureValidationReport(BaseModel):
    """Pre-flight check summary before model training."""
    dataset_name: str
    total_records: int
    total_features: int
    train_record_count: int
    val_record_count: int
    test_record_count: int
    feature_null_fractions: dict[str, float]
    target_null_count: int
    is_leakage_detected: bool
    is_approved_for_training: bool
    rejection_reasons: List[str] = Field(default_factory=list)
