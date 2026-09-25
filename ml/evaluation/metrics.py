"""
SmartCityAI - Model Evaluation Metrics
Computes standardized evaluation metrics for regression, classification, calibration, and clustering.
"""

from typing import Dict
import numpy as np
from sklearn.metrics import (
    brier_score_loss,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    silhouette_score,
)


class RegressionMetrics:
    """Evaluates time-series forecasting regression models."""

    @staticmethod
    def calculate(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        y_true = np.asarray(y_true, dtype=float)
        y_pred = np.asarray(y_pred, dtype=float)

        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        r2 = float(r2_score(y_true, y_pred))

        # WAPE: Weighted Absolute Percentage Error (robust to zero values)
        sum_true = np.sum(np.abs(y_true))
        wape = float(np.sum(np.abs(y_true - y_pred)) / sum_true) if sum_true > 0 else 0.0

        return {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
            "wape": round(wape, 4),
        }


class ClassificationMetrics:
    """Evaluates multi-class and imbalanced classification models with probability calibration."""

    @staticmethod
    def calculate(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: np.ndarray = None,
    ) -> Dict[str, float]:
        y_true = np.asarray(y_true, dtype=int)
        y_pred = np.asarray(y_pred, dtype=int)

        macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
        weighted_f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

        metrics = {
            "macro_f1": round(macro_f1, 4),
            "weighted_f1": round(weighted_f1, 4),
        }

        # Calculate Brier score for probability calibration if probabilities are provided
        if y_prob is not None:
            # For multi-class Brier score: mean squared difference across all one-hot classes
            n_classes = y_prob.shape[1] if len(y_prob.shape) > 1 else 2
            if n_classes == 2 and len(y_prob.shape) == 1:
                metrics["brier_score"] = round(float(brier_score_loss(y_true, y_prob)), 4)
            else:
                one_hot = np.eye(n_classes)[y_true]
                brier = np.mean(np.sum((y_prob - one_hot) ** 2, axis=1))
                metrics["brier_score"] = round(float(brier), 4)

        return metrics


class ClusteringMetrics:
    """Evaluates spatial clustering solutions."""

    @staticmethod
    def calculate(X: np.ndarray, labels: np.ndarray, metric: str = "haversine") -> Dict[str, float]:
        valid_mask = labels != -1  # Exclude noise points
        n_clusters = len(set(labels[valid_mask]))

        if n_clusters < 2:
            return {"silhouette_score": -1.0, "n_clusters": n_clusters, "noise_ratio": float((labels == -1).mean())}

        score = float(silhouette_score(X[valid_mask], labels[valid_mask], metric=metric))
        noise_ratio = float((labels == -1).mean())

        return {
            "silhouette_score": round(score, 4),
            "n_clusters": n_clusters,
            "noise_ratio": round(noise_ratio, 4),
        }
