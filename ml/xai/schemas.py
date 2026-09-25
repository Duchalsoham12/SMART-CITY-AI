"""
SmartCityAI - Explainable Prediction API Schemas
Defines strict Pydantic v2 response contracts for explainable AI predictions.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FeatureAttribution(BaseModel):
    """Granular attribution detail for a single input feature."""
    feature_name: str
    feature_value: Any
    attribution_value: float = Field(..., description="SHAP phi value (positive = pushes prediction higher)")
    direction: str = Field(..., description="'INCREASES_PREDICTION' or 'DECREASES_PREDICTION'")
    rank: int = Field(..., ge=1, description="Importance rank (1 = most influential)")
    technical_description: str


class TechnicalExplanation(BaseModel):
    """Detailed mathematical explanation suitable for data scientists & ML auditors."""
    base_value_e_fx: float = Field(..., description="Expected baseline value E[f(x)] before feature conditioning")
    predicted_value_fx: float = Field(..., description="Final model prediction f(x)")
    sum_shap_attributions: float = Field(..., description="Sum of all phi attributions")
    additivity_residual: float = Field(..., description="Numerical residual |f(x) - (E[f(x)] + sum(phi))|")
    top_features: List[FeatureAttribution]


class NonTechnicalExplanation(BaseModel):
    """Domain-grounded plain-English explanation for municipal planners & dispatchers."""
    summary_narrative: str
    primary_contributing_factors: List[str]
    operational_context: str


class EpistemicNotice(BaseModel):
    """Mandatory causal disclaimer and conceptual definitions."""
    prediction_type: str = "STATISTICAL_CORRELATION"
    is_causal_claim: bool = False
    disclaimer: str
    conceptual_distinction: Dict[str, str]


class ExplainablePredictionResponse(BaseModel):
    """Master API response contract combining predictions, probabilities, and dual explanations."""
    entity_id: str
    target_variable: str
    prediction: Any
    confidence_or_probabilities: Optional[Dict[str, Any]] = None
    technical_explanation: TechnicalExplanation
    non_technical_explanation: NonTechnicalExplanation
    epistemic_notice: EpistemicNotice
