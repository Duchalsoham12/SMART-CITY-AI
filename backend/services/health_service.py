"""
SmartCityAI - Health Check Service Layer
Validates database connectivity, ML model fleet readiness, and infrastructure health.
"""

from datetime import datetime, timezone
import time
from typing import Dict
from sqlalchemy import text
from sqlalchemy.orm import Session
from backend.config import settings
from backend.schemas.api_schemas import ComponentHealth, HealthCheckResponse
from backend.services.accident_service import AccidentService
from backend.services.anomaly_service import AnomalyService
from backend.services.environment_service import EnvironmentService
from backend.services.traffic_service import TrafficService

# Application start time marker
APP_START_TIME = time.time()


class HealthService:
    """Service verifying operational readiness across all platform subsystems."""

    @staticmethod
    def check_health(db: Session) -> HealthCheckResponse:
        """Executes full diagnostic pass across database and ML models."""
        components: Dict[str, ComponentHealth] = {}
        all_healthy = True

        # 1. Database Check
        try:
            db.execute(text("SELECT 1"))
            components["database"] = ComponentHealth(
                status="HEALTHY",
                details={"dialect": db.bind.dialect.name, "pool_status": "connected"},
            )
        except Exception as e:
            all_healthy = False
            components["database"] = ComponentHealth(
                status="UNHEALTHY",
                details={"error": str(e)},
            )

        # 2. Traffic Forecaster Model Check
        try:
            TrafficService.get_forecaster()
            components["traffic_forecaster_model"] = ComponentHealth(
                status="HEALTHY",
                details={"model": "QuantileForecaster", "version": "v2.1"},
            )
        except Exception as e:
            all_healthy = False
            components["traffic_forecaster_model"] = ComponentHealth(
                status="DEGRADED",
                details={"error": str(e)},
            )

        # 3. Accident Risk Classifier Check
        try:
            AccidentService.get_classifier()
            components["accident_risk_model"] = ComponentHealth(
                status="HEALTHY",
                details={"model": "AccidentRiskClassifier", "version": "v1.4"},
            )
        except Exception as e:
            all_healthy = False
            components["accident_risk_model"] = ComponentHealth(
                status="DEGRADED",
                details={"error": str(e)},
            )

        # 4. AQI Forecaster Check
        try:
            EnvironmentService.get_forecaster()
            components["aqi_forecaster_model"] = ComponentHealth(
                status="HEALTHY",
                details={"model": "AQIForecaster", "version": "v1.3"},
            )
        except Exception as e:
            all_healthy = False
            components["aqi_forecaster_model"] = ComponentHealth(
                status="DEGRADED",
                details={"error": str(e)},
            )

        # 5. Anomaly Detector Check
        try:
            AnomalyService.get_detector()
            components["anomaly_detector_model"] = ComponentHealth(
                status="HEALTHY",
                details={"model": "UrbanAnomalyDetector", "version": "v1.0"},
            )
        except Exception as e:
            all_healthy = False
            components["anomaly_detector_model"] = ComponentHealth(
                status="DEGRADED",
                details={"error": str(e)},
            )

        uptime = round(time.time() - APP_START_TIME, 2)
        overall_status = "HEALTHY" if all_healthy else "DEGRADED"

        return HealthCheckResponse(
            status=overall_status,
            version=settings.VERSION,
            environment=settings.ENVIRONMENT,
            uptime_seconds=uptime,
            timestamp_utc=datetime.now(timezone.utc),
            components=components,
        )
