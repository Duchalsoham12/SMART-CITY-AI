"""
SmartCityAI - Datasets API Unit Tests
Tests dataset catalog listing, file inspection, preflight validation gates,
quarantining, and version manifest creation.
"""

import io
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_get_datasets_catalog():
    """Verify listing of registered datasets."""
    response = client.get("/api/v1/datasets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    first = data[0]
    assert "dataset_name" in first
    assert "category" in first
    assert "version_id" in first
    assert "quality_score" in first


def test_inspect_file_columns():
    """Verify semantic column mapping heuristic detection."""
    csv_content = (
        "segment,street_corridor,current_speed,latitude,longitude,recorded_at\n"
        "101,Michigan Ave,28.5,41.8885,-87.6243,2026-09-25T12:00:00Z\n"
        "102,Wacker Dr,15.2,41.8890,-87.6250,2026-09-25T12:01:00Z\n"
    )
    files = {"file": ("traffic_sample.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}

    response = client.post("/api/v1/datasets/inspect", files=files)
    assert response.status_code == 200
    mappings = response.json()
    assert isinstance(mappings, list)
    assert len(mappings) == 6

    # Verify detected column suggestions
    mapped_dict = {m["source_column"]: m["suggested_target"] for m in mappings}
    assert mapped_dict.get("current_speed") == "speed"
    assert mapped_dict.get("latitude") == "start_latitude"
    assert mapped_dict.get("longitude") == "start_longitude"
    assert mapped_dict.get("recorded_at") == "observation_time_utc"


def test_upload_and_validate_dataset():
    """Verify preflight quality gates and zero-silent-deletion quarantine policy."""
    # CSV containing 4 valid rows and 1 invalid row (latitude 999.0 out of physical bounds)
    csv_content = (
        "segment_id,street_name,speed,latitude,longitude,observation_time_utc\n"
        "1,Main St,32.0,41.88,-87.62,2026-09-25T10:00:00Z\n"
        "2,Broad St,25.4,41.89,-87.63,2026-09-25T10:05:00Z\n"
        "3,State St,18.2,41.87,-87.61,2026-09-25T10:10:00Z\n"
        "4,Loop Expy,45.0,41.86,-87.60,2026-09-25T10:15:00Z\n"
        "5,Corrupted Sensor,-10.0,999.0,-87.62,2026-09-25T10:20:00Z\n"
    )
    files = {"file": ("test_ingest_telemetry.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    data = {
        "category": "traffic",
        "custom_name": "test_ingest_corridor",
    }

    response = client.post("/api/v1/datasets/upload", files=files, data=data)
    assert response.status_code == 201
    res = response.json()
    assert res["success"] is True
    assert res["total_rows"] == 5
    assert res["valid_rows"] == 4
    assert res["quarantined_rows"] == 1
    assert "version_id" in res
    assert "sha256_hash" in res

    # Quality Report breakdown
    qr = res["quality_report"]
    assert qr["completeness_score"] == 100.0
    assert qr["validity_score"] == 80.0
    assert len(qr["warnings"]) >= 1
    assert any("quarantined" in w.lower() for w in qr["warnings"])


def test_get_dataset_sample():
    """Verify retrieval of sample preview rows."""
    response = client.get("/api/v1/datasets/chicago_traffic_loop_telemetry/sample?limit=5")
    assert response.status_code == 200
    rows = response.json()
    assert isinstance(rows, list)
    assert len(rows) > 0
