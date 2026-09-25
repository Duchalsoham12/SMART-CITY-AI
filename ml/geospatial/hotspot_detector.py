"""
SmartCityAI - Spatial Hotspot & Cluster Detector
Combines Spatial DBSCAN (Haversine distance) and Getis-Ord Gi* statistics,
producing GeoJSON FeatureCollections for Leaflet map presentation.
"""

import json
from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from ml.models.hotspot_analyzer import GetisOrdSpatialAnalyzer


class GeospatialHotspotDetector:
    """
    Identifies high-density crash epicenters and statistically significant hot spots.
    """

    def __init__(self, eps_meters: float = 250.0, min_samples: int = 10):
        self.eps_meters = eps_meters
        self.min_samples = min_samples
        self.eps_radians = eps_meters / 6371000.0

    def detect_clusters(
        self, df: pd.DataFrame, lat_col: str = "latitude", lon_col: str = "longitude"
    ) -> pd.DataFrame:
        """
        Executes Spatial DBSCAN using the Haversine great-circle metric.
        Labels: >= 0 (Cluster ID), -1 (Background noise).
        """
        df = df.copy()
        lats_rad = np.radians(df[lat_col].to_numpy())
        lons_rad = np.radians(df[lon_col].to_numpy())
        coords_rad = np.column_stack([lats_rad, lons_rad])

        db = DBSCAN(eps=self.eps_radians, min_samples=self.min_samples, metric="haversine")
        labels = db.fit_predict(coords_rad)
        df["cluster_id"] = labels
        return df

    @staticmethod
    def to_geojson_feature_collection(
        cluster_df: pd.DataFrame,
        lat_col: str = "latitude",
        lon_col: str = "longitude",
        cluster_col: str = "cluster_id",
    ) -> Dict[str, Any]:
        """
        Transforms clustered incident records into a standard GeoJSON FeatureCollection
        suitable for direct consumption by Leaflet.js / React-Leaflet.
        """
        features = []

        # Exclude noise points (-1) from primary hotspot polygons/points
        valid_clusters = cluster_df[cluster_df[cluster_col] >= 0]

        for cid, group in valid_clusters.groupby(cluster_col):
            center_lat = float(group[lat_col].mean())
            center_lon = float(group[lon_col].mean())
            count = len(group)

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [center_lon, center_lat],
                },
                "properties": {
                    "cluster_id": int(cid),
                    "incident_count": count,
                    "radius_meters": 250.0,
                    "severity_label": "CRITICAL_BLACKSPOT" if count >= 25 else "HIGH_RISK_CLUSTER",
                },
            }
            features.append(feature)

        return {
            "type": "FeatureCollection",
            "features": features,
        }
