"""
SmartCityAI - Explainability Engine
Generates technical SHAP attributions and non-technical domain narratives for any prediction.
Enforces non-causal language and additive Shapley properties.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from ml.xai.causal_guard import CausalGuard, MANDATORY_CAUSAL_DISCLAIMER
from ml.xai.schemas import (
    ExplainablePredictionResponse,
    FeatureAttribution,
    TechnicalExplanation,
    NonTechnicalExplanation,
    EpistemicNotice,
)


class ExplainabilityEngine:
    """
    Orchestrates local attribution computation, dual explanation synthesis,
    and causal boundary verification.
    """

    def __init__(self, feature_descriptions: Optional[Dict[str, str]] = None):
        self.feature_descriptions = feature_descriptions or {
            "speed_lag_1h": "Vehicular speed observed in the previous hour",
            "speed_rolling_mean_3h": "3-hour rolling average speed",
            "precipitation_mm": "Rainfall volume over the interval",
            "temperature_celsius": "Ambient surface temperature",
            "is_weekend": "Weekend indicator",
            "posted_speed_limit": "Legal posted speed limit",
            "hour_of_day": "Diurnal hour timestamp",
        }

    def explain_prediction(
        self,
        entity_id: str,
        target_variable: str,
        predicted_value: float,
        feature_values: Dict[str, Any],
        base_value: float,
        shap_values: Dict[str, float],
        confidence_or_probs: Optional[Dict[str, Any]] = None,
    ) -> ExplainablePredictionResponse:
        """
        Builds dual explanations (technical & non-technical) from raw SHAP attribution vectors.
        """
        # 1. Technical Explanation Assembly
        sorted_shap = sorted(
            shap_values.items(), key=lambda kv: abs(kv[1]), reverse=True
        )

        top_attributions: List[FeatureAttribution] = []
        for rank, (feat_name, phi) in enumerate(sorted_shap, start=1):
            val = feature_values.get(feat_name, None)
            direction = "INCREASES_PREDICTION" if phi >= 0 else "DECREASES_PREDICTION"
            desc = self.feature_descriptions.get(feat_name, feat_name.replace("_", " ").title())
            
            top_attributions.append(
                FeatureAttribution(
                    feature_name=feat_name,
                    feature_value=val,
                    attribution_value=round(float(phi), 4),
                    direction=direction,
                    rank=rank,
                    technical_description=f"{desc} (value={val}) contributed {phi:+.2f} to the model prediction.",
                )
            )

        sum_phi = float(sum(shap_values.values()))
        additivity_residual = abs(predicted_value - (base_value + sum_phi))

        technical = TechnicalExplanation(
            base_value_e_fx=round(float(base_value), 4),
            predicted_value_fx=round(float(predicted_value), 4),
            sum_shap_attributions=round(sum_phi, 4),
            additivity_residual=round(float(additivity_residual), 6),
            top_features=top_attributions[:5],  # Top 5 most influential
        )

        # 2. Non-Technical Narrative Synthesis (Zero Causal Language)
        top_push = [a for a in top_attributions if a.attribution_value > 0][:2]
        top_drag = [a for a in top_attributions if a.attribution_value < 0][:2]

        factors = []
        if top_push:
            names = ", ".join([f"{a.feature_name.replace('_', ' ')} ({a.feature_value})" for a in top_push])
            factors.append(f"Elevated by observed conditions: {names}")
        if top_drag:
            names = ", ".join([f"{a.feature_name.replace('_', ' ')} ({a.feature_value})" for a in top_drag])
            factors.append(f"Reduced by observed conditions: {names}")

        summary = (
            f"The model estimates {target_variable} to be {predicted_value:.1f} "
            f"(compared to the typical baseline of {base_value:.1f}). "
            f"This prediction is most strongly associated with recent historical patterns "
            f"and environmental features: " + "; ".join(factors) + "."
        )

        # Sanitize through CausalGuard
        clean_summary, _ = CausalGuard.sanitize_explanation_text(summary)

        non_technical = NonTechnicalExplanation(
            summary_narrative=clean_summary,
            primary_contributing_factors=[a.technical_description for a in top_attributions[:3]],
            operational_context=(
                "Operators should monitor this location for potential slowdowns or elevated risk. "
                "These factors represent statistical patterns observed in historical data, not proven root causes."
            ),
        )

        # 3. Epistemic Notice
        notice_dict = {}
        CausalGuard.append_epistemic_disclaimer(notice_dict)
        raw_notice = notice_dict["epistemic_notice"]

        epistemic = EpistemicNotice(
            prediction_type=raw_notice["prediction_type"],
            is_causal_claim=raw_notice["is_causal_claim"],
            disclaimer=raw_notice["disclaimer"],
            conceptual_distinction=raw_notice["conceptual_distinction"],
        )

        return ExplainablePredictionResponse(
            entity_id=str(entity_id),
            target_variable=target_variable,
            prediction=round(float(predicted_value), 3),
            confidence_or_probabilities=confidence_or_probs,
            technical_explanation=technical,
            non_technical_explanation=non_technical,
            epistemic_notice=epistemic,
        )
