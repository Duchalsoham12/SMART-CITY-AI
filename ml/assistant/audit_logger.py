"""
SmartCityAI - Assistant Audit Logger
Logs structured compliance records for all queries, query plans, fact retrievals,
and hallucination audit checks into immutable audit streams.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from ml.assistant.schemas import AssistantResponse, FactGraph, IntentPlan, UserQueryRequest


class AuditLogger:
    """Logs assistant interactions for compliance, traceability, and post-hoc auditing."""

    def __init__(self, log_file_path: Optional[str] = None):
        self.log_file_path = Path(log_file_path) if log_file_path else None
        self.in_memory_records: List[Dict[str, Any]] = []

    def log_interaction(
        self,
        request: UserQueryRequest,
        intent_plan: IntentPlan,
        fact_graph: FactGraph,
        response: AssistantResponse,
    ) -> Dict[str, Any]:
        """Constructs and persists an audit entry for a query interaction."""
        record = {
            "trace_id": response.audit_trace_id,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "session_id": request.session_id,
            "user_role": request.user_role,
            "query_text": request.query_text,
            "classified_intent": intent_plan.intent_type,
            "intent_confidence": intent_plan.confidence,
            "query_plan_name": intent_plan.query_plan_name,
            "facts_retrieved_count": len(fact_graph.facts),
            "sources_cited": response.sources_cited,
            "temporal_classification": response.temporal_classification,
            "hallucination_audit_passed": response.hallucination_audit_passed,
            "execution_time_ms": fact_graph.execution_time_ms,
        }

        self.in_memory_records.append(record)

        if self.log_file_path:
            self.log_file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.log_file_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")

        return record
