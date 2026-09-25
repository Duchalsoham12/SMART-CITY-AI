"""
SmartCityAI - Urban Analytics Assistant Test Suite
Validates intent classification, deterministic query planning, fact retrieval,
non-causal synthesis, hallucination prevention, and compliance audit trails.
"""

import pytest
from ml.assistant import (
    UrbanAnalyticsAssistant,
    IntentRouter,
    QueryPlanner,
    FactRetriever,
    HallucinationGuard,
    UserQueryRequest,
    AssistantResponse,
    FactItem,
    FactGraph,
)
from datetime import datetime, timezone


@pytest.fixture
def assistant():
    return UrbanAnalyticsAssistant()


def test_traffic_congestion_query(assistant):
    """Verifies canonical query: What areas currently have elevated predicted traffic?"""
    query = "What areas currently have elevated predicted traffic?"
    response = assistant.ask(query)

    assert response.intent == "TRAFFIC_CONGESTION_QUERY"
    assert response.temporal_classification == "MODEL_PREDICTION"
    assert response.hallucination_audit_passed is True
    assert len(response.facts_used) > 0
    assert len(response.sources_cited) > 0
    assert "[MODEL_PREDICTION]" in response.answer_text
    assert "[Source:" in response.answer_text
    assert "Michigan Ave" in response.answer_text
    # Verify uncertainty interval is stated
    assert "prediction interval" in response.answer_text


def test_air_quality_trend_query(assistant):
    """Verifies canonical query: How has AQI changed over the last 30 days?"""
    query = "How has AQI changed over the last 30 days?"
    response = assistant.ask(query)

    assert response.intent == "AIR_QUALITY_TREND_QUERY"
    assert response.temporal_classification == "HISTORICAL_OBSERVATION"
    assert response.hallucination_audit_passed is True
    assert len(response.facts_used) >= 4
    assert "[HISTORICAL_OBSERVATION]" in response.answer_text
    assert "30" in response.answer_text
    assert "14.26%" in response.answer_text
    assert "[Source:" in response.answer_text


def test_anomaly_investigation_query(assistant):
    """Verifies canonical query: Which locations experienced unusual traffic patterns?"""
    query = "Which locations experienced unusual traffic patterns?"
    response = assistant.ask(query)

    assert response.intent == "ANOMALY_INVESTIGATION_QUERY"
    assert response.temporal_classification == "HISTORICAL_OBSERVATION"
    assert response.hallucination_audit_passed is True
    assert len(response.facts_used) > 0
    assert "[HISTORICAL_OBSERVATION]" in response.answer_text
    assert "Ashland Ave" in response.answer_text
    assert "Z-score" in response.answer_text


def test_accident_risk_explanation_query(assistant):
    """Verifies canonical query: What factors contributed to today's high-risk prediction?"""
    query = "What factors contributed to today's high-risk prediction?"
    response = assistant.ask(query)

    assert response.intent == "ACCIDENT_RISK_EXPLANATION_QUERY"
    assert response.temporal_classification == "MODEL_PREDICTION"
    assert response.hallucination_audit_passed is True
    assert len(response.facts_used) > 0
    assert "HIGH_RISK" in response.answer_text
    assert "SHAP" in response.answer_text
    assert "precipitation_depth_mm" in response.answer_text
    assert "Non-Causal Epistemic Notice" in response.epistemic_disclaimer


def test_out_of_domain_query_rejection(assistant):
    """Verifies out-of-domain queries are rejected with zero hallucinated data."""
    query = "Who won the 2024 Super Bowl?"
    response = assistant.ask(query)

    assert response.intent == "OUT_OF_DOMAIN"
    assert len(response.facts_used) == 0
    assert len(response.sources_cited) == 0
    assert "SmartCityAI Assistant only answers questions regarding" in response.answer_text


def test_hallucination_guard_catches_unauthorized_numbers():
    """Verifies HallucinationGuard flags ungrounded numerical values."""
    mock_facts = FactGraph(
        query_id="test_01",
        facts=[
            FactItem(
                key="speed",
                value=12.5,
                unit="mph",
                temporal_classification="MODEL_PREDICTION",
                uncertainty_bounds=[10.0, 15.0],
                source_citation="[Source: Test]",
            )
        ],
        retrieval_timestamp_utc=datetime.now(timezone.utc),
        execution_time_ms=10.0,
    )

    # Text containing fabricated 987.6% not in FactGraph
    hallucinated_text = "Predicted speed is 12.5 mph but delay spiked by 987.6% [Source: Test]"
    passed, ungrounded = HallucinationGuard.audit_numerical_grounding(hallucinated_text, mock_facts)

    assert passed is False
    assert any(abs(u - 987.6) < 0.1 for u in ungrounded)


def test_causal_guard_sanitizes_illegal_claims():
    """Verifies causal claims in model explanations are rewritten to association language."""
    mock_facts = FactGraph(
        query_id="test_02",
        facts=[
            FactItem(
                key="test_feature",
                value=15.0,
                unit="metric",
                temporal_classification="MODEL_PREDICTION",
                source_citation="[Source: Test]",
            )
        ],
        retrieval_timestamp_utc=datetime.now(timezone.utc),
        execution_time_ms=5.0,
    )

    response = AssistantResponse(
        query_text="Why the crash?",
        intent="ACCIDENT_RISK_EXPLANATION_QUERY",
        answer_text="Heavy rain caused by storm leads to crashes at 15.0 mph. [Source: Test]",
        facts_used=mock_facts.facts,
        sources_cited=["[Source: Test]"],
        temporal_classification="MODEL_PREDICTION",
        epistemic_disclaimer="Non-causal",
        hallucination_audit_passed=True,
        audit_trace_id="test_trace",
    )

    audited = HallucinationGuard.audit_and_sanitize(response, mock_facts)
    # Prohibited 'caused by' and 'leads to' must be sanitized
    assert "caused by" not in audited.answer_text
    assert "leads to" not in audited.answer_text
    assert "observed in conjunction with" in audited.answer_text
    assert "is correlated with higher incidence of" in audited.answer_text


def test_missing_data_refusal(assistant):
    """Verifies that queries for non-existent segments state unavailable data and do not fabricate."""
    query = "What is the traffic forecast for Atlantis Boulevard?"
    # Intent routes to traffic, but street won't exist in data
    response = assistant.ask(query)

    assert response.intent == "TRAFFIC_CONGESTION_QUERY"
    # Either returns empty or filtered data without fabricating Atlantis Boulevard
    assert "Atlantis Boulevard" not in [f.key for f in response.facts_used]


def test_audit_logger_records_interactions(assistant):
    """Verifies that all query executions generate structured audit records."""
    assistant.ask("How has AQI changed over the last 30 days?")
    records = assistant.logger.in_memory_records

    assert len(records) >= 1
    latest = records[-1]
    assert "trace_id" in latest
    assert latest["classified_intent"] == "AIR_QUALITY_TREND_QUERY"
    assert latest["hallucination_audit_passed"] is True
    assert latest["facts_retrieved_count"] > 0
