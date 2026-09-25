"""
SmartCityAI - Traffic API Router
Endpoints for traffic telemetry data retrieval, ingestion, and corridor speed forecasting.
"""

from math import ceil
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.auth import AuthenticatedUser, require_role
from backend.database import get_db
from backend.schemas.api_schemas import (
    PaginatedResponse,
    TrafficForecastRequest,
    TrafficForecastResponse,
    TrafficRecordCreate,
    TrafficRecordResponse,
)
from backend.services.traffic_service import TrafficService

router = APIRouter(prefix="/traffic", tags=["Traffic Analytics & Forecasting"])


@router.get(
    "",
    response_model=PaginatedResponse[TrafficRecordResponse],
    summary="List corridor traffic telemetry records",
    description="Retrieve paginated traffic speed telemetry with optional street and speed range filtering.",
)
def get_traffic_records(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    street_name: Optional[str] = Query(None, description="Filter by corridor/street name"),
    min_speed: Optional[float] = Query(None, ge=0.0, description="Minimum speed in mph"),
    max_speed: Optional[float] = Query(None, le=120.0, description="Maximum speed in mph"),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("viewer")),
):
    records, total_count = TrafficService.get_records(
        db=db,
        page=page,
        page_size=page_size,
        street_name=street_name,
        min_speed=min_speed,
        max_speed=max_speed,
    )
    total_pages = ceil(total_count / page_size) if total_count > 0 else 1

    return PaginatedResponse[TrafficRecordResponse](
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
    response_model=TrafficRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest new traffic telemetry record",
    description="Ingests observed corridor speed telemetry from intelligent transportation sensors.",
)
def create_traffic_record(
    record_in: TrafficRecordCreate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("analyst")),
):
    return TrafficService.create_record(db=db, record_in=record_in)


@router.post(
    "/forecast",
    response_model=TrafficForecastResponse,
    summary="Generate corridor quantile speed forecast",
    description="Predicts corridor vehicle speeds with non-parametric 90% prediction intervals [q0.05, q0.95].",
)
def forecast_traffic_speed(
    forecast_req: TrafficForecastRequest,
    user: AuthenticatedUser = Depends(require_role("viewer")),
):
    return TrafficService.forecast_speed(forecast_req)


@router.post(
    "/forecast/batch",
    response_model=List[TrafficForecastResponse],
    summary="Generate vectorized batch corridor quantile speed forecasts",
    description="Predicts corridor vehicle speeds for multiple corridors concurrently in a single vectorized pass.",
)
def forecast_traffic_speed_batch(
    forecast_reqs: List[TrafficForecastRequest],
    user: AuthenticatedUser = Depends(require_role("viewer")),
):
    return TrafficService.forecast_speed_batch(forecast_reqs)

