"""
SmartCityAI - Custom Scikit-Learn Feature Transformers
Guarantees strict train-only parameter fitting to prevent data leakage.
"""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin


class LeakageFreeStandardScaler(BaseEstimator, TransformerMixin):
    """
    StandardScaler that records training distribution parameters (mean, std).
    Prevents leakage by refusing to update statistics during transform calls.
    """

    def __init__(self, feature_cols: List[str]):
        self.feature_cols = feature_cols
        self.means_: Dict[str, float] = {}
        self.stds_: Dict[str, float] = {}

    def fit(self, X: pd.DataFrame, y=None):
        for col in self.feature_cols:
            if col in X.columns:
                mean_val = float(X[col].mean())
                std_val = float(X[col].std())
                self.means_[col] = mean_val
                # Prevent divide-by-zero if variance is zero
                self.stds_[col] = std_val if std_val > 1e-6 else 1.0
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X_out = X.copy()
        for col in self.feature_cols:
            if col in self.means_:
                mean = self.means_[col]
                std = self.stds_[col]
                X_out[f"{col}_scaled"] = (X_out[col] - mean) / std
        return X_out


class CategoricalFrequencyEncoder(BaseEstimator, TransformerMixin):
    """
    Encodes categorical features by frequency distribution derived strictly from train split.
    Unseen categories in validation/test are mapped to 0.0 frequency.
    """

    def __init__(self, cat_cols: List[str]):
        self.cat_cols = cat_cols
        self.freq_maps_: Dict[str, Dict[str, float]] = {}

    def fit(self, X: pd.DataFrame, y=None):
        for col in self.cat_cols:
            if col in X.columns:
                freq = X[col].value_counts(normalize=True).to_dict()
                self.freq_maps_[col] = freq
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X_out = X.copy()
        for col in self.cat_cols:
            if col in self.freq_maps_:
                mapping = self.freq_maps_[col]
                X_out[f"{col}_freq"] = X_out[col].map(mapping).fillna(0.0)
        return X_out
