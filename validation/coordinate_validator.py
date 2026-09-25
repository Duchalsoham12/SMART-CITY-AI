"""
SmartCityAI - Coordinate Validator
Audits geospatial coordinates against physical ranges, null island, and municipal bounding boxes.
Does NOT silently drop rows; tags audit flags and extracts quarantine partitions.
"""

from typing import Dict, Tuple
import pandas as pd


class CoordinateValidator:
    """Validates geographic coordinates and tracks audit provenance."""

    def __init__(self, bounding_box: Dict[str, float], allow_null_with_flag: bool = False):
        """
        Args:
            bounding_box: Dict with 'lat_min', 'lat_max', 'lon_min', 'lon_max'.
            allow_null_with_flag: If True, missing coordinates are flagged rather than causing exceptions.
        """
        self.lat_min = bounding_box["lat_min"]
        self.lat_max = bounding_box["lat_max"]
        self.lon_min = bounding_box["lon_min"]
        self.lon_max = bounding_box["lon_max"]
        self.allow_null_with_flag = allow_null_with_flag

    def validate_coordinates(
        self,
        df: pd.DataFrame,
        lat_col: str = "latitude",
        lon_col: str = "longitude",
        flag_col: str = "is_valid_coordinate",
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Validates coordinates and returns (audited_df, quarantine_df).
        
        Audited df retains all records with the flag_col explicitly set to True/False.
        Quarantine df contains copies of failed records annotated with specific rejection reason.
        """
        df = df.copy()

        # 1. Null Coordinate Check
        is_null = df[lat_col].isna() | df[lon_col].isna()

        # 2. Mathematical Validity Check (-90 <= lat <= 90, -180 <= lon <= 180)
        is_math_valid = (
            (~is_null)
            & (df[lat_col] >= -90.0)
            & (df[lat_col] <= 90.0)
            & (df[lon_col] >= -180.0)
            & (df[lon_col] <= 180.0)
        )

        # 3. Null Island Check (0.0, 0.0 within epsilon)
        is_null_island = (
            is_math_valid
            & (df[lat_col].abs() < 1e-4)
            & (df[lon_col].abs() < 1e-4)
        )

        # 4. Regional Municipal Bounding Box Check
        is_in_bounds = (
            is_math_valid
            & (~is_null_island)
            & (df[lat_col] >= self.lat_min)
            & (df[lat_col] <= self.lat_max)
            & (df[lon_col] >= self.lon_min)
            & (df[lon_col] <= self.lon_max)
        )

        df[flag_col] = is_in_bounds

        # Build quarantine audit dataframe
        failed_mask = ~is_in_bounds
        quarantine_df = df[failed_mask].copy()

        # Annotate specific failure reasons
        reasons = []
        for idx, row in quarantine_df.iterrows():
            if pd.isna(row[lat_col]) or pd.isna(row[lon_col]):
                reasons.append("NULL_COORDINATES")
            elif row[lat_col] < -90.0 or row[lat_col] > 90.0 or row[lon_col] < -180.0 or row[lon_col] > 180.0:
                reasons.append("MATHEMATICAL_RANGE_VIOLATION")
            elif abs(row[lat_col]) < 1e-4 and abs(row[lon_col]) < 1e-4:
                reasons.append("NULL_ISLAND_COORDINATE")
            else:
                reasons.append("OUT_OF_MUNICIPAL_BOUNDS")

        quarantine_df["quarantine_reason"] = reasons
        return df, quarantine_df
