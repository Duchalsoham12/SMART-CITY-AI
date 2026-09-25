"""
SmartCityAI - Temporal Feature Engineering
Implements cyclical time transforms, lag generation, and leakage-free rolling windows.
"""

from typing import List
import numpy as np
import pandas as pd


class TemporalFeatureGenerator:
    """Generates autoregressive lags, rolling statistics, and cyclical timestamps."""

    @staticmethod
    def add_cyclical_features(df: pd.DataFrame, time_col: str = "observation_time_utc") -> pd.DataFrame:
        """Encodes cyclical hour, day of week, and weekend indicators."""
        df = df.copy()
        dt = pd.to_datetime(df[time_col])

        # Hour of day (0-23)
        hours = dt.dt.hour
        df["hour_sin"] = np.sin(2 * np.pi * hours / 24.0)
        df["hour_cos"] = np.cos(2 * np.pi * hours / 24.0)

        # Day of week (0-6, Monday=0)
        days = dt.dt.dayofweek
        df["day_sin"] = np.sin(2 * np.pi * days / 7.0)
        df["day_cos"] = np.cos(2 * np.pi * days / 7.0)

        # Is Weekend Indicator
        df["is_weekend"] = (days >= 5).astype(int)

        return df

    @staticmethod
    def add_autoregressive_lags(
        df: pd.DataFrame,
        value_col: str,
        lags: List[int],
        group_col: str = "segment_id",
        time_col: str = "observation_time_utc",
    ) -> pd.DataFrame:
        """
        Generates autoregressive lags strictly backwards in time.
        Ensures sort ordering by (group_col, time_col) prior to shifting.
        """
        df = df.copy()
        df = df.sort_values(by=[group_col, time_col]).reset_index(drop=True)

        for lag in lags:
            col_name = f"{value_col}_lag_{lag}h"
            df[col_name] = df.groupby(group_col)[value_col].shift(lag)

        return df

    @staticmethod
    def add_rolling_statistics(
        df: pd.DataFrame,
        value_col: str,
        windows: List[int],
        group_col: str = "segment_id",
        time_col: str = "observation_time_utc",
    ) -> pd.DataFrame:
        """
        Computes rolling statistics (mean, std).
        LEAKAGE PREVENTION GUARANTEE:
        Uses a shift(1) prior to the rolling window calculation,
        guaranteeing that the observation at time t is NEVER included in rolling summary at t.
        """
        df = df.copy()
        df = df.sort_values(by=[group_col, time_col]).reset_index(drop=True)

        for w in windows:
            mean_col = f"{value_col}_rolling_mean_{w}h"
            std_col = f"{value_col}_rolling_std_{w}h"

            # Strictly look back: shift(1) first
            shifted = df.groupby(group_col)[value_col].shift(1)
            
            # Compute rolling statistics over the shifted series
            df[mean_col] = (
                shifted.groupby(df[group_col])
                .rolling(window=w, min_periods=1)
                .mean()
                .reset_index(level=0, drop=True)
            )
            df[std_col] = (
                shifted.groupby(df[group_col])
                .rolling(window=w, min_periods=1)
                .std()
                .fillna(0.0)
                .reset_index(level=0, drop=True)
            )

        return df
