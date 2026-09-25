"""
SmartCityAI - Environmental & Air Quality API Router
Endpoints for environmental sensor monitoring, reading ingestion, and AQI forecasting.
"""

from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.auth import AuthenticatedUser, require_role
from backend.database import get_db
from backend.schemas.api_schemas import (
    AQIForecastRequest,
    AQIForecastResponse,
    AirQualityRecordCreate,
    AirQualityRecordResponse,
    PaginatedResponse,
)
from backend.services.environment_service import EnvironmentService

router = APIRouter(prefix="/environment", tags=["Environmental & Air Quality"])


@router.get(
    "",
    response_model=PaginatedResponse[AirQualityRecordResponse],
    summary="List air quality monitoring records",
    description="Retrieve paginated environmental readings with optional station ID and AQI range filtering.",
)
def get_environment_records(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    station_id: Optional[str] = Query(None, description="Station identifier"),
    min_aqi: Optional[float] = Query(None, ge=0.0, description="Minimum AQI"),
    max_aqi: Optional[float] = Query(None, ge=0.0, description="Maximum AQI"),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("viewer")),
):
    records, total_count = EnvironmentService.get_records(
        db=db,
        page=page,
        page_size=page_size,
        station_id=station_id,
        min_aqi=min_aqi,
        max_aqi=max_aqi,
    )
    total_pages = ceil(total_count / page_size) if total_count > 0 else 1

    return PaginatedResponse[AirQualityRecordResponse](
        items=records,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.post(
    "",
    response_model=AirQualityRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest new air quality reading",
    description="Ingests atmospheric telemetry including AQI, PM2.5, PM10, NO2, O3, and weather parameters.",
)
def create_environment_record(
    record_in: AirQualityRecordCreate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("analyst")),
):
    return EnvironmentService.create_record(db=db, record_in=record_in)


@router.post(
    "/forecast",
    response_model=AQIForecastResponse,
    summary="Forecast atmospheric AQI and pollutant concentrations",
    description="Generates atmospheric AQI forecast with multi-pollutant breakdown and uncertainty estimates.",
)
def forecast_air_quality(
    forecast_req: AQIForecastRequest,
    user: AuthenticatedUser = Depends(require_role("viewer")),
):
    return EnvironmentService.forecast_aqi(forecast_req)
