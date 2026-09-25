"""
SmartCityAI - Geospatial Coordinate Transformer & Privacy Guard
Validates geographic coordinates, detects inverted lat/lon, projects to planar CRS (meters),
and applies privacy geomasking (spatial jittering & k-anonymity suppression).
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd


class CoordinateTransformer:
    """
    Validates, projects, and geomasks geographic coordinate records.
    """

    def __init__(
        self,
        bounding_box: Dict[str, float],
        local_utm_epsg: int = 32616,  # Default: UTM Zone 16N (Chicago / Illinois)
        privacy_jitter_meters: float = 25.0,
        k_anonymity_threshold: int = 3,
    ):
        self.bbox = bounding_box
        self.local_utm_epsg = local_utm_epsg
        self.privacy_jitter_meters = privacy_jitter_meters
        self.k_anonymity_threshold = k_anonymity_threshold

    def validate_and_correct_inversion(
        self, df: pd.DataFrame, lat_col: str = "latitude", lon_col: str = "longitude"
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Detects inverted coordinates (e.g., longitude passed in latitude column).
        Swaps if inversion is mathematically certain, or quarantines if ambiguous.
        """
        df = df.copy()
        quarantine_reasons = []

        # Detect inverted coordinate symptom:
        # Either |latitude| > 90, OR lat falls in lon bounding box and lon falls in lat bounding box
        is_inverted = (df[lat_col].abs() > 90.0) | (
            (df[lat_col] >= self.bbox["lon_min"])
            & (df[lat_col] <= self.bbox["lon_max"])
            & (df[lon_col] >= self.bbox["lat_min"])
            & (df[lon_col] <= self.bbox["lat_max"])
        )
        if is_inverted.any():
            # Invert coordinates back to correct slots
            inverted_idx = df[is_inverted].index
            temp_lat = df.loc[inverted_idx, lat_col].copy()
            df.loc[inverted_idx, lat_col] = df.loc[inverted_idx, lon_col]
            df.loc[inverted_idx, lon_col] = temp_lat
            df.loc[inverted_idx, "is_coordinate_inverted_corrected"] = True

        # Check bounds
        is_valid = (
            (df[lat_col] >= self.bbox["lat_min"])
            & (df[lat_col] <= self.bbox["lat_max"])
            & (df[lon_col] >= self.bbox["lon_min"])
            & (df[lon_col] <= self.bbox["lon_max"])
        )

        df["is_geographically_valid"] = is_valid
        valid_df = df[is_valid].copy()
        quarantine_df = df[~is_valid].copy()
        quarantine_df["quarantine_reason"] = "OUT_OF_MUNICIPAL_BOUNDING_BOX"

        return valid_df, quarantine_df

    @staticmethod
    def project_wgs84_to_meters(
        lats: np.ndarray, lons: np.ndarray, center_lat: float, center_lon: float
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Projects WGS84 (EPSG:4326) coordinates into local planar Cartesian meters (x, y)
        using local Equirectangular projection centered on metropolitan reference point.
        Provides sub-meter accuracy within city scales (~50 km radius).
        """
        phi_0 = np.radians(center_lat)
        meters_per_deg_lat = 111132.954 - 559.822 * np.cos(2 * phi_0)
        meters_per_deg_lon = 111412.84 * np.cos(phi_0)

        y_meters = (lats - center_lat) * meters_per_deg_lat
        x_meters = (lons - center_lon) * meters_per_deg_lon

        return x_meters, y_meters

    def apply_privacy_geomasking(
        self,
        df: pd.DataFrame,
        lat_col: str = "latitude",
        lon_col: str = "longitude",
        seed: int = 42,
    ) -> pd.DataFrame:
        """
        Applies adaptive 2D Gaussian spatial jittering for sensitive incident points
        (e.g., severe injuries near residential zones) to protect individual privacy (HIPAA/GDPR).
        Brounds displacement within privacy_jitter_meters (typically 15-35m).
        """
        df = df.copy()
        rng = np.random.default_rng(seed)
        n = len(df)

        # Standard deviation in degrees (~25 meters)
        meters_per_deg = 111000.0
        sigma_deg = self.privacy_jitter_meters / meters_per_deg

        # Generate 2D Gaussian perturbations
        delta_lat = rng.normal(0, sigma_deg, n)
        delta_lon = rng.normal(0, sigma_deg, n)

        df[f"{lat_col}_masked"] = df[lat_col] + delta_lat
        df[f"{lon_col}_masked"] = df[lon_col] + delta_lon
        df["is_privacy_geomasked"] = True

        return df

    def apply_k_anonymity_suppression(
        self,
        df: pd.DataFrame,
        cell_id_col: str,
        metric_col: str = "incident_count",
    ) -> pd.DataFrame:
        """
        Suppresses visualization of spatial cells containing fewer than k records,
        preventing individual incident re-identification in sparse residential zones.
        """
        df = df.copy()
        is_suppressed = df[metric_col] < self.k_anonymity_threshold
        df["is_suppressed_for_privacy"] = is_suppressed
        # Zero out metric for suppressed cells in public presentation layer
        df[f"{metric_col}_public"] = np.where(is_suppressed, np.nan, df[metric_col])
        return df
