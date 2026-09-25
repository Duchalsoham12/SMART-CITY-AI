"""
SmartCityAI - Kernel Density Estimator (KDE) & Risk Surface Generator
Computes 2D severity-weighted Gaussian Kernel Density surfaces with adaptive bandwidth
for Leaflet heatmap visualization and hotspot contouring.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.spatial.distance import cdist


class KernelDensityEstimator:
    """
    Computes continuous severity-weighted spatial density surfaces.
    """

    def __init__(
        self,
        bandwidth_meters: Optional[float] = None,  # None triggers Silverman's rule
        grid_resolution_meters: float = 200.0,
    ):
        self.bandwidth_meters = bandwidth_meters
        self.grid_resolution_meters = grid_resolution_meters
        self.points_: Optional[np.ndarray] = None
        self.weights_: Optional[np.ndarray] = None
        self.effective_bandwidth_: float = 250.0

    def fit(
        self,
        df: pd.DataFrame,
        lat_col: str = "latitude",
        lon_col: str = "longitude",
        severity_col: Optional[str] = "severity_tier",
    ) -> "KernelDensityEstimator":
        """
        Fits KDE surface over coordinate points with severity weights:
        Tier 0 (damage): weight 1.0, Tier 1 (injury): weight 3.0, Tier 2 (fatal): weight 10.0.
        """
        lats = df[lat_col].to_numpy()
        lons = df[lon_col].to_numpy()
        self.points_ = np.column_stack([lats, lons])

        # Assign weights
        if severity_col and severity_col in df.columns:
            tier_weights = {0: 1.0, 1: 3.0, 2: 10.0}
            weights = df[severity_col].map(lambda t: tier_weights.get(t, 1.0)).to_numpy()
        else:
            weights = np.ones(len(df), dtype=float)

        self.weights_ = weights

        # Bandwidth selection: if not manually specified, apply Silverman's rule
        if self.bandwidth_meters is None:
            n = len(df)
            std_lat = np.std(lats) * 111000.0
            std_lon = np.std(lons) * 111000.0
            avg_std = (std_lat + std_lon) / 2.0
            # Silverman's rule of thumb: h = 0.9 * A * n^(-1/5)
            self.effective_bandwidth_ = max(0.9 * avg_std * (n ** (-0.2)), 100.0)
        else:
            self.effective_bandwidth_ = self.bandwidth_meters

        return self

    def evaluate_points(
        self, query_lats: np.ndarray, query_lons: np.ndarray
    ) -> np.ndarray:
        """
        Evaluates weighted Gaussian density at specified query coordinates.
        """
        if self.points_ is None:
            raise ValueError("KDE model must be fitted before evaluation.")

        # Convert bandwidth from meters to approximate degrees
        h_deg = self.effective_bandwidth_ / 111000.0

        query_points = np.column_stack([query_lats, query_lons])
        # Compute pairwise Euclidean distance in degrees
        distances = cdist(query_points, self.points_, metric="euclidean")

        # Gaussian kernel: K(u) = (1 / 2*pi) * exp(-0.5 * u^2)
        u = distances / h_deg
        kernel_vals = (1.0 / (2.0 * np.pi * (h_deg ** 2))) * np.exp(-0.5 * (u ** 2))

        # Weighted sum: sum(w_i * K(u_i)) / sum(w_i)
        densities = np.dot(kernel_vals, self.weights_) / np.sum(self.weights_)
        return densities

    def generate_density_grid(
        self, bbox: Dict[str, float]
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Generates regular 2D density raster grid over bounding box for Leaflet.heat overlay.
        Returns (grid_lats, grid_lons, density_matrix).
        """
        lat_step = self.grid_resolution_meters / 111000.0
        lon_step = self.grid_resolution_meters / (111000.0 * np.cos(np.radians(bbox["lat_min"])))

        lats = np.arange(bbox["lat_min"], bbox["lat_max"], lat_step)
        lons = np.arange(bbox["lon_min"], bbox["lon_max"], lon_step)

        grid_lon, grid_lat = np.meshgrid(lons, lats)
        flat_lats = grid_lat.ravel()
        flat_lons = grid_lon.ravel()

        densities = self.evaluate_points(flat_lats, flat_lons)
        density_matrix = densities.reshape(grid_lat.shape)

        return lats, lons, density_matrix
