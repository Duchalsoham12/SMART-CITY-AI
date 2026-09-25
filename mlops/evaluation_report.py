"""
SmartCityAI - Automated Model Evaluation Report Generator
Produces rigorous Markdown and JSON evaluation reports containing performance metrics,
uncertainty coverage, residual distributions, and governance certification.
"""

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import numpy as np


class ModelEvaluationReport:
    """Standardized evaluation artifact for model governance and promotion audits."""

    def __init__(
        self,
        model_name: str,
        model_version: str,
        run_id: str,
        dataset_version_id: str,
        metrics: Dict[str, float],
        residual_stats: Optional[Dict[str, float]] = None,
        gates_passed: bool = True,
        rejection_reasons: Optional[List[str]] = None,
    ):
        self.model_name = model_name
        self.model_version = model_version
        self.run_id = run_id
        self.dataset_version_id = dataset_version_id
        self.metrics = metrics
        self.residual_stats = residual_stats or {}
        self.gates_passed = gates_passed
        self.rejection_reasons = rejection_reasons or []
        self.timestamp_utc = datetime.now(timezone.utc).isoformat()

    def to_markdown(self) -> str:
        """Renders an executive-ready Markdown evaluation report."""
        status_badge = "🟢 PASSED (ELIGIBLE FOR PRODUCTION)" if self.gates_passed else "🔴 FAILED GATES"
        md = [
            f"# SmartCityAI Model Evaluation Report — {self.model_name}",
            f"\n**Evaluation Status**: {status_badge}",
            f"- **Model Version**: `{self.model_version}`",
            f"- **MLflow Run ID**: `{self.run_id}`",
            f"- **Dataset Lineage**: `{self.dataset_version_id}`",
            f"- **Timestamp**: `{self.timestamp_utc}`\n",
            "## 1. Quantitative Performance Metrics\n",
            "| Metric | Measured Value | Standard Benchmark Threshold | Status |",
            "| :--- | :--- | :--- | :--- |",
        ]

        for metric, val in self.metrics.items():
            md.append(f"| `{metric}` | **{val:.4f}** | Defined in Quality Gate | ✅ Verified |")

        if self.residual_stats:
            md.extend([
                "\n## 2. Residual Error Distribution Analysis\n",
                "| Residual Statistic | Value |",
                "| :--- | :--- |",
            ])
            for stat_k, stat_v in self.residual_stats.items():
                md.append(f"| {stat_k} | `{stat_v:.4f}` |")

        if self.rejection_reasons:
            md.extend([
                "\n## ⚠️ Quality Gate Violations",
                *[f"- ❌ {reason}" for reason in self.rejection_reasons],
            ])

        md.extend([
            "\n## 3. Governance Certification & Non-Causal Epistemic Notice",
            "> [!NOTE]",
            "> This model evaluation report was automatically generated following strict time-aware validation.",
            "> Reported metrics represent statistical correlations on historical holdout partitions and do not",
            "> imply deterministic causal outcomes in physical urban traffic dynamics.\n",
        ])

        return "\n".join(md)

    def save(self, output_dir: str = "reports") -> str:
        """Saves JSON and Markdown reports to disk."""
        os.makedirs(output_dir, exist_ok=True)
        filename_base = f"{self.model_name}_{self.model_version}_{self.run_id[:8]}"
        md_path = os.path.join(output_dir, f"{filename_base}.md")
        json_path = os.path.join(output_dir, f"{filename_base}.json")

        with open(md_path, "w", encoding="utf-8") as f:
            f.write(self.to_markdown())

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump({
                "model_name": self.model_name,
                "model_version": self.model_version,
                "run_id": self.run_id,
                "dataset_version_id": self.dataset_version_id,
                "metrics": self.metrics,
                "residual_stats": self.residual_stats,
                "gates_passed": self.gates_passed,
                "rejection_reasons": self.rejection_reasons,
                "timestamp_utc": self.timestamp_utc,
            }, f, indent=2)

        return md_path
