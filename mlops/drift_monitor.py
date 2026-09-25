"""
SmartCityAI - Data Drift Monitoring Engine
Continuously tracks feature distribution shifts using Population Stability Index (PSI)
and Kolmogorov-Smirnov statistical tests. Automatically flags retrain triggers.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from scipy import stats


class FeatureDriftReport:
    """Detailed summary of covariate drift across model input features."""

    def __init__(
        self,
        overall_status: str,
        max_psi: float,
        feature_scores: Dict[str, Dict[str, Any]],
        drifted_features: List[str],
        retrain_recommended: bool,
    ):
        self.overall_status = overall_status
        self.max_psi = max_psi
        self.feature_scores = feature_scores
        self.drifted_features = drifted_features
        self.retrain_recommended = retrain_recommended

    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall_status": self.overall_status,
            "max_psi": round(self.max_psi, 4),
            "drifted_features": self.drifted_features,
            "retrain_recommended": self.retrain_recommended,
            "feature_scores": self.feature_scores,
        }


class DriftMonitor:
    """Monitors telemetry distribution shifts between reference baseline and production windows."""

    def __init__(
        self,
        alert_psi_threshold: float = 0.10,
        critical_psi_threshold: float = 0.25,
        num_buckets: int = 10,
    ):
        self.alert_psi_threshold = alert_psi_threshold
        self.critical_psi_threshold = critical_psi_threshold
        self.num_buckets = num_buckets

    def calculate_psi(self, reference: np.ndarray, target: np.ndarray) -> float:
        """Computes Population Stability Index (PSI) with Laplace smoothing."""
        ref = reference[~np.isnan(reference)]
        tgt = target[~np.isnan(target)]

        if len(ref) < 10 or len(tgt) < 10:
            return 0.0

        percentiles = np.linspace(0, 100, self.num_buckets + 1)
        bucket_edges = np.percentile(ref, percentiles)
        bucket_edges[0] -= 1e-5
        bucket_edges[-1] += 1e-5

        # Handle degenerate/constant distributions
        if len(np.unique(bucket_edges)) < len(bucket_edges):
            bucket_edges = np.linspace(min(ref.min(), tgt.min()) - 1e-5, max(ref.max(), tgt.max()) + 1e-5, self.num_buckets + 1)

        ref_counts, _ = np.histogram(ref, bins=bucket_edges)
        tgt_counts, _ = np.histogram(tgt, bins=bucket_edges)

        ref_pct = (ref_counts + 1e-4) / (len(ref) + 1e-4 * self.num_buckets)
        tgt_pct = (tgt_counts + 1e-4) / (len(tgt) + 1e-4 * self.num_buckets)

        psi = np.sum((tgt_pct - ref_pct) * np.log(tgt_pct / ref_pct))
        return float(max(0.0, psi))

    def evaluate_drift(
        self,
        reference_df: pd.DataFrame,
        current_df: pd.DataFrame,
        features: Optional[List[str]] = None,
    ) -> FeatureDriftReport:
        """Audits all designated features for distribution shift."""
        check_features = features or [c for c in reference_df.columns if np.issubdtype(reference_df[c].dtype, np.number)]
        feature_scores = {}
        drifted_features = []
        max_psi = 0.0

        for col in check_features:
            if col not in current_df.columns:
                continue

            ref_vals = reference_df[col].dropna().to_numpy()
            cur_vals = current_df[col].dropna().to_numpy()

            if len(ref_vals) == 0 or len(cur_vals) == 0:
                continue

            psi_val = self.calculate_psi(ref_vals, cur_vals)
            ks_stat, ks_pval = stats.ks_2samp(ref_vals, cur_vals)

            max_psi = max(max_psi, psi_val)

            status = "STABLE"
            if psi_val >= self.critical_psi_threshold:
                status = "CRITICAL_DRIFT"
                drifted_features.append(col)
            elif psi_val >= self.alert_psi_threshold:
                status = "DRIFT_WARNING"
                drifted_features.append(col)

            feature_scores[col] = {
                "psi": round(psi_val, 4),
                "ks_statistic": round(float(ks_stat), 4),
                "ks_pvalue": round(float(ks_pval), 6),
                "status": status,
            }

        overall_status = "STABLE"
        if max_psi >= self.critical_psi_threshold:
            overall_status = "CRITICAL_DRIFT"
        elif max_psi >= self.alert_psi_threshold:
            overall_status = "DRIFT_WARNING"

        return FeatureDriftReport(
            overall_status=overall_status,
            max_psi=max_psi,
            feature_scores=feature_scores,
            drifted_features=drifted_features,
            retrain_recommended=(max_psi >= self.critical_psi_threshold),
        )
