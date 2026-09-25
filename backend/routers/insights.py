"""
SmartCityAI - AI Insights API Router
Endpoints for querying the Urban Analytics Assistant and retrieving automated city health summaries.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends
from backend.auth import AuthenticatedUser, require_role
from backend.schemas.api_schemas import (
    CityHealthSummaryResponse,
    InsightQueryRequest,
)
from backend.services.insights_service import InsightsService

router = APIRouter(prefix="/insights", tags=["AI Insights & Urban Assistant"])


@router.post(
    "/ask",
    summary="Query the AI-Powered Urban Analytics Assistant",
    description="Natural language Q&A engine strictly grounded in verified platform data with zero numerical hallucination.",
)
def ask_assistant(
    req: InsightQueryRequest,
    user: AuthenticatedUser = Depends(require_role("viewer")),
) -> Dict[str, Any]:
    return InsightsService.answer_query(
        query_text=req.query_text,
        session_id=req.session_id,
        user_role=user.role,
    )


@router.get(
    "/city-summary",
    response_model=CityHealthSummaryResponse,
    summary="Get automated metropolitan health and stress summary",
    description="Aggregates active traffic congestion, crash risk blackspots, average AQI, and anomaly counts into an urban stress index.",
)
def get_city_summary(
    user: AuthenticatedUser = Depends(require_role("viewer")),
):
    return InsightsService.get_city_health_summary()
