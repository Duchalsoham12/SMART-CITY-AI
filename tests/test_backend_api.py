"""
SmartCityAI - Backend RESTful API Test Suite
Integration and unit tests verifying FastAPI endpoints, RBAC authentication,
Pydantic validation, exception handlers, pagination, and ML inference services.
"""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from backend.config import settings
from backend.main import app

client = TestClient(app)

# Authentication headers for RBAC tests
VIEWER_HEADERS = {"X-API-Key": settings.API_KEY_VIEWER}
ANALYST_HEADERS = {"X-API-Key": settings.API_KEY_ANALYST}
ADMIN_HEADERS = {"X-API-Key": settings.API_KEY_ADMIN}


def test_root_endpoint():
    """Verifies API root provides platform metadata and navigation links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "SmartCityAI" in data["name"]
    assert data["status"] == "OPERATIONAL"
    assert "/docs" in data["docs_url"]


def test_health_check_endpoint():
    """Verifies system diagnostic probe reports operational status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("HEALTHY", "DEGRADED")
    assert "database" in data["components"]
    assert data["components"]["database"]["status"] == "HEALTHY"


def test_authentication_and_authorization():
    """Verifies API key security and hierarchical role-based access control."""
    # 1. Unauthenticated request to protected route -> 401
    resp_unauth = client.get("/api/v1/traffic")
    assert resp_unauth.status_code == 401
    assert "Missing authentication" in resp_unauth.json()["detail"]

    # 2. Invalid API key -> 401
    resp_bad = client.get("/api/v1/traffic", headers={"X-API-Key": "invalid_fake_key"})
    assert resp_bad.status_code == 401
    assert "Invalid authentication" in resp_bad.json()["detail"]

    # 3. Viewer accessing viewer route -> 200
    resp_viewer = client.get("/api/v1/traffic", headers=VIEWER_HEADERS)
    assert resp_viewer.status_code == 200

    # 4. Viewer attempting write operation (requires analyst) -> 403 Forbidden
    payload = {
        "segment_id": 999,
        "street_name": "Test Corridor",
        "speed_mph": 25.0,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    resp_forbidden = client.post("/api/v1/traffic", json=payload, headers=VIEWER_HEADERS)
    assert resp_forbidden.status_code == 403
    assert "Requires 'analyst' role" in resp_forbidden.json()["detail"]


def test_traffic_ingestion_and_pagination():
    """Verifies traffic record insertion, pagination, and speed filtering."""
    # Ingest record with Analyst credentials
    payload = {
        "segment_id": 105,
        "street_name": "Michigan Avenue",
        "speed_mph": 14.5,
        "historical_speed_mph": 22.0,
        "bus_count": 4,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    create_resp = client.post("/api/v1/traffic", json=payload, headers=ANALYST_HEADERS)
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    assert created_data["segment_id"] == 105
    assert created_data["street_name"] == "Michigan Avenue"

    # Query list
    list_resp = client.get("/api/v1/traffic?street_name=Michigan", headers=VIEWER_HEADERS)
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total_count"] >= 1
    assert len(list_data["items"]) >= 1
    assert "page" in list_data
    assert "has_next" in list_data


def test_traffic_quantile_forecast():
    """Verifies real-time traffic speed forecasting with 90% prediction intervals."""
    req_body = {
        "segment_id": 105,
        "current_speed_mph": 12.0,
        "horizon_hours": 1,
        "hour_of_day": 18,
        "bus_count": 3,
    }
    resp = client.post("/api/v1/traffic/forecast", json=req_body, headers=VIEWER_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert "predicted_speed_mph" in data
    assert data["quantile_05"] <= data["quantile_50"] <= data["quantile_95"]
    assert data["congestion_level"] in ("FREE_FLOW", "MODERATE", "CONGESTED", "SEVERE")


def test_accident_endpoints_and_risk_scoring():
    """Verifies accident record ingestion and SHAP-explained crash risk inference."""
    # Ingest crash record
    crash_payload = {
        "crash_record_id": f"CRASH_TEST_{datetime.now().timestamp()}",
        "crash_date": datetime.now(timezone.utc).isoformat(),
        "latitude": 41.8827,
        "longitude": -87.6233,
        "injuries_total": 1,
        "fatalities_total": 0,
        "weather_condition": "RAIN",
        "lighting_condition": "DUSK",
    }
    create_resp = client.post("/api/v1/accidents", json=crash_payload, headers=ANALYST_HEADERS)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["h3_index"].startswith("88")
    assert created["risk_tier"] == "MEDIUM"

    # Real-time risk scoring
    score_req = {
        "latitude": 41.8827,
        "longitude": -87.6233,
        "weather_condition": "RAIN",
        "lighting_condition": "DUSK",
        "speed_ratio_to_freeflow": 0.45,
        "hour_of_day": 18,
    }
    score_resp = client.post("/api/v1/accidents/score-risk", json=score_req, headers=VIEWER_HEADERS)
    assert score_resp.status_code == 200
    scored = score_resp.json()
    assert 0.0 <= scored["predicted_risk_score"] <= 1.0
    assert scored["risk_tier"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
    assert len(scored["top_contributing_features"]) >= 1
    assert "DISCLAIMER" in scored["epistemic_disclaimer"]


def test_environment_endpoints_and_aqi_forecast():
    """Verifies air quality telemetry storage and multi-pollutant AQI forecasting."""
    env_payload = {
        "station_id": "EPA_17031",
        "station_name": "Cook County Central Station",
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "aqi": 65.0,
        "pm25": 22.4,
        "pm10": 45.1,
        "temperature_c": 21.5,
        "humidity_pct": 55.0,
    }
    create_resp = client.post("/api/v1/environment", json=env_payload, headers=ANALYST_HEADERS)
    assert create_resp.status_code == 201

    # AQI Forecast
    fc_req = {
        "station_id": "EPA_17031",
        "current_aqi": 65.0,
        "temperature_c": 22.0,
        "humidity_pct": 60.0,
        "wind_speed_mps": 3.0,
        "horizon_hours": 24,
    }
    fc_resp = client.post("/api/v1/environment/forecast", json=fc_req, headers=VIEWER_HEADERS)
    assert fc_resp.status_code == 200
    fc_data = fc_resp.json()
    assert fc_data["predicted_aqi"] > 0
    assert "pm25" in fc_data["pollutant_breakdown"]
    assert fc_data["air_quality_category"] in ("GOOD", "MODERATE", "UNHEALTHY_SENSITIVE", "UNHEALTHY")


def test_consolidated_forecast_catalog():
    """Verifies consolidated /forecast endpoints."""
    resp = client.get("/api/v1/forecast", headers=VIEWER_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert "traffic" in data["supported_domains"]
    assert "air_quality" in data["supported_domains"]


def test_anomaly_detection_endpoint():
    """Verifies unsupervised anomaly scoring on telemetry stream."""
    req_body = {
        "segment_id": 204,
        "street_name": "Ashland Ave",
        "observed_speed_mph": 6.5,
        "expected_speed_mph": 28.0,
        "bus_count": 8,
        "hour_of_day": 14,
    }
    resp = client.post("/api/v1/anomalies/detect", json=req_body, headers=ANALYST_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_anomaly"] is True
    assert data["residual_z_score"] < -2.5
    assert data["severity"] == "SEVERE_ANOMALY"


def test_geospatial_geojson_endpoints():
    """Verifies GeoJSON FeatureCollections for H3 hexagonal grid and spatial hotspots."""
    # Hexagonal risk layer
    hex_resp = client.get("/api/v1/geospatial/hexagons", headers=VIEWER_HEADERS)
    assert hex_resp.status_code == 200
    hex_geojson = hex_resp.json()
    assert hex_geojson["type"] == "FeatureCollection"
    assert len(hex_geojson["features"]) >= 1
    assert hex_geojson["features"][0]["geometry"]["type"] == "Polygon"
    assert "eb_smoothed_rate" in hex_geojson["features"][0]["properties"]

    # Hotspot clusters
    hot_resp = client.get("/api/v1/geospatial/hotspots", headers=VIEWER_HEADERS)
    assert hot_resp.status_code == 200
    hot_geojson = hot_resp.json()
    assert hot_geojson["type"] == "FeatureCollection"
    assert len(hot_geojson["features"]) >= 1


def test_ai_insights_endpoints():
    """Verifies Urban Analytics Assistant Q&A and City Health Summary."""
    # Assistant Question Answering
    ask_payload = {
        "query_text": "What areas currently have elevated predicted traffic?",
        "session_id": "test_session_1",
    }
    ask_resp = client.post("/api/v1/insights/ask", json=ask_payload, headers=VIEWER_HEADERS)
    assert ask_resp.status_code == 200
    ask_data = ask_resp.json()
    assert ask_data["intent"] == "TRAFFIC_CONGESTION_QUERY"
    assert "[MODEL_PREDICTION]" in ask_data["answer_text"]
    assert ask_data["hallucination_audit_passed"] is True

    # City Health Summary
    sum_resp = client.get("/api/v1/insights/city-summary", headers=VIEWER_HEADERS)
    assert sum_resp.status_code == 200
    sum_data = sum_resp.json()
    assert sum_data["city_name"] == "Chicago Metropolitan Area"
    assert 0.0 <= sum_data["overall_urban_stress_index"] <= 1.0


def test_request_validation_error_handler():
    """Verifies centralized exception handler catches invalid request bodies."""
    # Invalid speed_mph > 120.0
    bad_payload = {
        "segment_id": 105,
        "street_name": "Michigan Ave",
        "speed_mph": 999.0,  # Violates le=120.0
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    resp = client.post("/api/v1/traffic", json=bad_payload, headers=ANALYST_HEADERS)
    assert resp.status_code == 422
    err_data = resp.json()
    assert err_data["error_code"] == "VALIDATION_ERROR"
    assert "trace_id" in err_data
    assert "speed_mph" in err_data["detail"]
