"""
SmartCityAI - Anomaly Detection Service Layer
Manages historical anomaly records and real-time unsupervised anomaly scoring.
"""

from datetime import datetime, timezone
from typing import List, Optional, Tuple
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from backend.models.orm_models import AnomalyRecordModel
from backend.schemas.api_schemas import (
    AnomalyDetectionRequest,
    AnomalyDetectionResponse,
)
from ml.models.anomaly_detector import UrbanAnomalyDetector


class AnomalyService:
    """Service encapsulating residual deviation scoring and anomaly monitoring."""

    _detector_instance: Optional[UrbanAnomalyDetector] = None

    @classmethod
    def get_detector(cls) -> UrbanAnomalyDetector:
        """Lazy-singleton loader for unsupervised Isolation Forest detector."""
        if cls._detector_instance is None:
            detector = UrbanAnomalyDetector(contamination=0.03)
            np.random.seed(42)
            n_samples = 300
            # Normal distribution of corridor residuals
            observed = np.random.normal(28, 5, n_samples)
            expected = np.random.normal(28, 4, n_samples)
            X_init = pd.DataFrame({
                "speed_residual": observed - expected,
                "hour_of_day": np.random.randint(0, 24, n_samples),
                "bus_count": np.random.poisson(2, n_samples),
            })
            detector.fit(X_init)
            cls._detector_instance = detector
        return cls._detector_instance

    @staticmethod
    def get_records(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        min_z_score: Optional[float] = None,
        anomaly_type: Optional[str] = None,
    ) -> Tuple[List[AnomalyRecordModel], int]:
        """Queries detected anomaly records with filtering and pagination."""
        query = db.query(AnomalyRecordModel)

        if min_z_score is not None:
            # Query magnitude of deviation
            query = query.filter(
                (AnomalyRecordModel.residual_z_score >= min_z_score)
                | (AnomalyRecordModel.residual_z_score <= -min_z_score)
            )
        if anomaly_type:
            query = query.filter(AnomalyRecordModel.anomaly_type == anomaly_type.upper())

        total_count = query.count()
        records = (
            query.order_by(AnomalyRecordModel.detected_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return records, total_count

    @classmethod
    def detect_anomaly(cls, req: AnomalyDetectionRequest, db: Optional[Session] = None) -> AnomalyDetectionResponse:
        """Evaluates sensor telemetry for abnormal deviations and records anomalies."""
        detector = cls.get_detector()
        residual = req.observed_speed_mph - req.expected_speed_mph
        
        # Standard deviation reference baseline (~4.5 mph)
        baseline_std = 4.5
        z_score = residual / baseline_std

        X = pd.DataFrame([{
            "speed_residual": residual,
            "hour_of_day": req.hour_of_day,
            "bus_count": req.bus_count,
        }])

        pred_label = detector.predict(X)[0]
        is_iforest_anomaly = bool(pred_label == 1)
        score = float(detector.predict_scores(X)[0])

        is_z_anomaly = abs(z_score) >= 2.50
        is_anomaly = is_iforest_anomaly or is_z_anomaly

        if not is_anomaly:
            severity = "NORMAL"
            anomaly_type = "NONE"
            recommendation = "Traffic flow is within normal nominal bounds."
        elif abs(z_score) >= 3.5:
            severity = "SEVERE_ANOMALY"
            anomaly_type = "UNEXPECTED_SEVERE_CONGESTION" if z_score < 0 else "HIGH_SPEED_ANOMALY"
            recommendation = "Trigger immediate field inspection and traffic signal adjustment."
        else:
            severity = "MILD_DEVIATION"
            anomaly_type = "UNEXPECTED_SLOWDOWN" if z_score < 0 else "ELEVATED_FREEFLOW"
            recommendation = "Monitor corridor closely; verify sensor telemetry stream integrity."

        # If database session is passed and anomaly is detected, persist to audit log
        if is_anomaly and db is not None:
            record = AnomalyRecordModel(
                segment_id=req.segment_id,
                street_name=req.street_name,
                detected_at=datetime.now(timezone.utc),
                observed_value=req.observed_speed_mph,
                expected_value=req.expected_speed_mph,
                residual_z_score=round(z_score, 2),
                anomaly_score=round(score, 3),
                anomaly_type=anomaly_type,
                is_confirmed=False,
            )
            db.add(record)
            db.commit()

        return AnomalyDetectionResponse(
            segment_id=req.segment_id,
            street_name=req.street_name,
            is_anomaly=is_anomaly,
            residual_z_score=round(z_score, 2),
            anomaly_score=round(score, 3),
            anomaly_type=anomaly_type,
            severity=severity,
            action_recommendation=recommendation,
        )
