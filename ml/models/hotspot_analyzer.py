"""
SmartCityAI - Geospatial Hotspot Analysis
Implements Euclidean K-Means Baseline, Spatial DBSCAN with Haversine metric,
and Getis-Ord Gi* Local Spatial Autocorrelation statistics.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN, KMeans
from ml.evaluation.metrics import ClusteringMetrics
from ml.models.base_model import SmartCityModel


class KMeansHotspotBaseline(SmartCityModel):
    """
    Baseline model: Standard K-Means on Euclidean coordinates.
    Forces all points (including noise) into spherical geometric clusters.
    """

    def __init__(self, n_clusters: int = 10):
        super().__init__("hotspot_kmeans_baseline", version="1.0.0")
        self.n_clusters = n_clusters
        self.model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)

    def fit(self, X: pd.DataFrame, y=None) -> "KMeansHotspotBaseline":
        coords = X[["latitude", "longitude"]].to_numpy()
        self.model.fit(coords)
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        coords = X[["latitude", "longitude"]].to_numpy()
        return self.model.predict(coords)

    def evaluate(self, X_val: pd.DataFrame, y_val=None) -> Dict[str, float]:
        coords = X_val[["latitude", "longitude"]].to_numpy()
        labels = self.predict(X_val)
        self.metrics_summary = ClusteringMetrics.calculate(coords, labels, metric="euclidean")
        return self.metrics_summary


class DBSCANHotspotAnalyzer(SmartCityModel):
    """
    Production Model: Density-Based Spatial Clustering (DBSCAN) using the
    Haversine great-circle metric. Separates true dense blackspots from noise (-1).
    """

    def __init__(self, eps_meters: float = 250.0, min_samples: int = 10):
        super().__init__("hotspot_spatial_dbscan", version="1.0.0")
        self.eps_meters = eps_meters
        self.min_samples = min_samples
        # Convert meters to radians for Haversine metric: eps_rad = eps_m / Earth_radius_m
        self.eps_radians = eps_meters / 6371000.0
        self.model = DBSCAN(
            eps=self.eps_radians,
            min_samples=min_samples,
            metric="haversine",
        )
        self.cluster_centroids_: Dict[int, Tuple[float, float]] = {}

    def fit(self, X: pd.DataFrame, y=None) -> "DBSCANHotspotAnalyzer":
        # DBSCAN with haversine requires coordinates in RADIANS: (lat_rad, lon_rad)
        lats_rad = np.radians(X["latitude"].to_numpy())
        lons_rad = np.radians(X["longitude"].to_numpy())
        coords_rad = np.column_stack([lats_rad, lons_rad])

        labels = self.model.fit_predict(coords_rad)
        self.labels_ = labels

        # Compute cluster centroids in degrees
        df_clusters = X.copy()
        df_clusters["_cluster"] = labels
        for cid in set(labels):
            if cid != -1:
                c_pts = df_clusters[df_clusters["_cluster"] == cid]
                self.cluster_centroids_[cid] = (
                    float(c_pts["latitude"].mean()),
                    float(c_pts["longitude"].mean()),
                )

        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        # Note: DBSCAN does not have an inductive .predict(); for new points we query nearest cluster centroid
        if not self.cluster_centroids_:
            return np.full(len(X), -1, dtype=int)

        lats = X["latitude"].to_numpy()
        lons = X["longitude"].to_numpy()
        assigned = []

        for lat, lon in zip(lats, lons):
            best_cid = -1
            min_dist = float("inf")
            for cid, (c_lat, c_lon) in self.cluster_centroids_.items():
                d = np.hypot(lat - c_lat, lon - c_lon) * 111000.0  # approximate meters
                if d <= self.eps_meters and d < min_dist:
                    min_dist = d
                    best_cid = cid
            assigned.append(best_cid)

        return np.array(assigned, dtype=int)

    def evaluate(self, X_val: pd.DataFrame, y_val=None) -> Dict[str, float]:
        lats_rad = np.radians(X_val["latitude"].to_numpy())
        lons_rad = np.radians(X_val["longitude"].to_numpy())
        coords_rad = np.column_stack([lats_rad, lons_rad])
        labels = self.predict(X_val)
        self.metrics_summary = ClusteringMetrics.calculate(coords_rad, labels, metric="haversine")
        return self.metrics_summary


class GetisOrdSpatialAnalyzer:
    """
    Computes Getis-Ord Gi* local spatial autocorrelation statistics over spatial cells.
    Calculates z-scores: Gi* > 1.96 indicates statistically significant hot spot (p < 0.05).
    """

    @staticmethod
    def calculate_gi_star(
        cell_counts: pd.Series, spatial_weights_matrix: np.ndarray
    ) -> pd.DataFrame:
        """
        Computes Getis-Ord Gi* z-scores for an array of spatial cell counts.
        """
        x = cell_counts.to_numpy(dtype=float)
        n = len(x)
        w = spatial_weights_matrix

        x_bar = np.mean(x)
        s = np.std(x) if np.std(x) > 0 else 1.0

        w_i_sum = np.sum(w, axis=1)
        w_i_sq_sum = np.sum(w ** 2, axis=1)

        numerator = np.dot(w, x) - (x_bar * w_i_sum)
        denom_radicand = ((n * w_i_sq_sum) - (w_i_sum ** 2)) / (n - 1)
        # Numerical protection against negative values under square root
        denom_radicand = np.maximum(denom_radicand, 1e-10)
        denominator = s * np.sqrt(denom_radicand)

        gi_zscores = numerator / denominator

        # Assign statistical classification
        significance = []
        for z in gi_zscores:
            if z > 2.58:
                significance.append("HOT_SPOT_99%_CONFIDENCE")
            elif z > 1.96:
                significance.append("HOT_SPOT_95%_CONFIDENCE")
            elif z < -1.96:
                significance.append("COLD_SPOT_95%_CONFIDENCE")
            else:
                significance.append("NOT_SIGNIFICANT")

        result_df = pd.DataFrame({
            "cell_count": x,
            "gi_zscore": np.round(gi_zscores, 4),
            "significance": significance,
        })
        return result_df
