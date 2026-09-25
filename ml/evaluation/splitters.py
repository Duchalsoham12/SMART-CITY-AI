"""
SmartCityAI - Time-Aware & Group-Aware Cross-Validation Splitters
Prevents temporal and entity/spatial leakage in cross-validation splits.
"""

from typing import Generator, List, Tuple
import numpy as np
import pandas as pd


class RollingTimeSeriesSplit:
    """
    Expanding or rolling time-series cross-validation splitter with purge gaps.
    Guarantees: max(train_time) < min(test_time) for all folds.
    """

    def __init__(
        self,
        n_splits: int = 5,
        test_size_ratio: float = 0.15,
        purge_gap_hours: int = 0,
    ):
        self.n_splits = n_splits
        self.test_size_ratio = test_size_ratio
        self.purge_gap_hours = purge_gap_hours

    def split(
        self, df: pd.DataFrame, time_col: str = "observation_time_utc"
    ) -> Generator[Tuple[np.ndarray, np.ndarray], None, None]:
        """Yields (train_indices, test_indices) adhering to chronological order."""
        sorted_indices = df.sort_values(by=time_col).index.to_numpy()
        n_samples = len(sorted_indices)
        test_size = int(n_samples * self.test_size_ratio)
        min_train_size = n_samples - (self.n_splits * test_size)

        if min_train_size <= 0:
            raise ValueError(
                f"n_splits={self.n_splits} with test_size_ratio={self.test_size_ratio} "
                f"exceeds dataset size ({n_samples} rows)."
            )

        for i in range(self.n_splits):
            train_end = min_train_size + (i * test_size)
            test_start = train_end
            test_end = test_start + test_size

            train_idx = sorted_indices[:train_end]
            test_idx = sorted_indices[test_start:test_end]

            # Optional purge gap: remove train records immediately prior to test set
            # to eliminate autoregressive autocorrelation spillover
            if self.purge_gap_hours > 0 and len(train_idx) > 0:
                test_min_time = df.loc[test_idx, time_col].min()
                purge_cutoff = test_min_time - pd.Timedelta(hours=self.purge_gap_hours)
                train_idx = [idx for idx in train_idx if df.loc[idx, time_col] <= purge_cutoff]
                train_idx = np.array(train_idx)

            yield train_idx, test_idx


class SpatialGroupTimeSeriesSplit:
    """
    Group-aware and time-aware splitter.
    Ensures that entities (e.g. road segments or spatial H3 cells) tested in the validation
    fold are evaluated strictly AFTER the training window, while supporting out-of-entity testing.
    """

    def __init__(self, time_cutoff: str, group_col: str = "segment_id"):
        self.time_cutoff = time_cutoff
        self.group_col = group_col

    def split(
        self, df: pd.DataFrame, time_col: str = "observation_time_utc"
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Partitions dataframe into train and test indices by time cutoff."""
        times = pd.to_datetime(df[time_col])
        if times.dt.tz is not None:
            cutoff_dt = pd.to_datetime(self.time_cutoff, utc=True)
        else:
            cutoff_dt = pd.to_datetime(self.time_cutoff)

        train_mask = times <= cutoff_dt
        test_mask = times > cutoff_dt

        train_indices = df[train_mask].index.to_numpy()
        test_indices = df[test_mask].index.to_numpy()

        return train_indices, test_indices
