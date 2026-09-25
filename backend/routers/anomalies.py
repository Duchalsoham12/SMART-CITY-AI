"""
SmartCityAI - Urban Anomalies API Router
Endpoints for querying detected anomalies and evaluating real-time telemetry streams.
"""

from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.auth import AuthenticatedUser, require_role
from backend.database import get_db
from backend.schemas.api_schemas import (
    AnomalyDetectionRequest,
    AnomalyDetectionResponse,
    AnomalyRecordResponse,
    PaginatedResponse,
)
from backend.services.anomaly_service import AnomalyService

router = APIRouter(prefix="/anomalies", tags=["Urban Anomaly Detection"])


@router.get(
    "",
    response_model=PaginatedResponse[AnomalyRecordResponse],
    summary="List detected urban anomalies",
    description="Retrieve paginated anomalous events with optional Z-score threshold and anomaly type filters.",
)
def get_anomalies(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    min_z_score: Optional[float] = Query(None, ge=1.0, description="Minimum absolute Z-score deviation"),
    anomaly_type: Optional[str] = Query(None, description="Filter by anomaly classification type"),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("viewer")),
):
    records, total_count = AnomalyService.get_records(
        db=db,
        page=page,
        page_size=page_size,
        min_z_score=min_z_score,
        anomaly_type=anomaly_type,
    )
    total_pages = ceil(total_count / page_size) if total_count > 0 else 1

    return PaginatedResponse[AnomalyRecordResponse](
        items=records,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.post(
    "/detect",
    response_model=AnomalyDetectionResponse,
    summary="Score incoming sensor telemetry for anomalies",
    description="Evaluates observed telemetry against expected baseline distributions using Isolation Forest and residual Z-scores.",
)
def detect_telemetry_anomaly(
    req: AnomalyDetectionRequest,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("analyst")),
):
    return AnomalyService.detect_anomaly(req, db=db)
