"""
SmartCityAI - FastAPI Backend Application Entry Point
Production-grade RESTful API combining urban predictive analytics, forecasting,
geospatial intelligence, explainable safety risk modeling, and LLM-assisted decision support.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import init_db
from backend.middleware.error_handling import register_exception_handlers
from backend.middleware.logging_middleware import StructuredLoggingMiddleware
from backend.routers import (
    accidents_router,
    anomalies_router,
    environment_router,
    forecast_router,
    geospatial_router,
    health_router,
    insights_router,
    traffic_router,
)

# OpenAPI Tags Metadata
TAGS_METADATA = [
    {
        "name": "Traffic Analytics & Forecasting",
        "description": "Corridor vehicle speed monitoring, ingestion, and non-parametric quantile forecasting.",
    },
    {
        "name": "Accident Risk & Safety Analytics",
        "description": "Historical incident tracking, automatic H3 spatial binning, and SHAP-based risk scoring.",
    },
    {
        "name": "Environmental & Air Quality",
        "description": "Atmospheric sensor telemetry, EPA AQI index mapping, and multi-pollutant forecasting.",
    },
    {
        "name": "Predictive Forecasting",
        "description": "Consolidated cross-domain forecasting endpoints with uncertainty intervals.",
    },
    {
        "name": "Urban Anomaly Detection",
        "description": "Isolation Forest and residual Z-score outlier detection for real-time sensor streams.",
    },
    {
        "name": "Geospatial Intelligence",
        "description": "H3 hexagonal risk grids (with Empirical Bayes rate smoothing) and spatial DBSCAN hotspot GeoJSON layers.",
    },
    {
        "name": "AI Insights & Urban Assistant",
        "description": "Natural language decision support strictly grounded in verified platform facts with zero hallucination.",
    },
    {
        "name": "System Health & Diagnostics",
        "description": "Liveness, readiness probes, database connectivity, and ML model fleet diagnostics.",
    },
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: initializes database tables and warms up model caches."""
    init_db()
    yield


def create_application() -> FastAPI:
    """Application factory for SmartCityAI API."""
    init_db()
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        openapi_tags=TAGS_METADATA,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        lifespan=lifespan,
    )

    # 1. CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Authorization", "X-API-Key", "Content-Type", "X-Request-ID", "Accept"],
    )

    # 2. Structured Logging Middleware
    app.add_middleware(StructuredLoggingMiddleware)

    # 3. Global Exception Handlers
    register_exception_handlers(app)

    # 4. Mount API v1 Routers
    api_prefix = settings.API_V1_PREFIX
    app.include_router(traffic_router, prefix=api_prefix)
    app.include_router(accidents_router, prefix=api_prefix)
    app.include_router(environment_router, prefix=api_prefix)
    app.include_router(forecast_router, prefix=api_prefix)
    app.include_router(anomalies_router, prefix=api_prefix)
    app.include_router(geospatial_router, prefix=api_prefix)
    app.include_router(insights_router, prefix=api_prefix)
    app.include_router(health_router, prefix=api_prefix)

    @app.get("/", tags=["Platform Overview"])
    def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "OPERATIONAL",
            "docs_url": "/docs",
            "redoc_url": "/redoc",
            "openapi_spec": f"{settings.API_V1_PREFIX}/openapi.json",
            "health_check": f"{settings.API_V1_PREFIX}/health",
        }

    return app


app = create_application()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
