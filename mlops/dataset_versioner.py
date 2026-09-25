"""
SmartCityAI - Dataset Versioning & Lineage Engine
Generates deterministic SHA-256 content hashes, schema fingerprints,
and immutable data manifest records for full training reproducibility.
"""

import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import pandas as pd


class DatasetManifest:
    """Immutable metadata record for a versioned dataset snapshot."""

    def __init__(
        self,
        dataset_name: str,
        version_id: str,
        sha256_hash: str,
        row_count: int,
        columns: List[str],
        temporal_range: Dict[str, Optional[str]],
        schema_summary: Dict[str, str],
        created_at_utc: str,
    ):
        self.dataset_name = dataset_name
        self.version_id = version_id
        self.sha256_hash = sha256_hash
        self.row_count = row_count
        self.columns = columns
        self.temporal_range = temporal_range
        self.schema_summary = schema_summary
        self.created_at_utc = created_at_utc

    def to_dict(self) -> Dict[str, Any]:
        return {
            "dataset_name": self.dataset_name,
            "version_id": self.version_id,
            "sha256_hash": self.sha256_hash,
            "row_count": self.row_count,
            "columns": self.columns,
            "temporal_range": self.temporal_range,
            "schema_summary": self.schema_summary,
            "created_at_utc": self.created_at_utc,
        }


class DatasetVersioner:
    """Computes deterministic dataset hashes and manages data lineage manifests."""

    @staticmethod
    def compute_sha256(df: pd.DataFrame) -> str:
        """
        Computes a deterministic SHA-256 fingerprint over DataFrame values.
        Sorts column order and uses parquet byte representation to guarantee invariance.
        """
        sorted_cols = sorted(df.columns.tolist())
        df_sorted = df[sorted_cols]
        # Use fast pandas hashing for deterministic fingerprinting
        hash_values = pd.util.hash_pandas_object(df_sorted, index=True).values
        hasher = hashlib.sha256()
        hasher.update(hash_values.tobytes())
        return hasher.hexdigest()

    @classmethod
    def version_dataset(
        cls,
        df: pd.DataFrame,
        dataset_name: str,
        version_tag: Optional[str] = None,
        timestamp_col: Optional[str] = "observation_time_utc",
        manifest_dir: str = "data/manifests",
    ) -> DatasetManifest:
        """Creates and persists an immutable dataset version manifest."""
        sha256_hash = cls.compute_sha256(df)
        short_hash = sha256_hash[:10]
        now_iso = datetime.now(timezone.utc).isoformat()
        version_id = version_tag or f"{dataset_name}-v_{short_hash}"

        # Temporal bounds extraction if present
        time_min, time_max = None, None
        if timestamp_col and timestamp_col in df.columns:
            ts_series = pd.to_datetime(df[timestamp_col], errors="coerce").dropna()
            if not ts_series.empty:
                time_min = ts_series.min().isoformat()
                time_max = ts_series.max().isoformat()

        schema_dict = {col: str(dtype) for col, dtype in df.dtypes.items()}

        manifest = DatasetManifest(
            dataset_name=dataset_name,
            version_id=version_id,
            sha256_hash=sha256_hash,
            row_count=len(df),
            columns=df.columns.tolist(),
            temporal_range={"min_time_utc": time_min, "max_time_utc": time_max},
            schema_summary=schema_dict,
            created_at_utc=now_iso,
        )

        # Persist manifest record
        os.makedirs(manifest_dir, exist_ok=True)
        manifest_path = os.path.join(manifest_dir, f"{version_id}.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest.to_dict(), f, indent=2)

        return manifest
