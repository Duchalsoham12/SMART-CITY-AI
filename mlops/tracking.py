"""
SmartCityAI - MLflow Experiment Tracking Integration
Provides an enterprise wrapper around MLflow for experiment tracking,
hyperparameter logging, metric trajectories, and evaluation artifact storage.
"""

import os
from contextlib import contextmanager
from typing import Any, Dict, Generator, Optional
import mlflow


class MLflowTracker:
    """Manages MLflow experiment runs and artifact logging."""

    def __init__(
        self,
        experiment_name: str = "SmartCityAI-Urban-Intelligence",
        tracking_uri: Optional[str] = None,
    ):
        self.experiment_name = experiment_name
        self.tracking_uri = tracking_uri or os.getenv("MLFLOW_TRACKING_URI", "sqlite:///mlruns.db")
        mlflow.set_tracking_uri(self.tracking_uri)
        mlflow.set_experiment(self.experiment_name)

    @contextmanager
    def start_run(
        self,
        run_name: str,
        tags: Optional[Dict[str, str]] = None,
    ) -> Generator[mlflow.ActiveRun, None, None]:
        """Context manager for structured MLflow training runs."""
        default_tags = {
            "platform": "SmartCityAI",
            "environment": os.getenv("ENVIRONMENT", "production"),
        }
        if tags:
            default_tags.update(tags)

        with mlflow.start_run(run_name=run_name, tags=default_tags) as active_run:
            yield active_run

    @staticmethod
    def log_params(params: Dict[str, Any]) -> None:
        """Logs hyperparameters, dataset fingerprints, and runtime configs."""
        sanitized = {k: v if isinstance(v, (int, float, str, bool)) else str(v) for k, v in params.items()}
        mlflow.log_params(sanitized)

    @staticmethod
    def log_metrics(metrics: Dict[str, float], step: Optional[int] = None) -> None:
        """Logs validation and evaluation metrics."""
        for k, v in metrics.items():
            if isinstance(v, (int, float)):
                mlflow.log_metric(k, float(v), step=step)

    @staticmethod
    def log_artifact(local_path: str, artifact_path: Optional[str] = None) -> None:
        """Stores reports, plots, or serializations into MLflow artifact repository."""
        if os.path.exists(local_path):
            mlflow.log_artifact(local_path, artifact_path=artifact_path)

    @staticmethod
    def set_tags(tags: Dict[str, str]) -> None:
        """Applies governance tags to active run."""
        mlflow.set_tags(tags)
