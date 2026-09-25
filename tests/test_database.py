"""
SmartCityAI - Database Layer Tests
Verifies SQLAlchemy session management, ACID transactions, rollback behavior,
CRUD operations, and table constraint enforcement.
"""

from datetime import datetime, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from backend.database import Base
from backend.models.orm_models import (
    TrafficRecordModel,
    AccidentRecordModel,
    AirQualityRecordModel,
    AnomalyRecordModel,
    AuditLogModel,
)


@pytest.fixture(scope="function")
def test_db():
    """Isolated in-memory SQLite database for deterministic DB testing."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_traffic_record_crud(test_db):
    """Verify create, read, update, and delete for TrafficRecordModel."""
    now = datetime.now(timezone.utc)
    record = TrafficRecordModel(
        segment_id=101,
        street_name="FC Road",
        speed_mph=28.5,
        historical_speed_mph=32.0,
        bus_count=4,
        recorded_at=now,
    )
    test_db.add(record)
    test_db.commit()
    test_db.refresh(record)

    assert record.id is not None
    assert record.segment_id == 101

    # Read
    fetched = test_db.query(TrafficRecordModel).filter_by(segment_id=101).first()
    assert fetched is not None
    assert fetched.speed_mph == 28.5

    # Update
    fetched.speed_mph = 19.2
    test_db.commit()
    updated = test_db.query(TrafficRecordModel).filter_by(segment_id=101).first()
    assert updated.speed_mph == 19.2

    # Delete
    test_db.delete(updated)
    test_db.commit()
    deleted = test_db.query(TrafficRecordModel).filter_by(segment_id=101).first()
    assert deleted is None


def test_accident_unique_constraint_enforcement(test_db):
    """Ensure duplicate crash_record_id triggers IntegrityError and rolls back cleanly."""
    now = datetime.now(timezone.utc)
    acc1 = AccidentRecordModel(
        crash_record_id="CRASH-PUNE-001",
        crash_date=now,
        latitude=18.5204,
        longitude=73.8567,
        h3_index="88618925d7fffff",
        injuries_total=1,
        fatalities_total=0,
        risk_score=0.75,
        risk_tier="HIGH",
    )
    test_db.add(acc1)
    test_db.commit()

    # Attempt to insert identical crash_record_id
    acc2 = AccidentRecordModel(
        crash_record_id="CRASH-PUNE-001",
        crash_date=now,
        latitude=18.5210,
        longitude=73.8570,
        h3_index="88618925d7fffff",
        injuries_total=0,
        fatalities_total=0,
        risk_score=0.25,
        risk_tier="LOW",
    )
    test_db.add(acc2)

    with pytest.raises(IntegrityError):
        test_db.commit()

    test_db.rollback()

    # Verify only original record exists
    count = test_db.query(AccidentRecordModel).filter_by(crash_record_id="CRASH-PUNE-001").count()
    assert count == 1


def test_transaction_rollback_guarantee(test_db):
    """Verify that failing mid-transaction rolls back all uncommitted mutations."""
    now = datetime.now(timezone.utc)
    rec1 = TrafficRecordModel(
        segment_id=201,
        street_name="Karve Road",
        speed_mph=25.0,
        recorded_at=now,
    )
    test_db.add(rec1)
    test_db.commit()

    # Start a flawed transaction
    try:
        rec2 = TrafficRecordModel(
            segment_id=202,
            street_name="Hinjewadi Phase 1",
            speed_mph=30.0,
            recorded_at=now,
        )
        test_db.add(rec2)
        # Deliberate error by inserting null into non-nullable column
        flawed_rec = TrafficRecordModel(
            segment_id=None,  # Null constraint violation
            street_name=None,
            speed_mph=None,
            recorded_at=None,
        )
        test_db.add(flawed_rec)
        test_db.commit()
    except Exception:
        test_db.rollback()

    # rec2 should NOT be in the database because the transaction aborted
    assert test_db.query(TrafficRecordModel).filter_by(segment_id=202).first() is None
    # rec1 from prior committed transaction must still exist
    assert test_db.query(TrafficRecordModel).filter_by(segment_id=201).first() is not None


def test_air_quality_and_anomaly_persistence(test_db):
    """Verify AirQualityRecordModel and AnomalyRecordModel persistence."""
    now = datetime.now(timezone.utc)
    aq_entry = AirQualityRecordModel(
        station_id="PUNE_SHIVAJINAGAR",
        station_name="Shivajinagar Ambient",
        recorded_at=now,
        aqi=148.5,
        pm25=58.2,
        pm10=112.0,
        no2=34.1,
    )
    test_db.add(aq_entry)

    anom_entry = AnomalyRecordModel(
        segment_id=301,
        street_name="Pune-Bangalore Highway",
        detected_at=now,
        observed_value=5.4,
        expected_value=35.0,
        residual_z_score=-3.82,
        anomaly_score=0.96,
        anomaly_type="UNEXPECTED_SLOWDOWN",
        is_confirmed=True,
    )
    test_db.add(anom_entry)

    test_db.commit()

    saved_aq = test_db.query(AirQualityRecordModel).filter_by(station_id="PUNE_SHIVAJINAGAR").first()
    assert saved_aq is not None
    assert saved_aq.aqi == 148.5

    saved_anom = test_db.query(AnomalyRecordModel).filter_by(segment_id=301).first()
    assert saved_anom is not None
    assert saved_anom.residual_z_score == -3.82
    assert saved_anom.is_confirmed is True


def test_audit_log_record_retrieval(test_db):
    """Ensure audit log traces are recorded and chronologically queryable."""
    now = datetime.now(timezone.utc)
    audit = AuditLogModel(
        trace_id="audit-trace-xyz-123",
        timestamp_utc=now,
        user_role="analyst",
        endpoint="/api/v1/traffic/forecast",
        method="POST",
        status_code=200,
        duration_ms=18.4,
        ip_address="127.0.0.1",
        request_summary="Quantile speed forecast for segment 101",
    )
    test_db.add(audit)
    test_db.commit()

    fetched = test_db.query(AuditLogModel).filter_by(trace_id="audit-trace-xyz-123").first()
    assert fetched is not None
    assert fetched.status_code == 200
    assert fetched.duration_ms == 18.4
