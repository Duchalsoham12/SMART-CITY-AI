"""
SmartCityAI - Services Package
Exports application service layer singletons and operations.
"""

from backend.services.traffic_service import TrafficService
from backend.services.accident_service import AccidentService
from backend.services.environment_service import EnvironmentService
from backend.services.anomaly_service import AnomalyService
from backend.services.geospatial_service import GeospatialService
from backend.services.insights_service import InsightsService
from backend.services.health_service import HealthService

__all__ = [
    "TrafficService",
    "AccidentService",
    "EnvironmentService",
    "AnomalyService",
    "GeospatialService",
    "InsightsService",
    "HealthService",
]
