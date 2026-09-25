# SmartCityAI — Backend RESTful API Specification

## 1. Executive Summary & Architectural Overview

The **SmartCityAI Backend** is an enterprise-grade RESTful application built with **FastAPI**, **PostgreSQL**, and **SQLAlchemy**. It exposes the platform's machine learning fleet, automated data pipelines, geospatial intelligence layers, and AI-powered Urban Analytics Assistant through high-throughput, asynchronous, and strictly validated endpoints.

```mermaid
flowchart TD
    Client["Client / Frontend / Sensor Stream"] --> Gateway["FastAPI API Gateway (v1)"]
    
    subgraph SecurityMiddleware ["Security & Governance Layer"]
        Gateway --> Logging["Structured JSON Logger (X-Request-ID, X-Process-Time-Ms)"]
        Logging --> Auth["RBAC Auth Gate (API Key / Bearer: viewer, analyst, admin)"]
        Auth --> Validation["Pydantic Request Validation & Global Exception Handlers"]
    end
    
    subgraph Routers ["API v1 Routers (/api/v1)"]
        Validation --> R_Traffic["/traffic (Telemetry & Quantile Forecast)"]
        Validation --> R_Accidents["/accidents (Crashes & SHAP Risk Scoring)"]
        Validation --> R_Env["/environment (Air Quality & Multi-Pollutant)"]
        Validation --> R_Forecast["/forecast (Consolidated Forecasting)"]
        Validation --> R_Anomalies["/anomalies (Isolation Forest Outlier Detection)"]
        Validation --> R_Geo["/geospatial (H3 Hexagonal Risk Grid & Hotspots GeoJSON)"]
        Validation --> R_Insights["/insights (Urban Assistant Grounded Q&A)"]
        Validation --> R_Health["/health (Diagnostics & Model Readiness Probe)"]
    end
    
    subgraph ServiceLayer ["Service & Model Inference Layer"]
        R_Traffic --> S_Traffic["TrafficService (QuantileForecaster LGBM)"]
        R_Accidents --> S_Accidents["AccidentService (XGBoost + SHAP Explainer)"]
        R_Env --> S_Env["EnvironmentService (AQIForecaster + MultiPollutant)"]
        R_Anomalies --> S_Anomalies["AnomalyService (IsolationForest + Z-Score)"]
        R_Geo --> S_Geo["GeospatialService (H3 + Empirical Bayes + DBSCAN)"]
        R_Insights --> S_Insights["InsightsService (UrbanAnalyticsAssistant)"]
        R_Health --> S_Health["HealthService (DB Ping + Fleet Diagnostics)"]
    end
    
    subgraph DataStorage ["Data & Model Storage"]
        S_Traffic & S_Accidents & S_Env & S_Anomalies --> Postgres["PostgreSQL / SQLAlchemy ORM"]
        S_Insights --> AuditLog["Audit Stream (JSONL)"]
    end
```

---

## 2. Environment Configuration & Security Architecture

### Zero Hardcoded Credentials Policy
All secrets, connection strings, and administrative keys are loaded from environment variables via [`backend/config.py`](file:///c:/Users/Soham/Desktop/SmartCityAI/backend/config.py). A template is provided in `.env.example`:

| Environment Variable | Description | Default / Production Guidance |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URI | `postgresql://postgres:postgres@localhost:5432/smartcityai` (SQLite dev fallback) |
| `API_KEY_ADMIN` | Root administrative key | 64-byte cryptographically secure random token |
| `API_KEY_ANALYST` | Data ingestion & scoring key | 64-byte cryptographically secure random token |
| `API_KEY_VIEWER` | Read-only analytics & forecast key | Public / dashboard consumer key |
| `SECRET_KEY` | HMAC token signing secret | Cryptographic salt |
| `CORS_ORIGINS` | Comma-delimited CORS whitelist | Configured for frontend origins (`http://localhost:3000`, etc.) |

---

## 3. Role-Based Access Control (RBAC)

The authentication system ([`backend/auth/security.py`](file:///c:/Users/Soham/Desktop/SmartCityAI/backend/auth/security.py)) inspects headers for either `X-API-Key` or `Authorization: Bearer <key>`. It enforces a strict three-tier role hierarchy:

$$\text{admin} > \text{analyst} > \text{viewer}$$

- **Viewer (`viewer`)**: Read access to telemetry, forecasts, risk scores, GeoJSON layers, and AI assistant insights.
- **Analyst (`analyst`)**: Ingestion of telemetry, manual triggering of anomaly detection, and training set submission.
- **Admin (`admin`)**: Administrative diagnostics, configuration updates, and model fleet management.

Unauthenticated requests receive `401 Unauthorized`. Insufficient privileges receive `403 Forbidden`.

---

## 4. Structured Logging & Global Exception Handling

### Structured JSON Correlation Logging
Every HTTP interaction passes through [`StructuredLoggingMiddleware`](file:///c:/Users/Soham/Desktop/SmartCityAI/backend/middleware/logging_middleware.py). It stamps a unique `X-Request-ID` correlation header and emits structured JSON execution metrics:

```json
{
  "trace_id": "req_8f12a34b5c6d",
  "method": "POST",
  "path": "/api/v1/traffic/forecast",
  "status_code": 200,
  "duration_ms": 14.28,
  "client_ip": "127.0.0.1"
}
```

### Centralized Exception Handlers
Registered via [`backend/middleware/error_handling.py`](file:///c:/Users/Soham/Desktop/SmartCityAI/backend/middleware/error_handling.py), mapping:
- `HTTPException` $\to$ Standard JSON error with trace ID and path.
- `RequestValidationError` $\to$ Detailed field-level validation errors (`422 Unprocessable Entity`).
- `ValueError` $\to$ Structured `400 Bad Request`.
- `Unhandled Exception` $\to$ `500 Internal Server Error` (sanitized without exposing internal stack traces).

---

## 5. Endpoints Specification (`/api/v1`)

### A. Traffic Analytics & Forecasting (`/api/v1/traffic`)
- `GET /api/v1/traffic`: Paginated corridor telemetry records with `street_name`, `min_speed`, and `max_speed` filters.
- `POST /api/v1/traffic`: Ingests observed corridor speed telemetry (Requires `analyst` role).
- `POST /api/v1/traffic/forecast`: Generates 1h, 3h, or 6h corridor speed forecast with non-parametric $90\%$ quantile intervals $[\hat{y}_{0.05}, \hat{y}_{0.95}]$ and congestion tier (`FREE_FLOW`, `MODERATE`, `CONGESTED`, `SEVERE`).

### B. Accidents & Safety Risk Analytics (`/api/v1/accidents`)
- `GET /api/v1/accidents`: Paginated accident records with `risk_tier` and `min_injuries` filters.
- `POST /api/v1/accidents`: Ingests traffic crash record with automatic H3 spatial binning (Requires `analyst` role).
- `POST /api/v1/accidents/score-risk`: Computes real-time crash probability, severity tier (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), SHAP feature attributions, and non-causal epistemic disclaimers.

### C. Environmental & Air Quality (`/api/v1/environment`)
- `GET /api/v1/environment`: Paginated sensor readings with `station_id` and `min_aqi`/`max_aqi` filters.
- `POST /api/v1/environment`: Ingests atmospheric telemetry (AQI, PM2.5, PM10, NO2, O3, temperature, humidity).
- `POST /api/v1/environment/forecast`: 24-hour AQI forecast with multi-pollutant breakdown and EPA/CPCB category assignment.

### D. Consolidated Predictive Forecasting (`/api/v1/forecast`)
- `GET /api/v1/forecast`: Service discovery catalog of active models, horizons, and supported domains.
- `POST /api/v1/forecast/traffic`: Traffic speed quantile regression.
- `POST /api/v1/forecast/aqi`: Atmospheric multi-target forecast.

### E. Urban Anomaly Detection (`/api/v1/anomalies`)
- `GET /api/v1/anomalies`: Paginated detected anomalies with `min_z_score` and `anomaly_type` filtering.
- `POST /api/v1/anomalies/detect`: Real-time telemetry scoring via Isolation Forest + residual Z-scores, classifying severity (`NORMAL`, `MILD_DEVIATION`, `SEVERE_ANOMALY`) and prescribing action recommendations.

### F. Geospatial Intelligence (`/api/v1/geospatial`)
- `GET /api/v1/geospatial/hexagons`: Standard GeoJSON `FeatureCollection` of H3 hexagonal cells with Clayton-Kaldor Empirical Bayes rate smoothing applied to eliminate Small Number Problem artifacts.
- `GET /api/v1/geospatial/hotspots`: Standard GeoJSON `FeatureCollection` of crash risk hotspots identified via DBSCAN density clustering and Getis-Ord $G_i^*$.

### G. AI Insights & Urban Assistant (`/api/v1/insights`)
- `POST /api/v1/insights/ask`: Natural language decision support engine strictly grounded in verified platform data with zero numerical hallucination, source citations, and non-causal epistemic notices.
- `GET /api/v1/insights/city-summary`: Automated metropolitan operational health indicator aggregating congestion, risk blackspots, average AQI, and urban stress index.

### H. System Health & Diagnostics (`/api/v1/health`)
- `GET /api/v1/health`: Unauthenticated liveness and readiness probe reporting database connectivity, ML model readiness across all 5 models, and application uptime.

---

## 6. Test Suite Verification & Quality Gate

The entire platform backend is verified across 12 dedicated integration and unit test cases in [`tests/test_backend_api.py`](file:///c:/Users/Soham/Desktop/SmartCityAI/tests/test_backend_api.py), bringing total repository test coverage to **53 passing unit tests**:

```text
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-9.1.1
rootdir: C:\Users\Soham\Desktop\SmartCityAI
collected 53 items

tests/test_assistant.py::test_traffic_congestion_query PASSED            [  1%]
tests/test_assistant.py::test_air_quality_trend_query PASSED             [  3%]
tests/test_assistant.py::test_anomaly_investigation_query PASSED         [  5%]
tests/test_assistant.py::test_accident_risk_explanation_query PASSED     [  7%]
tests/test_assistant.py::test_out_of_domain_query_rejection PASSED       [  9%]
tests/test_assistant.py::test_hallucination_guard_catches_unauthorized_numbers PASSED [ 11%]
tests/test_assistant.py::test_causal_guard_sanitizes_illegal_claims PASSED [ 13%]
tests/test_assistant.py::test_missing_data_refusal PASSED                [ 15%]
tests/test_assistant.py::test_audit_logger_records_interactions PASSED   [ 16%]
tests/test_backend_api.py::test_root_endpoint PASSED                     [ 18%]
tests/test_backend_api.py::test_health_check_endpoint PASSED             [ 20%]
tests/test_backend_api.py::test_authentication_and_authorization PASSED  [ 22%]
tests/test_backend_api.py::test_traffic_ingestion_and_pagination PASSED  [ 24%]
tests/test_backend_api.py::test_traffic_quantile_forecast PASSED         [ 26%]
tests/test_backend_api.py::test_accident_endpoints_and_risk_scoring PASSED [ 28%]
tests/test_backend_api.py::test_environment_endpoints_and_aqi_forecast PASSED [ 30%]
tests/test_backend_api.py::test_consolidated_forecast_catalog PASSED     [ 32%]
tests/test_backend_api.py::test_anomaly_detection_endpoint PASSED        [ 33%]
tests/test_backend_api.py::test_geospatial_geojson_endpoints PASSED      [ 35%]
tests/test_backend_api.py::test_ai_insights_endpoints PASSED             [ 37%]
tests/test_backend_api.py::test_request_validation_error_handler PASSED  [ 39%]
tests/test_cleaning.py::test_timezone_normalization_to_utc PASSED        [ 41%]
tests/test_cleaning.py::test_duplicate_quarantine_preserves_records PASSED [ 43%]
tests/test_cleaning.py::test_invalid_coordinates_quarantined_not_dropped PASSED [ 45%]
tests/test_cleaning.py::test_explicit_imputation_tracking PASSED         [ 47%]
tests/test_features.py::test_cyclical_encoding_bounds PASSED             [ 49%]
tests/test_features.py::test_autoregressive_lag_generation PASSED        [ 50%]
tests/test_forecasting.py::test_quantile_forecaster_monotonicity PASSED  [ 52%]
tests/test_forecasting.py::test_coverage_metrics PASSED                  [ 54%]
tests/test_forecasting.py::test_multi_pollutant_forecaster PASSED        [ 56%]
tests/test_forecasting.py::test_benchmark_evaluator_leaderboard PASSED   [ 58%]
tests/test_geospatial.py::test_coordinate_inversion_correction PASSED    [ 60%]
tests/test_geospatial.py::test_privacy_geomasking PASSED                 [ 62%]
tests/test_geospatial.py::test_k_anonymity_suppression PASSED            [ 64%]
tests/test_geospatial.py::test_empirical_bayes_rate_smoothing PASSED     [ 66%]
tests/test_geospatial.py::test_kernel_density_estimator PASSED           [ 67%]
tests/test_geospatial.py::test_geojson_feature_collection_generation PASSED [ 69%]
tests/test_leakage.py::test_rolling_window_zero_lookahead PASSED         [ 71%]
tests/test_leakage.py::test_temporal_split_leakage_detection PASSED      [ 73%]
tests/test_leakage.py::test_preflight_gate_blocks_target_leakage PASSED  [ 75%]
tests/test_ml_models.py::test_rolling_time_series_split_zero_lookahead PASSED [ 77%]
tests/test_ml_models.py::test_spatial_group_time_series_split PASSED     [ 79%]
tests/test_ml_models.py::test_traffic_forecaster_fit_predict PASSED      [ 81%]
tests/test_ml_models.py::test_accident_classifier_and_risk_calibration PASSED [ 83%]
tests/test_ml_models.py::test_aqi_forecaster PASSED                      [ 84%]
tests/test_ml_models.py::test_isolation_forest_anomaly_detector PASSED   [ 86%]
tests/test_ml_models.py::test_spatial_dbscan_and_getis_ord PASSED        [ 88%]
tests/test_schemas.py::test_raw_traffic_record_valid PASSED              [ 90%]
tests/test_schemas.py::test_raw_traffic_record_speed_boundary_violation PASSED [ 92%]
tests/test_schemas.py::test_raw_crash_record_defaults PASSED             [ 94%]
tests/test_xai.py::test_causal_guard_sanitization PASSED                 [ 95%]
tests/test_xai.py::test_causal_disclaimer_append PASSED                  [ 97%]
tests/test_xai.py::test_explainable_prediction_additivity PASSED         [100%]

======================= 53 passed, 2 warnings in 4.30s ========================
```
