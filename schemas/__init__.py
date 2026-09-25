"""SmartCityAI Schema Package"""

from .raw_schemas import (
    RawTrafficRecord,
    RawCrashRecord,
    RawAirQualityRecord,
    RawWeatherRecord,
)
from .staging_schemas import (
    StagingTrafficRecord,
    StagingCrashRecord,
    StagingAirQualityRecord,
)
from .feature_schemas import (
    TrafficFeatureRecord,
    FeatureValidationReport,
)

__all__ = [
    "RawTrafficRecord",
    "RawCrashRecord",
    "RawAirQualityRecord",
    "RawWeatherRecord",
    "StagingTrafficRecord",
    "StagingCrashRecord",
    "StagingAirQualityRecord",
    "TrafficFeatureRecord",
    "FeatureValidationReport",
]
