"""SmartCityAI Models Package"""

from .base_model import SmartCityModel
from .traffic_forecaster import MovingAverageBaseline, LightGBMTrafficForecaster
from .accident_risk_classifier import PriorProbabilityBaseline, XGBoostAccidentRiskClassifier
from .aqi_forecaster import SeasonalPersistenceBaseline, LightGBMAQIForecaster
from .anomaly_detector import RollingZScoreBaseline, IsolationForestAnomalyDetector
from .hotspot_analyzer import (
    KMeansHotspotBaseline,
    DBSCANHotspotAnalyzer,
    GetisOrdSpatialAnalyzer,
)

# Aliases for unified interfaces
TrafficForecaster = LightGBMTrafficForecaster
AccidentRiskClassifier = XGBoostAccidentRiskClassifier
AQIForecaster = LightGBMAQIForecaster
UrbanAnomalyDetector = IsolationForestAnomalyDetector

__all__ = [
    "SmartCityModel",
    "MovingAverageBaseline",
    "LightGBMTrafficForecaster",
    "TrafficForecaster",
    "PriorProbabilityBaseline",
    "XGBoostAccidentRiskClassifier",
    "AccidentRiskClassifier",
    "SeasonalPersistenceBaseline",
    "LightGBMAQIForecaster",
    "AQIForecaster",
    "RollingZScoreBaseline",
    "IsolationForestAnomalyDetector",
    "UrbanAnomalyDetector",
    "KMeansHotspotBaseline",
    "DBSCANHotspotAnalyzer",
    "GetisOrdSpatialAnalyzer",
]
