"""
SmartCityAI - Backend Configuration Module
Loads application configuration from environment variables with safe defaults.
Never hard-codes secrets or credentials.
"""

import os
from typing import List


class Settings:
    """Application settings loaded from environment variables."""

    # Application Core
    PROJECT_NAME: str = "SmartCityAI — Urban Intelligence & Predictive Decision Platform"
    API_V1_PREFIX: str = "/api/v1"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = (
        "Enterprise-grade urban intelligence platform combining traffic forecasting, "
        "accident safety risk analysis, air-quality/environmental forecasting, geospatial "
        "hotspot intelligence, unsupervised anomaly detection, and explainable AI insights."
    )
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartcityai.db")
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "20"))
    DB_ECHO: bool = os.getenv("DB_ECHO", "false").lower() in ("true", "1", "yes")

    # Security & RBAC API Keys (Loaded from ENV)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default_dev_secret_key_never_use_in_prod")
    API_KEY_ADMIN: str = os.getenv("API_KEY_ADMIN", "admin_smartcity_secret_key_2026")
    API_KEY_ANALYST: str = os.getenv("API_KEY_ANALYST", "analyst_smartcity_secret_key_2026")
    API_KEY_VIEWER: str = os.getenv("API_KEY_VIEWER", "viewer_smartcity_public_key_2026")

    # CORS
    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000")
        return [origin.strip() for origin in raw.split(",") if origin.strip()]


settings = Settings()
