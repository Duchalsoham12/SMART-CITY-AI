"""
SmartCityAI - Explainable AI Unit Tests
Verifies dual explanation synthesis, Shapley additivity, causal sanitization, and Pydantic contracts.
"""

import pytest
from ml.xai.causal_guard import CausalGuard, MANDATORY_CAUSAL_DISCLAIMER
from ml.xai.explainer import ExplainabilityEngine
from ml.xai.schemas import ExplainablePredictionResponse


def test_causal_guard_sanitization():
    bad_text = "Heavy rain causes accidents and led to severe congestion which proves that road defects cause crashes."
    sanitized, was_modified = CausalGuard.sanitize_explanation_text(bad_text)

    assert was_modified is True
    # Forbidden words must be scrubbed
    assert "causes" not in sanitized.lower()
    assert "led to" not in sanitized.lower()
    assert "proves that" not in sanitized.lower()
    # Statistically honest terminology substituted
    assert "is statistically associated with" in sanitized or "co-occurred with" in sanitized


def test_causal_disclaimer_append():
    data = {"prediction": 15.2}
    enriched = CausalGuard.append_epistemic_disclaimer(data)

    assert "epistemic_notice" in enriched
    assert enriched["epistemic_notice"]["is_causal_claim"] is False
    assert MANDATORY_CAUSAL_DISCLAIMER in enriched["epistemic_notice"]["disclaimer"]
    assert "causal_inference" in enriched["epistemic_notice"]["conceptual_distinction"]


def test_explainable_prediction_additivity():
    engine = ExplainabilityEngine()

    base_val = 22.0
    shap_vals = {
        "speed_lag_1h": -5.0,
        "precipitation_mm": -2.5,
        "temperature_celsius": 0.5,
    }
    # f(x) = base + sum(phi) = 22.0 - 5.0 - 2.5 + 0.5 = 15.0
    pred_val = 15.0

    features = {
        "speed_lag_1h": 14.5,
        "precipitation_mm": 12.0,
        "temperature_celsius": 18.0,
    }

    resp = engine.explain_prediction(
        entity_id="segment_102",
        target_variable="speed_mph",
        predicted_value=pred_val,
        feature_values=features,
        base_value=base_val,
        shap_values=shap_vals,
    )

    assert isinstance(resp, ExplainablePredictionResponse)
    assert resp.entity_id == "segment_102"
    assert resp.prediction == 15.0
    # Additivity residual must be near zero
    assert resp.technical_explanation.additivity_residual < 1e-5
    # Technical explanation has features sorted by impact
    assert resp.technical_explanation.top_features[0].feature_name == "speed_lag_1h"
    assert resp.technical_explanation.top_features[0].direction == "DECREASES_PREDICTION"
    # Non-technical explanation contains narrative
    assert len(resp.non_technical_explanation.summary_narrative) > 20
    assert resp.epistemic_notice.is_causal_claim is False
