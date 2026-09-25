"""
SmartCityAI - Geospatial Service Layer
Generates H3 hexagonal risk layers, KDE density surfaces, and DBSCAN spatial clusters
formatted as valid GeoJSON FeatureCollections for Leaflet/MapLibre frontends.
"""

from typing import Any, Dict, List
import numpy as np
import pandas as pd
from backend.utils.cache import cached, geospatial_cache
from ml.geospatial.hex_aggregator import HexSpatialAggregator
from ml.geospatial.hotspot_detector import GeospatialHotspotDetector
from ml.geospatial.density_estimator import KernelDensityEstimator


class GeospatialService:
    """Service encapsulating urban spatial binning, risk mapping, and hotspot detection."""

    @staticmethod
    def _create_hex_polygon(center_lat: float, center_lon: float, radius_deg: float = 0.004) -> List[List[float]]:
        """Calculates 6-vertex coordinates of a regular hexagon given center and radius."""
        coords = []
        for i in range(6):
            angle = i * (np.pi / 3.0)
            dx = radius_deg * np.cos(angle)
            dy = radius_deg * np.sin(angle) * 0.75  # Aspect ratio compensation
            coords.append([round(center_lon + dx, 6), round(center_lat + dy, 6)])
        # Close polygon
        coords.append(coords[0])
        return coords

    @classmethod
    @cached(geospatial_cache, ttl_seconds=60.0)
    def get_hexagonal_risk_grid(cls, min_risk: float = 0.0) -> Dict[str, Any]:
        """
        Produces an H3 hexagonal risk grid over the urban metropolitan area
        with Empirical Bayes rate smoothing applied to eliminate Small Number Problem artifacts.
        """
        # Baseline downtown corridor center coordinates
        base_cells = [
            {"name": "Loop Downtown", "lat": 41.8827, "lon": -87.6233, "incidents": 18.0, "exposure": 2500.0},
            {"name": "Near North", "lat": 41.8950, "lon": -87.6250, "incidents": 12.0, "exposure": 1800.0},
            {"name": "West Loop", "lat": 41.8820, "lon": -87.6450, "incidents": 9.0, "exposure": 1400.0},
            {"name": "South Loop", "lat": 41.8650, "lon": -87.6270, "incidents": 6.0, "exposure": 1100.0},
            {"name": "River North", "lat": 41.8920, "lon": -87.6340, "incidents": 14.0, "exposure": 1600.0},
            {"name": "Suburban Fringe", "lat": 41.7800, "lon": -87.7500, "incidents": 1.0, "exposure": 10.0},  # Sparse cell!
        ]

        df = pd.DataFrame(base_cells)
        # Apply Empirical Bayes rate smoothing
        smoothed_df = HexSpatialAggregator.apply_empirical_bayes_smoothing(
            df, incident_col="incidents", exposure_col="exposure"
        )

        features = []
        for _, row in smoothed_df.iterrows():
            eb_rate = float(row["eb_smoothed_rate"])
            if eb_rate < min_risk:
                continue

            h3_idx = HexSpatialAggregator.lat_lng_to_h3(row["lat"], row["lon"])
            polygon_coords = cls._create_hex_polygon(row["lat"], row["lon"])

            # Risk tier
            if eb_rate >= 0.008:
                tier = "CRITICAL"
            elif eb_rate >= 0.005:
                tier = "HIGH"
            elif eb_rate >= 0.002:
                tier = "MEDIUM"
            else:
                tier = "LOW"

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [polygon_coords],
                },
                "properties": {
                    "h3_index": h3_idx,
                    "zone_name": row["name"],
                    "incident_count": int(row["incidents"]),
                    "traffic_exposure": float(row["exposure"]),
                    "raw_rate": float(row["raw_crash_rate"]),
                    "eb_smoothed_rate": eb_rate,
                    "is_sparse_exposure": bool(row["is_sparse_exposure"]),
                    "risk_tier": tier,
                },
            })

        return {
            "type": "FeatureCollection",
            "features": features,
        }

    @classmethod
    @cached(geospatial_cache, ttl_seconds=60.0)
    def get_spatial_hotspots(cls, eps_meters: float = 400.0, min_samples: int = 2) -> Dict[str, Any]:
        """
        Executes DBSCAN spatial clustering and Getis-Ord Gi* analysis
        to identify statistically significant crash risk hotspots.
        """
        # Multi-incident sample coordinates
        df = pd.DataFrame({
            "latitude": [
                41.8827, 41.8829, 41.8831, 41.8825,  # Cluster 0 (Loop intersection)
                41.8950, 41.8953, 41.8948,          # Cluster 1 (River North)
                41.7500,                            # Noise point
            ],
            "longitude": [
                -87.6233, -87.6235, -87.6231, -87.6238,
                -87.6250, -87.6254, -87.6247,
                -87.7000,
            ],
        })

        detector = GeospatialHotspotDetector(eps_meters=eps_meters, min_samples=min_samples)
        clustered_df = detector.detect_clusters(df)
        return GeospatialHotspotDetector.to_geojson_feature_collection(clustered_df)
