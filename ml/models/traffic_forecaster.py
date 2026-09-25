"""
SmartCityAI - Traffic Speed & Congestion Forecaster
Implements historical Moving Average Baseline and Production LightGBM Regressor.
"""

from typing import Dict, List, Optional
import lightgbm as lgb
import numpy as np
import pandas as pd
from ml.evaluation.metrics import RegressionMetrics
from ml.models.base_model import SmartCityModel


class MovingAverageBaseline(SmartCityModel):
    """
    Baseline model: Predicts historical average speed for the specific
    (segment_id, hour_of_day, day_of_week) tuple.
    """

    def __init__(self):
        super().__init__("traffic_moving_average_baseline", version="1.0.0")
        self.lookup_table_: Dict[tuple, float] = {}
        self.global_mean_: float = 25.0

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "MovingAverageBaseline":
        df = X.copy()
        df["_target"] = y.values
        self.global_mean_ = float(y.mean())

        # Extract hour and day of week if not already separate columns
        if "hour_of_day" not in df.columns and "observation_time_utc" in df.columns:
            df["hour_of_day"] = pd.to_datetime(df["observation_time_utc"]).dt.hour
            df["day_of_week"] = pd.to_datetime(df["observation_time_utc"]).dt.dayofweek

        group_cols = [c for c in ["segment_id", "hour_of_day", "day_of_week"] if c in df.columns]
        if group_cols:
            grouped = df.groupby(group_cols)["_target"].mean().to_dict()
            self.lookup_table_ = grouped

        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        df = X.copy()
        if "hour_of_day" not in df.columns and "observation_time_utc" in df.columns:
            df["hour_of_day"] = pd.to_datetime(df["observation_time_utc"]).dt.hour
            df["day_of_week"] = pd.to_datetime(df["observation_time_utc"]).dt.dayofweek

        preds = []
        for idx, row in df.iterrows():
            key = tuple(row[c] for c in ["segment_id", "hour_of_day", "day_of_week"] if c in df.columns)
            preds.append(self.lookup_table_.get(key, self.global_mean_))
        return np.array(preds, dtype=float)

    def evaluate(self, X_val: pd.DataFrame, y_val: pd.Series) -> Dict[str, float]:
        preds = self.predict(X_val)
        self.metrics_summary = RegressionMetrics.calculate(y_val.to_numpy(), preds)
        return self.metrics_summary


class LightGBMTrafficForecaster(SmartCityModel):
    """
    Production Model: Multi-feature LightGBM Regressor with early stopping,
    l2 regularization, and feature importance attribution.
    """

    def __init__(
        self,
        n_estimators: int = 200,
        learning_rate: float = 0.05,
        max_depth: int = 6,
        num_leaves: int = 31,
        min_child_samples: int = 20,
        feature_cols: Optional[List[str]] = None,
    ):
        super().__init__("traffic_lgbm_forecaster", version="1.0.0")
        self.params = {
            "n_estimators": n_estimators,
            "learning_rate": learning_rate,
            "max_depth": max_depth,
            "num_leaves": num_leaves,
            "min_child_samples": min_child_samples,
            "random_state": 42,
            "n_jobs": -1,
            "verbose": -1,
        }
        self.feature_cols = feature_cols
        self.model = lgb.LGBMRegressor(**self.params)
        self.feature_importances_: Dict[str, float] = {}

    def fit(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        eval_set: Optional[List[tuple]] = None,
    ) -> "LightGBMTrafficForecaster":
        features = self.feature_cols if self.feature_cols else list(X.columns)
        X_train = X[features]

        if eval_set:
            eval_data = [(eval_X[features], eval_y) for eval_X, eval_y in eval_set]
            self.model.fit(X_train, y, eval_set=eval_data)
        else:
            self.model.fit(X_train, y)

        self.feature_cols = features
        self.feature_importances_ = dict(
            zip(features, self.model.feature_importances_.astype(float))
        )
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        features = self.feature_cols if self.feature_cols else list(X.columns)
        # Ensure non-negative speed predictions
        raw_preds = self.model.predict(X[features])
        return np.clip(raw_preds, 0.0, 150.0)

    def evaluate(self, X_val: pd.DataFrame, y_val: pd.Series) -> Dict[str, float]:
        preds = self.predict(X_val)
        self.metrics_summary = RegressionMetrics.calculate(y_val.to_numpy(), preds)
        return self.metrics_summary

    def get_residuals(self, X_val: pd.DataFrame, y_val: pd.Series) -> pd.DataFrame:
        """Returns dataframe with true, predicted, and residual errors for error analysis."""
        preds = self.predict(X_val)
        res_df = X_val.copy()
        res_df["y_true"] = y_val.values
        res_df["y_pred"] = preds
        res_df["residual"] = res_df["y_true"] - res_df["y_pred"]
        res_df["abs_error"] = res_df["residual"].abs()
        return res_df


# Alias for convenience
TrafficForecaster = LightGBMTrafficForecaster
