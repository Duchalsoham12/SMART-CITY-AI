"""
SmartCityAI - Base Model Abstract Class
Enforces standard fit, predict, evaluate, and serialize lifecycle.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import joblib
import numpy as np
import pandas as pd


class SmartCityModel(ABC):
    """Abstract base class for all SmartCityAI predictive and clustering models."""

    def __init__(self, model_name: str, version: str = "1.0.0"):
        self.model_name = model_name
        self.version = version
        self.is_fitted = False
        self.metrics_summary: Dict[str, float] = {}

    @abstractmethod
    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None) -> "SmartCityModel":
        """Fits the model to training data."""
        pass

    @abstractmethod
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Generates predictions."""
        pass

    @abstractmethod
    def evaluate(self, X_val: pd.DataFrame, y_val: pd.Series) -> Dict[str, float]:
        """Evaluates model against ground truth."""
        pass

    def save(self, filepath: str):
        """Serializes model binary using joblib."""
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: str) -> "SmartCityModel":
        """Deserializes model binary."""
        return joblib.load(filepath)
