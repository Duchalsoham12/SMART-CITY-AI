"""
SmartCityAI - Accidents & Safety Risk API Router
Endpoints for crash data retrieval, incident ingestion, and real-time safety risk scoring with SHAP.
"""

from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.auth import AuthenticatedUser, require_role
from backend.database import get_db
from backend.schemas.api_schemas import (
    AccidentRecordCreate,
    AccidentRecordResponse,
    AccidentRiskScoreRequest,
    AccidentRiskScoreResponse,
    PaginatedResponse,
)
from backend.services.accident_service import AccidentService

router = APIRouter(prefix="/accidents", tags=["Accident Risk & Safety Analytics"])


@router.get(
    "",
    response_model=PaginatedResponse[AccidentRecordResponse],
    summary="List historical accident records",
    description="Retrieve paginated accident records with optional risk tier and injury count filters.",
)
def get_accident_records(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    risk_tier: Optional[str] = Query(None, description="Filter by risk tier: LOW, MEDIUM, HIGH, CRITICAL"),
    min_injuries: Optional[int] = Query(None, ge=0, description="Minimum reported injuries"),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("viewer")),
):
    records, total_count = AccidentService.get_records(
        db=db,
        page=page,
        page_size=page_size,
        risk_tier=risk_tier,
        min_injuries=min_injuries,
    )
    total_pages = ceil(total_count / page_size) if total_count > 0 else 1

    return PaginatedResponse[AccidentRecordResponse](
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
    response_model=AccidentRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest new crash incident record",
    description="Ingests a verified traffic crash record with automatic H3 spatial binning.",
)
def create_accident_record(
    record_in: AccidentRecordCreate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("analyst")),
):
    return AccidentService.create_record(db=db, record_in=record_in)


@router.post(
    "/score-risk",
    response_model=AccidentRiskScoreResponse,
    summary="Evaluate real-time crash risk with SHAP attributions",
    description="Computes calibrated crash probability, severity tier, uncertainty bounds, and SHAP feature attributions.",
)
def score_crash_risk(
    risk_req: AccidentRiskScoreRequest,
    user: AuthenticatedUser = Depends(require_role("viewer")),
):
    return AccidentService.score_risk(risk_req)
