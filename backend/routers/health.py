"""
SmartCityAI - Health Check API Router
Probes for liveness, database connectivity, and ML model fleet readiness.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas.api_schemas import HealthCheckResponse
from backend.services.health_service import HealthService

router = APIRouter(prefix="/health", tags=["System Health & Diagnostics"])


@router.get(
    "",
    response_model=HealthCheckResponse,
    summary="Comprehensive system health and readiness check",
    description="Diagnostics probe verifying database connectivity, ML model availability, and application uptime.",
)
def get_system_health(
    db: Session = Depends(get_db),
):
    return HealthService.check_health(db=db)
