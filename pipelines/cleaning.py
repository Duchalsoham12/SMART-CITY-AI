"""
SmartCityAI - Staging Cleaning Pipeline
Executes timezone harmonization, deduplication, coordinate auditing,
explicit missing-value handling, and outlier detection with quarantine isolation.
"""

import time
from typing import Any, Dict, Tuple
import pandas as pd
from pipelines.base import BasePipeline
from validation.coordinate_validator import CoordinateValidator
from validation.outlier_detector import OutlierDetector


class StagingCleaningPipeline(BasePipeline):
    """Orchestrates Bronze-to-Silver data harmonization."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__("staging_cleaning_pipeline", config)
        self.coord_validator = CoordinateValidator(
            self.config["spatial_boundaries"]["chicago"]
        )
        self.outlier_detector = OutlierDetector(
            min_physical=self.config["outlier_detection"]["speed_bounds_mph"]["min_physical"],
            max_physical=self.config["outlier_detection"]["speed_bounds_mph"]["max_physical"],
            z_threshold=self.config["outlier_detection"]["z_score_threshold"],
            iqr_multiplier=self.config["outlier_detection"]["iqr_multiplier"],
        )

    def clean_traffic_data(
        self, raw_df: pd.DataFrame, source_tz: str = "America/Chicago"
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Transforms raw traffic observations into validated staging records.
        Returns:
            staging_df: Harmonized, audited dataframe ready for staging.
            quarantine_df: Rejected records with explicit failure reasons.
        """
        start_time = time.time()
        initial_count = len(raw_df)
        df = raw_df.copy()
        quarantine_frames = []

        # 1. Timestamp Normalization & Timezone Harmonization to UTC
        # Parse timestamp strings, localize to source timezone, then convert to UTC
        df["observation_time_utc"] = (
            pd.to_datetime(df["raw_timestamp"])
            .dt.tz_localize(source_tz, ambiguous="NaT", nonexistent="shift_forward")
            .dt.tz_convert("UTC")
        )
        # Check for unparseable timestamps
        invalid_time_mask = df["observation_time_utc"].isna()
        if invalid_time_mask.any():
            bad_time_df = df[invalid_time_mask].copy()
            bad_time_df["quarantine_reason"] = "UNPARSEABLE_OR_AMBIGUOUS_TIMESTAMP"
            quarantine_frames.append(bad_time_df)
            df = df[~invalid_time_mask].copy()

        # 2. Duplicate Detection (Exact & Business Key Collisions)
        # Business key: (segment_id, observation_time_utc)
        dup_mask = df.duplicated(subset=["segment_id", "observation_time_utc"], keep="last")
        if dup_mask.any():
            dup_df = df[dup_mask].copy()
            dup_df["quarantine_reason"] = "BUSINESS_KEY_COLLISION_DUPLICATE"
            quarantine_frames.append(dup_df)
            df = df[~dup_mask].copy()

        # 3. Coordinate Validation (Bounding Box & Null Island)
        df, coord_quarantine = self.coord_validator.validate_coordinates(
            df,
            lat_col="start_latitude",
            lon_col="start_longitude",
            flag_col="is_valid_coordinate",
        )
        if len(coord_quarantine) > 0:
            quarantine_frames.append(coord_quarantine)
            # Retain only valid coordinates for downstream spatial modeling
            df = df[df["is_valid_coordinate"]].copy()

        # 4. Explicit Missing Value Imputation (with Audit Indicator)
        # Sort by segment and time before time-series imputation
        df = df.sort_values(by=["segment_id", "observation_time_utc"]).reset_index(drop=True)
        
        # Track original nulls explicitly
        was_null = df["current_speed"].isna() | (df["current_speed"] < 0)
        
        # Forward fill up to 2 intervals strictly within each segment
        df["speed_mph"] = (
            df.groupby("segment_id")["current_speed"]
            .transform(lambda s: s.replace(-1.0, None).ffill(limit=self.config["cleaning"]["max_forward_fill_limit"]))
        )
        # Mark records where imputation occurred
        df["is_imputed_speed"] = was_null & df["speed_mph"].notna()

        # Check for structural outages (gaps > 2 intervals that remain un-imputed)
        still_null_mask = df["speed_mph"].isna()
        if still_null_mask.any():
            unresolved_df = df[still_null_mask].copy()
            unresolved_df["quarantine_reason"] = "STRUCTURAL_SENSOR_OUTAGE_EXCEEDS_FFILL_LIMIT"
            quarantine_frames.append(unresolved_df)
            df = df[~still_null_mask].copy()

        # 5. Outlier Detection (Physical & Statistical - NO SILENT DROPS)
        df = self.outlier_detector.detect_outliers(
            df, target_col="speed_mph", group_col="segment_id"
        )

        # 6. Assemble Quarantine DataFrame
        if quarantine_frames:
            quarantine_df = pd.concat(quarantine_frames, ignore_index=True)
        else:
            quarantine_df = pd.DataFrame(columns=list(df.columns) + ["quarantine_reason"])

        duration = time.time() - start_time
        self.log_audit_metric(
            step="clean_traffic_data",
            input_count=initial_count,
            output_count=len(df),
            quarantine_count=len(quarantine_df),
            duration_sec=duration,
            details={"imputed_rows": int(df["is_imputed_speed"].sum())},
        )

        return df, quarantine_df
