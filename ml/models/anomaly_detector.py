"""
SmartCityAI - Urban Anomaly Detection
Implements Statistical Rolling Z-Score Baseline and Unsupervised Isolation Forest.
"""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from ml.models.base_model import SmartCityModel


class RollingZScoreBaseline(SmartCityModel):
    """
    Baseline model: Flags observations exceeding a 3-sigma threshold from a rolling window.
    """

    def __init__(self, target_col: str = "speed_mph", threshold: float = 3.0):
        super().__init__("anomaly_rolling_zscore_baseline", version="1.0.0")
        self.target_col = target_col
        self.threshold = threshold

    def fit(self, X: pd.DataFrame, y=None) -> "RollingZScoreBaseline":
        self.is_fitted = True
        return self

    def predict_scores(self, X: pd.DataFrame) -> np.ndarray:
        values = X[self.target_col].to_numpy()
        mean = np.mean(values)
        std = np.std(values) if np.std(values) > 0 else 1.0
        z_scores = np.abs((values - mean) / std)
        return z_scores

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        scores = self.predict_scores(X)
        return (scores > self.threshold).astype(int)

    def evaluate(self, X_val: pd.DataFrame, y_val: pd.Series) -> Dict[str, float]:
        preds = self.predict(X_val)
        anomaly_ratio = float(preds.mean())
        self.metrics_summary = {"anomaly_ratio": round(anomaly_ratio, 4)}
        return self.metrics_summary


class IsolationForestAnomalyDetector(SmartCityModel):
    """
    Production Model: Unsupervised multi-sensor Isolation Forest.
    Outputs binary anomaly labels and normalized continuous anomaly scores in [0.0, 1.0].
    """

    def __init__(
        self,
        contamination: float = 0.01,
        n_estimators: int = 150,
        feature_cols: Optional[List[str]] = None,
    ):
        super().__init__("anomaly_isolation_forest", version="1.0.0")
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.feature_cols = feature_cols
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            random_state=42,
            n_jobs=-1,
        )

    def fit(self, X: pd.DataFrame, y=None) -> "IsolationForestAnomalyDetector":
        features = self.feature_cols if self.feature_cols else list(X.columns)
        self.model.fit(X[features])
        self.feature_cols = features
        self.is_fitted = True
        return self

    def predict_scores(self, X: pd.DataFrame) -> np.ndarray:
        """
        Computes continuous anomaly score normalized to [0.0, 1.0].
        Higher score = more anomalous.
        """
        features = self.feature_cols if self.feature_cols else list(X.columns)
        # IsolationForest decision_function outputs negative scores for anomalies
        raw_scores = -self.model.decision_function(X[features])
        # Min-max scale scores to [0.0, 1.0]
        min_s, max_s = raw_scores.min(), raw_scores.max()
        if max_s > min_s:
            norm_scores = (raw_scores - min_s) / (max_s - min_s)
        else:
            norm_scores = np.zeros_like(raw_scores)
        return norm_scores

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        features = self.feature_cols if self.feature_cols else list(X.columns)
        raw_preds = self.model.predict(X[features])
        # Map: -1 (anomaly) -> 1, 1 (normal) -> 0
        return np.where(raw_preds == -1, 1, 0)

    def evaluate(self, X_val: pd.DataFrame, y_val: Optional[pd.Series] = None) -> Dict[str, float]:
        preds = self.predict(X_val)
        anomaly_ratio = float(preds.mean())
        self.metrics_summary = {
            "anomaly_count": int(preds.sum()),
            "anomaly_ratio": round(anomaly_ratio, 4),
        }
        return self.metrics_summary


# Alias for convenience
UrbanAnomalyDetector = IsolationForestAnomalyDetector
