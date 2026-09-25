"""
SmartCityAI - Routers Package
Exports API route handlers for traffic, accidents, environment, forecast, anomalies, geospatial, insights, and health.
"""

from backend.routers.traffic import router as traffic_router
from backend.routers.accidents import router as accidents_router
from backend.routers.environment import router as environment_router
from backend.routers.forecast import router as forecast_router
from backend.routers.anomalies import router as anomalies_router
from backend.routers.geospatial import router as geospatial_router
from backend.routers.insights import router as insights_router
from backend.routers.health import router as health_router

__all__ = [
    "traffic_router",
    "accidents_router",
    "environment_router",
    "forecast_router",
    "anomalies_router",
    "geospatial_router",
    "insights_router",
    "health_router",
]
