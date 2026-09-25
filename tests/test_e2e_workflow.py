"""
SmartCityAI - End-to-End (E2E) System Integration Test
Exercises the complete lifecycle:
Telemetry Ingestion -> DB Persistence -> Machine Learning Inference ->
AI Analytics Grounded Query -> Audit Log Generation.
"""

from fastapi.testclient import TestClient
import pytest
from backend.main import app

client = TestClient(app)
ANALYST_HEADERS = {"X-API-Key": "analyst_smartcity_secret_key_2026"}
VIEWER_HEADERS = {"X-API-Key": "viewer_smartcity_public_key_2026"}


def test_full_system_lifecycle_e2e():
    """
    Execute full end-to-end user and sensor lifecycle across:
    1. Ingestion of raw traffic telemetry
    2. Model inference via traffic quantile forecaster
    3. Collision scenario risk scoring with SHAP attributions
    4. Deterministic natural language query to AI Urban Assistant
    5. Platform health verification
    """
    # Step 1: Health check
    health_res = client.get("/api/v1/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] in ["HEALTHY", "DEGRADED"]

    # Step 2: Ingest Traffic Observation via API
    traffic_payload = {
        "segment_id": 999,
        "street_name": "E2E Test Boulevard",
        "speed_mph": 22.4,
        "historical_speed_mph": 34.0,
        "bus_count": 6,
        "recorded_at": "2026-09-25T12:00:00Z",
    }
    ingest_res = client.post("/api/v1/traffic", json=traffic_payload, headers=ANALYST_HEADERS)
    assert ingest_res.status_code == 201

    # Verify queryability in traffic catalog
    list_res = client.get("/api/v1/traffic?street_name=E2E Test Boulevard", headers=VIEWER_HEADERS)
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total_count"] >= 1
    assert any(item["street_name"] == "E2E Test Boulevard" for item in data["items"])

    # Step 3: Trigger ML Model Inference (Quantile Traffic Forecaster)
    forecast_payload = {
        "segment_id": 999,
        "current_speed_mph": 22.4,
        "horizon_hours": 1,
    }
    fc_res = client.post("/api/v1/traffic/forecast", json=forecast_payload, headers=VIEWER_HEADERS)
    assert fc_res.status_code == 200
    fc_data = fc_res.json()
    assert fc_data["predicted_speed_mph"] > 0
    assert fc_data["quantile_05"] <= fc_data["predicted_speed_mph"] <= fc_data["quantile_95"]

    # Step 4: Accident Risk Prediction with SHAP
    risk_payload = {
        "latitude": 18.5204,
        "longitude": 73.8567,
        "weather_condition": "RAIN",
        "lighting_condition": "DARK",
        "speed_ratio_to_freeflow": 0.45,
        "hour_of_day": 20,
    }
    risk_res = client.post("/api/v1/accidents/score-risk", json=risk_payload, headers=VIEWER_HEADERS)
    assert risk_res.status_code == 200
    risk_data = risk_res.json()
    assert 0.0 <= risk_data["predicted_risk_score"] <= 1.0
    assert len(risk_data["top_contributing_features"]) >= 1

    # Step 5: Query AI Urban Analytics Assistant
    query_payload = {
        "query_text": "What areas currently have elevated predicted traffic?",
    }
    query_res = client.post("/api/v1/insights/ask", json=query_payload, headers=VIEWER_HEADERS)
    assert query_res.status_code == 200
    query_data = query_res.json()
    assert query_data["hallucination_audit_passed"] is True
    assert len(query_data["sources_cited"]) > 0
    assert query_data["temporal_classification"] in ["HISTORICAL_OBSERVATION", "MODEL_PREDICTION", "HYBRID"]
    assert "causal" in query_data["epistemic_disclaimer"].lower()
