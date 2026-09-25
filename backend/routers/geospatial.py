"""
SmartCityAI - Geospatial Intelligence API Router
Endpoints returning GeoJSON FeatureCollections for H3 hexagonal risk maps and spatial hotspots.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends, Query
from backend.auth import AuthenticatedUser, require_role
from backend.services.geospatial_service import GeospatialService

router = APIRouter(prefix="/geospatial", tags=["Geospatial Intelligence"])


@router.get(
    "/hexagons",
    summary="Get H3 hexagonal risk grid (GeoJSON)",
    description="Returns an H3 hexagonal grid with Empirical Bayes rate smoothing applied to eliminate Small Number Problem artifacts.",
)
def get_hexagonal_risk_grid(
    min_risk: float = Query(0.0, ge=0.0, description="Minimum Empirical Bayes smoothed crash rate"),
    user: AuthenticatedUser = Depends(require_role("viewer")),
) -> Dict[str, Any]:
    return GeospatialService.get_hexagonal_risk_grid(min_risk=min_risk)


@router.get(
    "/hotspots",
    summary="Get spatial crash hotspots (GeoJSON)",
    description="Returns statistically significant spatial incident clusters evaluated via DBSCAN and Getis-Ord Gi*.",
)
def get_spatial_hotspots(
    eps_meters: float = Query(400.0, ge=50.0, le=2000.0, description="DBSCAN neighborhood radius in meters"),
    min_samples: int = Query(2, ge=1, le=20, description="Minimum incidents to form a dense cluster"),
    user: AuthenticatedUser = Depends(require_role("viewer")),
) -> Dict[str, Any]:
    return GeospatialService.get_spatial_hotspots(eps_meters=eps_meters, min_samples=min_samples)
