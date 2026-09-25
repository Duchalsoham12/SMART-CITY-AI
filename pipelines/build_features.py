"""
SmartCityAI - Feature Engineering Pipeline
Builds leakage-free autoregressive lags, rolling statistics, cyclical time encodings,
merges weather covariates, and enforces pre-flight validation gating before model training.
"""

import time
from typing import Any, Dict, List, Tuple
import pandas as pd
from features.temporal import TemporalFeatureGenerator
from pipelines.base import BasePipeline
from schemas.feature_schemas import FeatureValidationReport
from validation.preflight_gate import PreflightGate


class FeatureEngineeringPipeline(BasePipeline):
    """Orchestrates Silver-to-Gold feature matrix assembly."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__("feature_engineering_pipeline", config)
        self.preflight_gate = PreflightGate(
            max_feature_null_ratio=self.config["preflight_validation"]["max_allowed_feature_null_ratio"],
            max_target_null_ratio=self.config["preflight_validation"]["max_allowed_target_null_ratio"],
            min_required_records=self.config["preflight_validation"]["min_required_records"],
        )

    def assemble_traffic_features(
        self,
        staging_traffic_df: pd.DataFrame,
        weather_df: pd.DataFrame = None,
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, FeatureValidationReport]:
        """
        Builds temporal lags, rolling statistics, merges weather, partitions by time,
        and executes pre-flight validation gating.
        """
        start_time = time.time()
        df = staging_traffic_df.copy()

        # Ensure sorted chronologically per segment
        df = df.sort_values(by=["segment_id", "observation_time_utc"]).reset_index(drop=True)

        # 1. Cyclical Time Transformations
        df = TemporalFeatureGenerator.add_cyclical_features(
            df, time_col="observation_time_utc"
        )

        # 2. Autoregressive Lags (Strictly backwards in time)
        lags = self.config["feature_engineering"]["autoregressive_lags"]
        df = TemporalFeatureGenerator.add_autoregressive_lags(
            df,
            value_col="speed_mph",
            lags=lags,
            group_col="segment_id",
            time_col="observation_time_utc",
        )

        # 3. Rolling Statistics (Leakage-Free closed='left' via shift(1))
        windows = self.config["feature_engineering"]["rolling_windows_hours"]
        df = TemporalFeatureGenerator.add_rolling_statistics(
            df,
            value_col="speed_mph",
            windows=windows,
            group_col="segment_id",
            time_col="observation_time_utc",
        )

        # 4. Exogenous Weather Merging (if provided)
        if weather_df is not None and not weather_df.empty:
            weather_clean = weather_df.copy()
            weather_clean["observation_time_utc"] = pd.to_datetime(weather_clean["observation_time_utc"])
            weather_cols = ["temperature_celsius", "precipitation_mm", "wind_speed_kmh"]
            # Merge on timestamp with forward fill to match sensor frequency
            df = pd.merge_asof(
                df.sort_values("observation_time_utc"),
                weather_clean[["observation_time_utc"] + weather_cols].sort_values("observation_time_utc"),
                on="observation_time_utc",
                direction="backward",
            )
        else:
            # Fallback baseline weather covariates
            df["temperature_celsius"] = 20.0
            df["precipitation_mm"] = 0.0
            df["wind_speed_kmh"] = 10.0

        # 5. Define Forward Prediction Target (Lead at t+1h)
        df["target_speed_lead_1h"] = (
            df.groupby("segment_id")["speed_mph"].shift(-1)
        )

        # 6. Imputation / Outlier Status Flags
        df["is_imputed"] = df.get("is_imputed_speed", False).astype(int)
        df["is_outlier"] = df.get("speed_mph_is_outlier", False).astype(int)

        # 7. Discard records where target or initial lags are undefined due to boundary shifts
        # Note: Initial rows have no historical lag; final row has no future target.
        # This is expected mathematical boundary truncation, NOT silent dropping.
        df_valid = df.dropna(subset=["target_speed_lead_1h", "speed_mph_lag_1h"]).copy()

        # 8. Temporal Dataset Partitioning (Strictly chronologically partitioned)
        train_cutoff = pd.to_datetime(self.config["data_splits"]["train_cutoff"], utc=True)
        val_cutoff = pd.to_datetime(self.config["data_splits"]["val_cutoff"], utc=True)

        train_df = df_valid[df_valid["observation_time_utc"] <= train_cutoff].copy()
        val_df = df_valid[
            (df_valid["observation_time_utc"] > train_cutoff)
            & (df_valid["observation_time_utc"] <= val_cutoff)
        ].copy()
        test_df = df_valid[df_valid["observation_time_utc"] > val_cutoff].copy()

        # 9. Pre-flight Validation Suite
        feature_cols = [
            "speed_mph",
            "speed_mph_lag_1h",
            "speed_mph_lag_2h",
            "speed_mph_lag_3h",
            "speed_mph_rolling_mean_3h",
            "speed_mph_rolling_std_3h",
            "hour_sin",
            "hour_cos",
            "day_sin",
            "day_cos",
            "is_weekend",
            "temperature_celsius",
            "precipitation_mm",
            "wind_speed_kmh",
            "is_imputed",
            "is_outlier",
        ]

        report = self.preflight_gate.evaluate_dataset(
            dataset_name="traffic_congestion_features",
            train_df=train_df,
            val_df=val_df,
            test_df=test_df,
            target_col="target_speed_lead_1h",
            feature_cols=feature_cols,
            time_col="observation_time_utc",
        )

        duration = time.time() - start_time
        self.log_audit_metric(
            step="assemble_traffic_features",
            input_count=len(df),
            output_count=len(df_valid),
            quarantine_count=0,
            duration_sec=duration,
            details={
                "train_count": len(train_df),
                "val_count": len(val_df),
                "test_count": len(test_df),
                "approved": report.is_approved_for_training,
            },
        )

        return train_df, val_df, test_df, report
