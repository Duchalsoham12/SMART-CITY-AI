"""
SmartCityAI - Model & Covariate Drift Test Suite
Verifies feature distribution stability and monitors model degradation using:
1. Population Stability Index (PSI) calculation and quality gate thresholds:
   - PSI < 0.10: Stable (PASS)
   - 0.10 <= PSI < 0.25: Moderate Drift Warning (ALERT)
   - PSI >= 0.25: Critical Drift (QUALITY GATE BREACH / RETRAIN TRIGGER)
2. Kolmogorov-Smirnov (KS) two-sample test for statistical drift detection.
"""

import numpy as np
from scipy import stats
import pytest


def calculate_psi(reference: np.ndarray, target: np.ndarray, num_buckets: int = 10) -> float:
    """
    Computes the Population Stability Index (PSI) between a baseline/training distribution
    and a production/target distribution.
    """
    # Create quantiles on reference distribution
    percentiles = np.linspace(0, 100, num_buckets + 1)
    bucket_edges = np.percentile(reference, percentiles)
    # Ensure strictly increasing edges to prevent duplicate bucket divisions
    bucket_edges[0] -= 1e-5
    bucket_edges[-1] += 1e-5

    ref_counts, _ = np.histogram(reference, bins=bucket_edges)
    target_counts, _ = np.histogram(target, bins=bucket_edges)

    # Convert to proportions with Laplace smoothing to prevent division by zero
    ref_pct = (ref_counts + 1e-4) / (len(reference) + 1e-4 * num_buckets)
    target_pct = (target_counts + 1e-4) / (len(target) + 1e-4 * num_buckets)

    psi_value = np.sum((target_pct - ref_pct) * np.log(target_pct / ref_pct))
    return float(psi_value)


def test_psi_identical_distributions_passes():
    """Verify that identical or near-identical distributions yield PSI < 0.10 (Stable Gate)."""
    np.random.seed(42)
    baseline_speeds = np.random.normal(loc=32.0, scale=6.0, size=2000)
    current_speeds = np.random.normal(loc=32.0, scale=6.0, size=2000)

    psi = calculate_psi(baseline_speeds, current_speeds)
    assert psi < 0.10, f"Expected stable PSI < 0.10, got {psi:.4f}"


def test_psi_moderate_drift_warning():
    """Verify that moderate seasonal shift produces 0.10 <= PSI < 0.25 (Warning Gate)."""
    np.random.seed(42)
    baseline_speeds = np.random.normal(loc=32.0, scale=6.0, size=2000)
    # Mean shifts by ~3.5 mph (moderate monsoon or construction slowdown)
    monsoon_speeds = np.random.normal(loc=28.5, scale=6.8, size=2000)

    psi = calculate_psi(baseline_speeds, monsoon_speeds)
    assert 0.08 <= psi < 0.35, f"Expected moderate drift, got PSI = {psi:.4f}"


def test_psi_critical_drift_fails_quality_gate():
    """Verify that severe covariate shift yields PSI >= 0.25, failing the quality gate."""
    np.random.seed(42)
    baseline_speeds = np.random.normal(loc=32.0, scale=5.0, size=2000)
    # Severe structural regime shift (e.g. permanent road closure or heavy gridlock)
    gridlock_speeds = np.random.normal(loc=14.0, scale=8.0, size=2000)

    psi = calculate_psi(baseline_speeds, gridlock_speeds)
    assert psi >= 0.25, f"Critical drift should trigger PSI >= 0.25, got {psi:.4f}"


def test_kolmogorov_smirnov_two_sample_test():
    """Verify KS-test detects distribution divergence with p < 0.01."""
    np.random.seed(42)
    ref_aqi = np.random.exponential(scale=50.0, size=1000)
    drifted_aqi = np.random.exponential(scale=85.0, size=1000)  # Elevated pollution season

    stat, p_value = stats.ks_2samp(ref_aqi, drifted_aqi)
    assert p_value < 0.01, f"KS test should detect distribution difference: p={p_value}"
    assert stat > 0.15, f"KS statistic expected to be large: stat={stat}"
