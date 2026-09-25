"""
SmartCityAI - Traffic Service Layer
Manages traffic database operations and real-time quantile forecasting inference.
"""

from datetime import datetime, timezone
from typing import List, Optional, Tuple
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from backend.models.orm_models import TrafficRecordModel
from backend.schemas.api_schemas import (
    TrafficForecastRequest,
    TrafficForecastResponse,
    TrafficRecordCreate,
)
from ml.models.traffic_forecaster import TrafficForecaster
from ml.forecasting.quantile_forecaster import QuantileForecaster


class TrafficService:
    """Service encapsulating traffic telemetry data access and model inference."""

    _forecaster_instance: Optional[QuantileForecaster] = None

    @classmethod
    def get_forecaster(cls) -> QuantileForecaster:
        """Lazy-singleton loader for quantile traffic forecaster."""
        if cls._forecaster_instance is None:
            forecaster = QuantileForecaster(quantiles=[0.05, 0.50, 0.95])
            # Train on realistic synthetic telemetry to initialize weights
            np.random.seed(42)
            n_samples = 200
            X_init = pd.DataFrame({
                "speed_lag_1": np.random.uniform(10, 45, n_samples),
                "speed_lag_2": np.random.uniform(10, 45, n_samples),
                "speed_lag_3": np.random.uniform(10, 45, n_samples),
                "hour_sin": np.sin(2 * np.pi * np.random.randint(0, 24, n_samples) / 24),
                "hour_cos": np.cos(2 * np.pi * np.random.randint(0, 24, n_samples) / 24),
                "bus_count": np.random.poisson(3, n_samples),
            })
            y_init = X_init["speed_lag_1"] * 0.7 + np.random.normal(0, 3, n_samples)
            forecaster.fit(X_init, y_init)
            cls._forecaster_instance = forecaster
        return cls._forecaster_instance

    @staticmethod
    def get_records(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        street_name: Optional[str] = None,
        min_speed: Optional[float] = None,
        max_speed: Optional[float] = None,
    ) -> Tuple[List[TrafficRecordModel], int]:
        """Queries traffic records with filtering and pagination."""
        query = db.query(TrafficRecordModel)

        if street_name:
            query = query.filter(TrafficRecordModel.street_name.ilike(f"%{street_name}%"))
        if min_speed is not None:
            query = query.filter(TrafficRecordModel.speed_mph >= min_speed)
        if max_speed is not None:
            query = query.filter(TrafficRecordModel.speed_mph <= max_speed)

        total_count = query.count()
        records = (
            query.order_by(TrafficRecordModel.recorded_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return records, total_count

    @staticmethod
    def create_record(db: Session, record_in: TrafficRecordCreate) -> TrafficRecordModel:
        """Inserts a new traffic telemetry record."""
        db_record = TrafficRecordModel(
            segment_id=record_in.segment_id,
            street_name=record_in.street_name,
            speed_mph=record_in.speed_mph,
            historical_speed_mph=record_in.historical_speed_mph,
            bus_count=record_in.bus_count,
            recorded_at=record_in.recorded_at,
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return db_record

    @classmethod
    def forecast_speed(cls, req: TrafficForecastRequest) -> TrafficForecastResponse:
        """Executes quantile forecasting inference with 90% non-parametric prediction intervals."""
        forecaster = cls.get_forecaster()
        hour = req.hour_of_day if req.hour_of_day is not None else 17
        
        # Prepare feature vector
        X = pd.DataFrame([{
            "speed_lag_1": req.current_speed_mph,
            "speed_lag_2": req.current_speed_mph * 0.98,
            "speed_lag_3": req.current_speed_mph * 0.95,
            "hour_sin": np.sin(2 * np.pi * hour / 24),
            "hour_cos": np.cos(2 * np.pi * hour / 24),
            "bus_count": req.bus_count,
        }])

        preds = forecaster.predict(X)
        col_05 = "q_05" if "q_05" in preds.columns else "q_0.05"
        col_50 = "q_50" if "q_50" in preds.columns else "q_0.5"
        col_95 = "q_95" if "q_95" in preds.columns else "q_0.95"
        q05 = float(preds[col_05].iloc[0])
        q50 = float(preds[col_50].iloc[0])
        q95 = float(preds[col_95].iloc[0])

        # Monotonicity check
        q05, q50, q95 = min(q05, q50), q50, max(q50, q95)

        # Categorize congestion level
        if q50 < 12.0:
            congestion = "SEVERE"
        elif q50 < 20.0:
            congestion = "CONGESTED"
        elif q50 < 30.0:
            congestion = "MODERATE"
        else:
            congestion = "FREE_FLOW"

        return TrafficForecastResponse(
            segment_id=req.segment_id,
            predicted_speed_mph=round(q50, 1),
            horizon_hours=req.horizon_hours,
            quantile_05=round(q05, 1),
            quantile_50=round(q50, 1),
            quantile_95=round(q95, 1),
            congestion_level=congestion,
            model_version="TrafficForecaster-QuantileLGBM-v2.1",
            inference_timestamp_utc=datetime.now(timezone.utc),
        )

    @classmethod
    def forecast_speed_batch(cls, reqs: List[TrafficForecastRequest]) -> List[TrafficForecastResponse]:
        """Executes vectorized batch quantile forecasting inference for high-throughput evaluation."""
        if not reqs:
            return []
        forecaster = cls.get_forecaster()

        rows = []
        for req in reqs:
            hour = req.hour_of_day if req.hour_of_day is not None else 17
            rows.append({
                "speed_lag_1": req.current_speed_mph,
                "speed_lag_2": req.current_speed_mph * 0.98,
                "speed_lag_3": req.current_speed_mph * 0.95,
                "hour_sin": np.sin(2 * np.pi * hour / 24),
                "hour_cos": np.cos(2 * np.pi * hour / 24),
                "bus_count": req.bus_count,
            })

        X = pd.DataFrame(rows)
        preds = forecaster.predict(X)
        col_05 = "q_05" if "q_05" in preds.columns else "q_0.05"
        col_50 = "q_50" if "q_50" in preds.columns else "q_0.5"
        col_95 = "q_95" if "q_95" in preds.columns else "q_0.95"

        now = datetime.now(timezone.utc)
        results = []
        for i, req in enumerate(reqs):
            q05 = float(preds[col_05].iloc[i])
            q50 = float(preds[col_50].iloc[i])
            q95 = float(preds[col_95].iloc[i])
            q05, q50, q95 = min(q05, q50), q50, max(q50, q95)

            if q50 < 12.0:
                congestion = "SEVERE"
            elif q50 < 20.0:
                congestion = "CONGESTED"
            elif q50 < 30.0:
                congestion = "MODERATE"
            else:
                congestion = "FREE_FLOW"

            results.append(
                TrafficForecastResponse(
                    segment_id=req.segment_id,
                    predicted_speed_mph=round(q50, 1),
                    horizon_hours=req.horizon_hours,
                    quantile_05=round(q05, 1),
                    quantile_50=round(q50, 1),
                    quantile_95=round(q95, 1),
                    congestion_level=congestion,
                    model_version="TrafficForecaster-QuantileLGBM-v2.1",
                    inference_timestamp_utc=now,
                )
            )
        return results
