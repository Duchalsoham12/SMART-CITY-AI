"""
SmartCityAI - Outlier Detector
Detects physical and statistical anomalies without silently dropping records.
Annotates rows with explicit boolean flags and classification categories.
"""

from typing import Dict, Tuple
import numpy as np
import pandas as pd


class OutlierDetector:
    """Flags domain and statistical outliers with strict audit preservation."""

    def __init__(
        self,
        min_physical: float = 0.0,
        max_physical: float = 100.0,
        z_threshold: float = 3.5,
        iqr_multiplier: float = 1.5,
    ):
        self.min_physical = min_physical
        self.max_physical = max_physical
        self.z_threshold = z_threshold
        self.iqr_multiplier = iqr_multiplier

    def detect_outliers(
        self,
        df: pd.DataFrame,
        target_col: str,
        group_col: str = None,
    ) -> pd.DataFrame:
        """
        Applies physical boundary and statistical outlier checks.
        Adds columns:
          - is_outlier (bool): True if flagged by physical or statistical criteria
          - outlier_type (str): 'NORMAL', 'PHYSICAL_BOUND_VIOLATION', 'STATISTICAL_IQR', 'STATISTICAL_ZSCORE'
          - outlier_severity (str): 'LOW', 'MEDIUM', 'HIGH'
        """
        df = df.copy()
        values = df[target_col]

        # 1. Physical Domain Bounds Violation
        physical_mask = (values < self.min_physical) | (values > self.max_physical)

        # 2. Statistical IQR Bounds (computed per group if specified, or globally)
        if group_col and group_col in df.columns:
            q25 = df.groupby(group_col)[target_col].transform(lambda s: s.quantile(0.25))
            q75 = df.groupby(group_col)[target_col].transform(lambda s: s.quantile(0.75))
            median = df.groupby(group_col)[target_col].transform("median")
            std = df.groupby(group_col)[target_col].transform("std").fillna(1.0)
        else:
            q25 = values.quantile(0.25)
            q75 = values.quantile(0.75)
            median = values.median()
            std = values.std() if values.std() > 0 else 1.0

        iqr = q75 - q25
        lower_iqr = q25 - (self.iqr_multiplier * iqr)
        upper_iqr = q75 + (self.iqr_multiplier * iqr)
        iqr_mask = (values < lower_iqr) | (values > upper_iqr)

        # 3. Modified Z-Score / Standard Z-Score
        z_scores = ((values - median) / std).abs()
        z_mask = z_scores > self.z_threshold

        # Combine Flags
        is_outlier = physical_mask | iqr_mask | z_mask

        # Assign Outlier Category
        outlier_types = []
        outlier_severities = []

        for p_flag, z_flag, i_flag in zip(physical_mask, z_mask, iqr_mask):
            if p_flag:
                outlier_types.append("PHYSICAL_BOUND_VIOLATION")
                outlier_severities.append("HIGH")
            elif z_flag:
                outlier_types.append("STATISTICAL_ZSCORE")
                outlier_severities.append("MEDIUM")
            elif i_flag:
                outlier_types.append("STATISTICAL_IQR")
                outlier_severities.append("LOW")
            else:
                outlier_types.append("NORMAL")
                outlier_severities.append("NONE")

        df[f"{target_col}_is_outlier"] = is_outlier
        df[f"{target_col}_outlier_type"] = outlier_types
        df[f"{target_col}_outlier_severity"] = outlier_severities

        return df
