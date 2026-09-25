"""
SmartCityAI - Urban Analytics Assistant Schemas
Pydantic contracts for natural language user queries, query planning,
immutable FactGraphs, and verified response payloads.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class UserQueryRequest(BaseModel):
    """User input natural language query payload."""
    query_text: str = Field(..., min_length=2, description="Natural language prompt")
    session_id: str = Field("default_session", description="Session identifier")
    user_role: str = Field("analyst", description="Role: viewer, analyst, admin")
    client_timestamp: Optional[datetime] = None


class IntentPlan(BaseModel):
    """Structured plan derived from intent classification & entity parsing."""
    intent_type: str = Field(
        ...,
        description="TRAFFIC_CONGESTION_QUERY, AIR_QUALITY_TREND_QUERY, ANOMALY_INVESTIGATION_QUERY, ACCIDENT_RISK_EXPLANATION_QUERY, OUT_OF_DOMAIN"
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
    entities: Dict[str, Any] = Field(default_factory=dict)
    query_plan_name: str
    is_supported: bool = True
    rejection_reason: Optional[str] = None


class FactItem(BaseModel):
    """Individual atomic verified fact retrieved deterministically from database/model."""
    key: str
    value: Any
    unit: str
    temporal_classification: str = Field(
        ..., description="'HISTORICAL_OBSERVATION' or 'MODEL_PREDICTION'"
    )
    uncertainty_bounds: Optional[List[float]] = Field(
        None, description="[lower_bound, upper_bound] for predictions"
    )
    source_citation: str = Field(
        ..., description="Originating data portal, sensor, or model version"
    )


class FactGraph(BaseModel):
    """Immutable collection of verified facts retrieved for the query."""
    query_id: str
    facts: List[FactItem] = Field(default_factory=list)
    retrieval_timestamp_utc: datetime
    execution_time_ms: float
    is_empty: bool = False
    missing_data_note: Optional[str] = None


class AssistantResponse(BaseModel):
    """Final grounded assistant response delivered to the user."""
    query_text: str
    intent: str
    answer_text: str
    facts_used: List[FactItem]
    sources_cited: List[str]
    temporal_classification: str = Field(
        ..., description="'HISTORICAL_OBSERVATION', 'MODEL_PREDICTION', or 'HYBRID'"
    )
    epistemic_disclaimer: str
    hallucination_audit_passed: bool
    audit_trace_id: str
