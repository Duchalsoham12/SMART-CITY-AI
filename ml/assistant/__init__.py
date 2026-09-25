"""
SmartCityAI - Urban Analytics Assistant Package
Provides the end-to-end fact-grounded natural language query engine.
"""

from datetime import datetime, timezone
from typing import Optional
from ml.assistant.audit_logger import AuditLogger
from ml.assistant.fact_retriever import FactRetriever
from ml.assistant.hallucination_guard import HallucinationGuard
from ml.assistant.intent_router import IntentRouter
from ml.assistant.query_planner import QueryPlanner
from ml.assistant.schemas import AssistantResponse, FactGraph, FactItem, IntentPlan, UserQueryRequest
from ml.assistant.synthesizer import ResponseSynthesizer


class UrbanAnalyticsAssistant:
    """
    End-to-end Urban Analytics Assistant orchestrator.
    Grounded strictly in verified platform data, deterministic SQL/analytics,
    and non-causal epistemic safeguards.
    """

    def __init__(self, log_path: Optional[str] = None):
        self.router = IntentRouter()
        self.planner = QueryPlanner()
        self.retriever = FactRetriever()
        self.synthesizer = ResponseSynthesizer()
        self.guard = HallucinationGuard()
        self.logger = AuditLogger(log_file_path=log_path)

    def ask(self, request_or_text) -> AssistantResponse:
        """Processes a natural language query through the full grounded verification pipeline."""
        if isinstance(request_or_text, str):
            request = UserQueryRequest(query_text=request_or_text)
        else:
            request = request_or_text

        # 1. Intent routing & entity extraction
        intent_plan: IntentPlan = self.router.route_query(request.query_text)

        # If out of domain, synthesize refusal immediately
        if not intent_plan.is_supported:
            empty_graph = FactGraph(
                query_id="out_of_domain",
                facts=[],
                retrieval_timestamp_utc=request.client_timestamp or datetime.now(timezone.utc),
                execution_time_ms=0.0,
                is_empty=True,
            )
            raw_response = self.synthesizer.synthesize(request.query_text, intent_plan, empty_graph)
            self.logger.log_interaction(request, intent_plan, empty_graph, raw_response)
            return raw_response

        # 2. Deterministic query planning
        query_plan = self.planner.plan(intent_plan)

        # 3. Deterministic fact retrieval
        fact_graph = self.retriever.execute_plan(query_plan)

        # 4. Response synthesis
        raw_response = self.synthesizer.synthesize(request.query_text, intent_plan, fact_graph)

        # 5. Hallucination & non-causal guard verification
        verified_response = self.guard.audit_and_sanitize(raw_response, fact_graph)

        # 6. Audit logging
        self.logger.log_interaction(request, intent_plan, fact_graph, verified_response)

        return verified_response


__all__ = [
    "UrbanAnalyticsAssistant",
    "IntentRouter",
    "QueryPlanner",
    "FactRetriever",
    "ResponseSynthesizer",
    "HallucinationGuard",
    "AuditLogger",
    "UserQueryRequest",
    "IntentPlan",
    "FactGraph",
    "AssistantResponse",
]
