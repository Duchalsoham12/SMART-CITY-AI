"""
SmartCityAI - Base Pipeline Framework
Provides structured logging, SHA-256 data integrity hashing, and audit metrics.
"""

import hashlib
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional
import pandas as pd


class BasePipeline:
    """Base class for all ETL and feature pipelines with structured audit logging."""

    def __init__(self, pipeline_name: str, config: Dict[str, Any]):
        self.pipeline_name = pipeline_name
        self.config = config
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        logger = logging.getLogger(self.pipeline_name)
        logger.setLevel(logging.INFO)
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '{"timestamp": "%(asctime)s", "pipeline": "%(name)s", "level": "%(levelname)s", "message": "%(message)s"}'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        return logger

    @staticmethod
    def calculate_dataframe_hash(df: pd.DataFrame) -> str:
        """Computes deterministic SHA-256 hash of a dataframe's contents."""
        serialized = pd.util.hash_pandas_object(df, index=True).values.tobytes()
        return hashlib.sha256(serialized).hexdigest()

    def log_audit_metric(
        self,
        step: str,
        input_count: int,
        output_count: int,
        quarantine_count: int,
        duration_sec: float,
        details: Optional[Dict[str, Any]] = None,
    ):
        """Emits structured audit log for observability and data provenance."""
        record = {
            "step": step,
            "input_records": input_count,
            "output_records": output_count,
            "quarantine_records": quarantine_count,
            "duration_seconds": round(duration_sec, 3),
            "details": details or {},
        }
        self.logger.info(json.dumps(record))
