"""
SmartCityAI - Accident Severity & Safety Risk Classifier
Implements Prior Probability Baseline and Production Cost-Sensitive XGBoost Classifier.
"""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from sklearn.utils.class_weight import compute_sample_weight
import xgboost as xgb
from ml.evaluation.metrics import ClassificationMetrics
from ml.models.base_model import SmartCityModel


class PriorProbabilityBaseline(SmartCityModel):
    """
    Baseline model: Predicts empirical prior class probabilities from the training set.
    """

    def __init__(self):
        super().__init__("accident_prior_probability_baseline", version="1.0.0")
        self.priors_: np.ndarray = np.array([0.85, 0.11, 0.04])
        self.classes_: np.ndarray = np.array([0, 1, 2])

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "PriorProbabilityBaseline":
        counts = y.value_counts(normalize=True).sort_index()
        self.classes_ = counts.index.to_numpy()
        self.priors_ = counts.to_numpy()
        self.is_fitted = True
        return self

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        n_samples = len(X)
        return np.tile(self.priors_, (n_samples, 1))

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        most_frequent_class = self.classes_[np.argmax(self.priors_)]
        return np.full(len(X), most_frequent_class, dtype=int)

    def evaluate(self, X_val: pd.DataFrame, y_val: pd.Series) -> Dict[str, float]:
        preds = self.predict(X_val)
        probs = self.predict_proba(X_val)
        self.metrics_summary = ClassificationMetrics.calculate(y_val.to_numpy(), preds, probs)
        return self.metrics_summary


class XGBoostAccidentRiskClassifier(SmartCityModel):
    """
    Production Model: Cost-sensitive XGBoost multi-class classifier.
    Computes calibrated continuous risk scores: R = sum(w_c * P(C=c)).
    """

    def __init__(
        self,
        n_estimators: int = 150,
        max_depth: int = 5,
        learning_rate: float = 0.05,
        subsample: float = 0.8,
        colsample_bytree: float = 0.8,
        feature_cols: Optional[List[str]] = None,
        severity_weights: Optional[List[float]] = None,
    ):
        super().__init__("accident_xgboost_classifier", version="1.0.0")
        self.params = {
            "n_estimators": n_estimators,
            "max_depth": max_depth,
            "learning_rate": learning_rate,
            "subsample": subsample,
            "colsample_bytree": colsample_bytree,
            "objective": "multi:softprob",
            "eval_metric": "mlogloss",
            "random_state": 42,
            "n_jobs": -1,
        }
        self.feature_cols = feature_cols
        # Societal impact weights for Tier 0 (damage), Tier 1 (injury), Tier 2 (fatal/incapacitating)
        self.severity_weights = severity_weights or [0.1, 0.4, 1.0]
        self.model = xgb.XGBClassifier(**self.params)
        self.feature_importances_: Dict[str, float] = {}

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "XGBoostAccidentRiskClassifier":
        features = self.feature_cols if self.feature_cols else list(X.columns)
        X_train = X[features]

        # Compute sample weights to balance severe accident class (< 5% prevalence)
        sample_weights = compute_sample_weight(class_weight="balanced", y=y)

        self.model.fit(X_train, y, sample_weight=sample_weights)
        self.feature_cols = features
        self.feature_importances_ = dict(
            zip(features, self.model.feature_importances_.astype(float))
        )
        self.is_fitted = True
        return self

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        features = self.feature_cols if self.feature_cols else list(X.columns)
        return self.model.predict_proba(X[features])

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        features = self.feature_cols if self.feature_cols else list(X.columns)
        return self.model.predict(X[features])

    def compute_risk_score(self, X: pd.DataFrame) -> np.ndarray:
        """
        Computes continuous calibrated safety risk score: R in [0.0, 1.0].
        R = sum(w_c * P(C = c)) / sum(w_c)
        """
        probs = self.predict_proba(X)
        weights = np.array(self.severity_weights)
        risk = np.dot(probs, weights) / np.sum(weights)
        return np.clip(risk, 0.0, 1.0)

    def evaluate(self, X_val: pd.DataFrame, y_val: pd.Series) -> Dict[str, float]:
        preds = self.predict(X_val)
        probs = self.predict_proba(X_val)
        self.metrics_summary = ClassificationMetrics.calculate(y_val.to_numpy(), preds, probs)
        return self.metrics_summary


# Alias for convenience
AccidentRiskClassifier = XGBoostAccidentRiskClassifier
