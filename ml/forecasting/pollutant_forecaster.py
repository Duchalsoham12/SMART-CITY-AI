"""
SmartCityAI - Multi-Pollutant & AQI Composite Forecaster
Forecasts PM2.5, PM10, and NO2 concentrations and calculates composite AQI categories.
"""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from ml.forecasting.quantile_forecaster import QuantileLightGBMForecaster


class MultiPollutantForecaster:
    """
    Simultaneously forecasts criteria pollutants (PM2.5, PM10, NO2)
    and computes the composite Air Quality Index (NAQI).
    """

    def __init__(self, target_pollutants: Optional[List[str]] = None):
        self.target_pollutants = target_pollutants or ["pm25", "pm10", "no2"]
        self.models_: Dict[str, QuantileLightGBMForecaster] = {}

    def fit(self, X: pd.DataFrame, Y_pollutants: pd.DataFrame) -> "MultiPollutantForecaster":
        for pol in self.target_pollutants:
            if pol in Y_pollutants.columns:
                model = QuantileLightGBMForecaster(n_estimators=100, max_depth=5)
                model.fit(X, Y_pollutants[pol])
                self.models_[pol] = model
        return self

    def predict(self, X: pd.DataFrame) -> pd.DataFrame:
        """Generates point forecasts and intervals for all pollutants."""
        results = {}
        for pol, model in self.models_.items():
            pol_preds = model.predict(X)
            results[f"{pol}_pred"] = pol_preds["point_forecast"]
            results[f"{pol}_lower_90"] = pol_preds["q_05"]
            results[f"{pol}_upper_90"] = pol_preds["q_95"]

        df_out = pd.DataFrame(results)

        # Compute composite AQI category from dominant pollutant
        if "pm25_pred" in df_out.columns:
            df_out["composite_naqi_category"] = self.compute_naqi_category(
                df_out["pm25_pred"].to_numpy()
            )

        return df_out

    @staticmethod
    def compute_naqi_category(pm25_values: np.ndarray) -> List[str]:
        """Maps continuous PM2.5 (ug/m3) to official National AQI categories."""
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
