"""
SmartCityAI - Environmental & Air Quality (PM2.5) Forecaster
Implements 24-hour Seasonal Persistence Baseline and Multivariate LightGBM Regressor.
"""

from typing import Dict, List, Optional
import lightgbm as lgb
import numpy as np
import pandas as pd
from ml.evaluation.metrics import RegressionMetrics
from ml.models.base_model import SmartCityModel


class SeasonalPersistenceBaseline(SmartCityModel):
    """
    Baseline model: Predicts future PM2.5 equal to the reading observed 24 hours prior.
    """

    def __init__(self, lag_col: str = "pm25_lag_24h"):
        super().__init__("aqi_seasonal_persistence_baseline", version="1.0.0")
        self.lag_col = lag_col
        self.default_pm25_ = 35.0

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "SeasonalPersistenceBaseline":
        self.default_pm25_ = float(y.mean())
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if self.lag_col in X.columns:
            return X[self.lag_col].fillna(self.default_pm25_).to_numpy()
        return np.full(len(X), self.default_pm25_)

    def evaluate(self, X_val: pd.DataFrame, y_val: pd.Series) -> Dict[str, float]:
        preds = self.predict(X_val)
        self.metrics_summary = RegressionMetrics.calculate(y_val.to_numpy(), preds)
        return self.metrics_summary


class LightGBMAQIForecaster(SmartCityModel):
    """
    Production Model: Multivariate LightGBM regressor combining pollutant lags
    and meteorological boundary layer vectors.
    """

    def __init__(
        self,
        n_estimators: int = 150,
        learning_rate: float = 0.05,
        max_depth: int = 5,
        feature_cols: Optional[List[str]] = None,
    ):
        super().__init__("aqi_lgbm_forecaster", version="1.0.0")
        self.params = {
            "n_estimators": n_estimators,
            "learning_rate": learning_rate,
            "max_depth": max_depth,
            "random_state": 42,
            "n_jobs": -1,
            "verbose": -1,
        }
        self.feature_cols = feature_cols
        self.model = lgb.LGBMRegressor(**self.params)

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "LightGBMAQIForecaster":
        features = self.feature_cols if self.feature_cols else list(X.columns)
        self.model.fit(X[features], y)
        self.feature_cols = features
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        features = self.feature_cols if self.feature_cols else list(X.columns)
        raw = self.model.predict(X[features])
        # Non-negative PM2.5 constraint
        return np.clip(raw, 0.0, 1500.0)

    @staticmethod
    def map_to_naqi_category(pm25_values: np.ndarray) -> List[str]:
        """Maps continuous PM2.5 (ug/m3) to official National AQI categorical categories."""
        categories = []
        for val in pm25_values:
            if val <= 30.0:
                categories.append("GOOD")
            elif val <= 60.0:
                categories.append("SATISFACTORY")
            elif val <= 90.0:
                categories.append("MODERATE")
            elif val <= 120.0:
                categories.append("POOR")
            elif val <= 250.0:
                categories.append("VERY_POOR")
            else:
                categories.append("SEVERE")
        return categories

    def evaluate(self, X_val: pd.DataFrame, y_val: pd.Series) -> Dict[str, float]:
        preds = self.predict(X_val)
        self.metrics_summary = RegressionMetrics.calculate(y_val.to_numpy(), preds)
        return self.metrics_summary


# Alias for convenience
AQIForecaster = LightGBMAQIForecaster
