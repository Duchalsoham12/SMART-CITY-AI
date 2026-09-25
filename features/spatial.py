"""
SmartCityAI - Spatial Feature Engineering
Implements Haversine distance, coordinate projections, and spatial grid/H3 indexing.
"""

from typing import List, Tuple
import numpy as np
import pandas as pd


class SpatialFeatureGenerator:
    """Calculates geospatial distances, buffer snap assignments, and grid encodings."""

    @staticmethod
    def haversine_distance(
        lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """
        Computes great-circle distance between two GPS coordinates in meters.
        """
        r = 6371000.0  # Earth mean radius in meters
        phi1, phi2 = np.radians(lat1), np.radians(lat2)
        delta_phi = np.radians(lat2 - lat1)
        delta_lambda = np.radians(lon2 - lon1)

        a = (
            np.sin(delta_phi / 2.0) ** 2
            + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2.0) ** 2
        )
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
        return float(r * c)

    @staticmethod
    def haversine_vectorized(
        lats1: np.ndarray, lons1: np.ndarray, lats2: np.ndarray, lons2: np.ndarray
    ) -> np.ndarray:
        """Vectorized Haversine distance across coordinate arrays."""
        r = 6371000.0
        phi1, phi2 = np.radians(lats1), np.radians(lats2)
        delta_phi = np.radians(lats2 - lats1)
        delta_lambda = np.radians(lons2 - lons1)

        a = (
            np.sin(delta_phi / 2.0) ** 2
            + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2.0) ** 2
        )
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
        return r * c

    @staticmethod
    def assign_spatial_grid_index(
        df: pd.DataFrame,
        lat_col: str = "latitude",
        lon_col: str = "longitude",
        grid_size_meters: float = 500.0,
    ) -> pd.DataFrame:
        """
        Assigns a deterministic spatial grid cell ID based on meter quantization.
        Uses 1 degree lat ~ 111,000m and 1 degree lon ~ 111,000m * cos(lat).
        Provides a fast fallback or complementary index to H3.
        """
        df = df.copy()
        lat_rad = np.radians(df[lat_col])
        meters_per_deg_lat = 111132.954
        meters_per_deg_lon = 111412.84 * np.cos(lat_rad)

        grid_y = np.floor((df[lat_col] * meters_per_deg_lat) / grid_size_meters).astype(int)
        grid_x = np.floor((df[lon_col] * meters_per_deg_lon) / grid_size_meters).astype(int)

        df["spatial_grid_id"] = (
            grid_y.astype(str) + "_" + grid_x.astype(str)
        )
        return df
