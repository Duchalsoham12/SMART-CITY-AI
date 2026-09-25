"""
SmartCityAI - Pre-flight Validation Gate
Executes strict pre-training dataset quality checks.
Blocks training if data quality constraints or leakage conditions fail.
"""

from typing import Dict, List, Tuple
import pandas as pd
from schemas.feature_schemas import FeatureValidationReport
from validation.leakage_guard import LeakageGuard


class PreflightGate:
    """Pre-training validation gatekeeper."""

    def __init__(
        self,
        max_feature_null_ratio: float = 0.05,
        max_target_null_ratio: float = 0.00,
        min_required_records: int = 50,
    ):
        self.max_feature_null_ratio = max_feature_null_ratio
        self.max_target_null_ratio = max_target_null_ratio
        self.min_required_records = min_required_records

    def evaluate_dataset(
        self,
        dataset_name: str,
        train_df: pd.DataFrame,
        val_df: pd.DataFrame,
        test_df: pd.DataFrame,
        target_col: str,
        feature_cols: List[str],
        time_col: str = "observation_time_utc",
    ) -> FeatureValidationReport:
        """Runs pre-flight suite and produces an actionable compliance report."""
        rejection_reasons = []

        combined_df = pd.concat([train_df, val_df, test_df], ignore_index=True)
        total_records = len(combined_df)
        total_features = len(feature_cols)

        # 1. Minimum Sample Size Check
        if len(train_df) < self.min_required_records:
            rejection_reasons.append(
                f"Insufficient Training Data: train count ({len(train_df)}) < minimum ({self.min_required_records})"
            )

        # 2. Null Fraction Checks on Features
        null_fractions: Dict[str, float] = {}
        for col in feature_cols:
            if col not in combined_df.columns:
                rejection_reasons.append(f"Missing Expected Feature Column: '{col}'")
                null_fractions[col] = 1.0
                continue
            ratio = float(combined_df[col].isna().mean())
            null_fractions[col] = round(ratio, 4)
            if ratio > self.max_feature_null_ratio:
                rejection_reasons.append(
                    f"Feature Null Ratio Exceeded: '{col}' has {ratio:.2%} nulls (max allowed: {self.max_feature_null_ratio:.2%})"
                )

        # 3. Target Variable Null Check (Strict 0.00% allowed)
        target_nulls = int(combined_df[target_col].isna().sum()) if target_col in combined_df.columns else total_records
        if target_nulls > 0:
            rejection_reasons.append(
                f"Target Null Violations: Target '{target_col}' contains {target_nulls} null values (zero tolerance)"
            )

        # 4. Temporal Leakage Separation Check
        is_temporal_valid, temporal_violations = LeakageGuard.verify_temporal_splits(
            train_df, val_df, test_df, time_col=time_col
        )
        if not is_temporal_valid:
            rejection_reasons.extend(temporal_violations)

        # 5. Direct Target Inclusion Check
        is_feature_clean, target_leak_violations = LeakageGuard.check_target_leakage(
            combined_df, target_col, feature_cols
        )
        if not is_feature_clean:
            rejection_reasons.extend(target_leak_violations)

        is_approved = len(rejection_reasons) == 0

        return FeatureValidationReport(
            dataset_name=dataset_name,
            total_records=total_records,
            total_features=total_features,
            train_record_count=len(train_df),
            val_record_count=len(val_df),
            test_record_count=len(test_df),
            feature_null_fractions=null_fractions,
            target_null_count=target_nulls,
            is_leakage_detected=not (is_temporal_valid and is_feature_clean),
            is_approved_for_training=is_approved,
            rejection_reasons=rejection_reasons,
        )
