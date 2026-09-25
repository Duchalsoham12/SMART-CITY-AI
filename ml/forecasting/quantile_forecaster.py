"""
SmartCityAI - Quantile Regression Forecaster
Produces continuous forecasts alongside calibrated 90% prediction intervals
using LightGBM pinball loss (alpha = 0.05, 0.50, 0.95).
"""

from typing import Dict, List, Optional, Tuple
import lightgbm as lgb
import numpy as np
import pandas as pd


class QuantileLightGBMForecaster:
    """
    Multi-quantile forecaster providing non-parametric uncertainty estimates.
    Eliminates Gaussian error assumptions by learning empirical conditional quantiles.
    """

    def __init__(
        self,
        quantiles: Optional[List[float]] = None,
        n_estimators: int = 150,
        learning_rate: float = 0.05,
        max_depth: int = 6,
        feature_cols: Optional[List[str]] = None,
    ):
        self.quantiles = quantiles or [0.05, 0.50, 0.95]
        self.feature_cols = feature_cols
        self.models_: Dict[float, lgb.LGBMRegressor] = {}
        self.params = {
            "n_estimators": n_estimators,
            "learning_rate": learning_rate,
            "max_depth": max_depth,
            "random_state": 42,
            "n_jobs": -1,
            "verbose": -1,
        }

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "QuantileLightGBMForecaster":
        features = self.feature_cols if self.feature_cols else list(X.columns)
        X_train = X[features]
        self.feature_cols = features

        for q in self.quantiles:
            model = lgb.LGBMRegressor(
                objective="quantile",
                alpha=q,
                **self.params,
            )
            model.fit(X_train, y)
            self.models_[q] = model

        return self

    def predict(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Generates predictions for all quantiles and enforces monotonicity:
        lower (q=0.05) <= median (q=0.50) <= upper (q=0.95).
        """
        features = self.feature_cols if self.feature_cols else list(X.columns)
        preds_dict = {}

        for q in sorted(self.quantiles):
            preds_dict[q] = np.clip(self.models_[q].predict(X[features]), 0.0, None)

        df_preds = pd.DataFrame(preds_dict)
        # Ensure quantile monotonicity (prevent quantile crossing artifacts)
        sorted_vals = np.sort(df_preds.values, axis=1)
        for i, q in enumerate(sorted(self.quantiles)):
            df_preds[q] = sorted_vals[:, i]

        df_preds.columns = [f"q_{int(q*100):02d}" for q in sorted(self.quantiles)]
        df_preds["point_forecast"] = df_preds["q_50"]
        df_preds["interval_width_90"] = df_preds["q_95"] - df_preds["q_05"]
        return df_preds

    def evaluate_coverage(
        self, X_val: pd.DataFrame, y_val: pd.Series
    ) -> Dict[str, float]:
        """
        Computes Prediction Interval Coverage Probability (PICP)
        and Mean Prediction Interval Width (MPIW).
        """
        preds = self.predict(X_val)
        y = y_val.to_numpy()

        lower = preds["q_05"].to_numpy()
        upper = preds["q_95"].to_numpy()
        point = preds["point_forecast"].to_numpy()

        # PICP: Fraction of true observations falling within [lower, upper]
        in_interval = (y >= lower) & (y <= upper)
        picp = float(np.mean(in_interval))

        # MPIW: Average width of the prediction envelope
        mpiw = float(np.mean(upper - lower))

        # Point forecast accuracy
        mae = float(np.mean(np.abs(y - point)))
        rmse = float(np.sqrt(np.mean((y - point) ** 2)))

        return {
            "picp_90": round(picp, 4),
            "mpiw_90": round(mpiw, 4),
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
        }


# Alias for convenience
QuantileForecaster = QuantileLightGBMForecaster
