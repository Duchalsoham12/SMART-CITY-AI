"""
SmartCityAI - Consolidated Forecasting API Router
Unified endpoint for corridor traffic speed and environmental AQI forecasting.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends
from backend.auth import AuthenticatedUser, require_role
from backend.schemas.api_schemas import (
    AQIForecastRequest,
    AQIForecastResponse,
    TrafficForecastRequest,
    TrafficForecastResponse,
)
from backend.services.environment_service import EnvironmentService
from backend.services.traffic_service import TrafficService

router = APIRouter(prefix="/forecast", tags=["Predictive Forecasting"])


@router.get(
    "",
    summary="List available forecasting horizons and models",
    description="Returns metadata on active predictive forecasting models, supported horizons, and metrics.",
)
def get_forecasting_catalog(
    user: AuthenticatedUser = Depends(require_role("viewer")),
) -> Dict[str, Any]:
    return {
        "status": "OPERATIONAL",
        "supported_domains": {
            "traffic": {
                "model_type": "Quantile Gradient Boosting (LightGBM)",
                "horizons": ["1h", "3h", "6h"],
                "quantiles": [0.05, 0.50, 0.95],
                "target": "speed_mph",
            },
            "air_quality": {
                "model_type": "Multi-Target Atmospheric Forecaster (XGBoost)",
                "horizons": ["24h", "48h"],
                "targets": ["aqi", "pm25", "pm10", "no2", "o3"],
            },
        },
    }


@router.post(
    "/traffic",
    response_model=TrafficForecastResponse,
    summary="Corridor traffic speed quantile forecast",
    description="Predicts traffic speed with non-parametric 90% prediction intervals.",
)
def forecast_traffic(
    req: TrafficForecastRequest,
    user: AuthenticatedUser = Depends(require_role("viewer")),
):
    return TrafficService.forecast_speed(req)


@router.post(
    "/aqi",
    response_model=AQIForecastResponse,
    summary="Atmospheric air quality forecast",
    description="Predicts AQI and multi-pollutant breakdown for a 24-hour horizon.",
)
def forecast_air_quality(
    req: AQIForecastRequest,
    user: AuthenticatedUser = Depends(require_role("viewer")),
):
    return EnvironmentService.forecast_aqi(req)
