"""
SmartCityAI - Data Leakage Guard
Ensures temporal separation across train/val/test splits and verifies zero forward lookahead.
"""

from typing import List, Tuple
import pandas as pd


class LeakageGuard:
    """Validates temporal partition integrity and guards against lookahead leakage."""

    @staticmethod
    def verify_temporal_splits(
        train_df: pd.DataFrame,
        val_df: pd.DataFrame,
        test_df: pd.DataFrame,
        time_col: str = "observation_time_utc",
    ) -> Tuple[bool, List[str]]:
        """
        Asserts that train, validation, and test datasets do not overlap in time.
        Condition: max(train) < min(val) and max(val) < min(test).
        """
        violations = []

        max_train = pd.to_datetime(train_df[time_col]).max()
        min_val = pd.to_datetime(val_df[time_col]).min()
        max_val = pd.to_datetime(val_df[time_col]).max()
        min_test = pd.to_datetime(test_df[time_col]).min()

        if max_train >= min_val:
            violations.append(
                f"Temporal Leakage: Train max ({max_train}) >= Validation min ({min_val})"
            )

        if max_val >= min_test:
            violations.append(
                f"Temporal Leakage: Validation max ({max_val}) >= Test min ({min_test})"
            )

        is_valid = len(violations) == 0
        return is_valid, violations

    @staticmethod
    def check_target_leakage(
        df: pd.DataFrame,
        target_col: str,
        feature_cols: List[str],
        correlation_threshold: float = 0.999,
    ) -> Tuple[bool, List[str]]:
        """
        Checks if any feature column has an exact or near-perfect correlation with target,
        which typically indicates that the target variable was accidentally included or unshifted.
        """
        violations = []
        target = df[target_col]

        for col in feature_cols:
            if col == target_col:
                violations.append(f"Direct Target Inclusion: '{col}' is present in feature list")
                continue

            if pd.api.types.is_numeric_dtype(df[col]):
                corr = df[col].corr(target)
                if abs(corr) >= correlation_threshold:
                    violations.append(
                        f"Potential Leakage: Feature '{col}' has extreme correlation ({corr:.4f}) with target"
                    )

        is_valid = len(violations) == 0
        return is_valid, violations
