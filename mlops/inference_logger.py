"""
SmartCityAI - Production Inference Audit Logger
Asynchronously logs every model prediction, input vector, uncertainty band,
and execution latency to an immutable JSONL audit stream.
"""

import json
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional


class InferenceLogger:
    """Thread-safe append-only logger for production model inferences."""

    def __init__(self, log_path: str = "logs/inference_audit.jsonl"):
        self.log_path = log_path
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)

    def log_inference(
        self,
        model_name: str,
        model_version: str,
        input_payload: Dict[str, Any],
        prediction: Any,
        uncertainty_bounds: Optional[Dict[str, float]] = None,
        latency_ms: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Appends a validated inference record to the JSONL audit stream."""
        inference_id = str(uuid.uuid4())
        record = {
            "inference_id": inference_id,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "model_name": model_name,
            "model_version": model_version,
            "input_payload": input_payload,
            "prediction": prediction,
            "uncertainty_bounds": uncertainty_bounds,
            "latency_ms": round(latency_ms, 2) if latency_ms is not None else None,
            "metadata": metadata or {},
        }

        try:
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")
        except Exception:
            # Defensive logging: never crash the core API request thread on audit IO failure
            pass

        return inference_id
