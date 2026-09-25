"""
SmartCityAI - Causal Guard & Epistemic Verification
Guards explanation outputs against false causal claims.
Enforces strict distinction between statistical feature importance, correlation, and causality.
"""

import re
from typing import List, Tuple

FORBIDDEN_CAUSAL_PATTERNS = [
    (r"\bcauses\b", "is statistically associated with"),
    (r"\bcaused by\b", "observed in conjunction with"),
    (r"\bleads to\b", "is correlated with higher incidence of"),
    (r"\bled to\b", "co-occurred with"),
    (r"\bproves that\b", "indicates that within model features"),
    (r"\bproves causation\b", "demonstrates statistical correlation"),
    (r"\bthe reason for the crash is\b", "a key predictive factor identified by the model is"),
    (r"\bbecause of\b", "associated with"),
]

MANDATORY_CAUSAL_DISCLAIMER = (
    "DISCLAIMER: This explanation reflects feature importance within the predictive model "
    "based on historical correlations. It does NOT establish physical causation. "
    "Interventions should be corroborated with domain engineering and on-site inspection."
)


class CausalGuard:
    """Enforces non-causal epistemic language across model explanation payloads."""

    @classmethod
    def sanitize_explanation_text(cls, text: str) -> Tuple[str, bool]:
        """
        Scans explanation text for prohibited causal language and sanitizes it.
        Returns:
            sanitized_text: String with non-causal replacements.
            was_modified: True if causal claims were detected and rewritten.
        """
        was_modified = False
        sanitized = text

        for pattern, replacement in FORBIDDEN_CAUSAL_PATTERNS:
            if re.search(pattern, sanitized, flags=re.IGNORECASE):
                was_modified = True
                sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

        return sanitized, was_modified

    @classmethod
    def append_epistemic_disclaimer(cls, explanation_dict: dict) -> dict:
        """Appends official regulatory/epistemic disclaimer to explanation payloads."""
        explanation_dict["epistemic_notice"] = {
            "prediction_type": "STATISTICAL_CORRELATION",
            "is_causal_claim": False,
            "disclaimer": MANDATORY_CAUSAL_DISCLAIMER,
            "conceptual_distinction": {
                "prediction": "Statistical expectation of the target given observed features.",
                "correlation": "Observed co-variation between variables in historical data.",
                "feature_importance": "Relative contribution of a feature to the model's loss reduction or decision path.",
                "causal_inference": "Counterfactual impact of physical intervention, which cannot be proven by this predictive model.",
            },
        }
        return explanation_dict
