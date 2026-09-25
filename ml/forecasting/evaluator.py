"""
SmartCityAI - Forecasting Benchmark Evaluator
Compares Naive, Seasonal Moving Average, Ridge, and Quantile LightGBM models
across MAE, RMSE, WAPE, SMAPE, and R2 metrics.
"""

from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from ml.forecasting.quantile_forecaster import QuantileLightGBMForecaster


class ForecastingBenchmarkEvaluator:
    """Orchestrates comparative benchmarking across baseline and production models."""

    @staticmethod
    def calculate_smape(y_true: np.ndarray, y_pred: np.ndarray, eps: float = 1e-5) -> float:
        """Symmetric Mean Absolute Percentage Error bounded in [0%, 200%]."""
        y_true = np.asarray(y_true, dtype=float)
        y_pred = np.asarray(y_pred, dtype=float)
        denom = np.abs(y_true) + np.abs(y_pred) + eps
        return float(np.mean(2.0 * np.abs(y_true - y_pred) / denom) * 100.0)

    @staticmethod
    def calculate_wape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Weighted Absolute Percentage Error (robust to near-zero values)."""
        y_true = np.asarray(y_true, dtype=float)
        y_pred = np.asarray(y_pred, dtype=float)
        sum_true = np.sum(np.abs(y_true))
        return float(np.sum(np.abs(y_true - y_pred)) / sum_true) if sum_true > 0 else 0.0

    @classmethod
    def evaluate_model_suite(
        cls,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_test: pd.DataFrame,
        y_test: pd.Series,
        lag_1h_col: str = "speed_lag_1h",
    ) -> pd.DataFrame:
        """
        Fits and benchmarks:
        1. Naive Persistence Baseline
        2. Seasonal Moving Average Baseline
        3. Regularized Ridge Regression
        4. Quantile LightGBM Regressor
        """
        results = []
        y_test_arr = y_test.to_numpy()

        # 1. Naive Persistence Baseline: y_hat(t+1) = y(t)
        if lag_1h_col in X_test.columns:
            naive_preds = X_test[lag_1h_col].to_numpy()
        else:
            naive_preds = np.full(len(y_test), y_train.iloc[-1])

        results.append(
            cls._score_model("1. Naive Persistence", y_test_arr, naive_preds)
        )

        # 2. Historical Seasonal Moving Average Baseline
        group_cols = [c for c in ["hour_of_day", "day_of_week"] if c in X_train.columns]
        if group_cols:
            train_merged = X_train.copy()
            train_merged["_target"] = y_train.values
            lookup = train_merged.groupby(group_cols)["_target"].mean().to_dict()
            global_mean = y_train.mean()
            ma_preds = [
                lookup.get(tuple(row[c] for c in group_cols), global_mean)
                for _, row in X_test.iterrows()
            ]
            ma_preds = np.array(ma_preds)
        else:
            ma_preds = np.full(len(y_test), y_train.mean())

        results.append(
            cls._score_model("2. Seasonal Moving Average", y_test_arr, ma_preds)
        )

        # 3. Regularized Ridge Regression
        num_cols = X_train.select_dtypes(include=[np.number]).columns
        ridge = Ridge(alpha=1.0)
        ridge.fit(X_train[num_cols].fillna(0.0), y_train)
        ridge_preds = np.clip(ridge.predict(X_test[num_cols].fillna(0.0)), 0.0, None)
        results.append(
            cls._score_model("3. Regularized Ridge Regression", y_test_arr, ridge_preds)
        )

        # 4. Quantile LightGBM Regressor
        qlgbm = QuantileLightGBMForecaster(n_estimators=100, max_depth=6)
        qlgbm.fit(X_train[num_cols].fillna(0.0), y_train)
        qlgbm_df = qlgbm.predict(X_test[num_cols].fillna(0.0))
        qlgbm_preds = qlgbm_df["point_forecast"].to_numpy()

        lgbm_metrics = cls._score_model("4. Quantile LightGBM (Production)", y_test_arr, qlgbm_preds)
        # Add Prediction Interval Coverage Probability (PICP) for LightGBM
        picp = float(np.mean((y_test_arr >= qlgbm_df["q_05"]) & (y_test_arr <= qlgbm_df["q_95"])))
        lgbm_metrics["picp_90"] = f"{picp:.2%}"
        results.append(lgbm_metrics)

        leaderboard = pd.DataFrame(results)
        return leaderboard

    @classmethod
    def _score_model(cls, model_name: str, y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
        mae = float(np.mean(np.abs(y_true - y_pred)))
        rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
        wape = cls.calculate_wape(y_true, y_pred)
        smape = cls.calculate_smape(y_true, y_pred)

        # R2 score calculation
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        r2 = float(1.0 - (ss_res / ss_tot)) if ss_tot > 0 else 0.0

        return {
            "model": model_name,
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "wape": f"{wape:.2%}",
            "smape": f"{smape:.2f}%",
            "r2": round(r2, 3),
            "picp_90": "N/A",
        }
