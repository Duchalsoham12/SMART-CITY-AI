"""
SmartCityAI - Models Package
Exports SQLAlchemy declarative models.
"""

from backend.models.orm_models import (
    TrafficRecordModel,
    AccidentRecordModel,
    AirQualityRecordModel,
    AnomalyRecordModel,
    AuditLogModel,
)

__all__ = [
    "TrafficRecordModel",
    "AccidentRecordModel",
    "AirQualityRecordModel",
    "AnomalyRecordModel",
    "AuditLogModel",
]
