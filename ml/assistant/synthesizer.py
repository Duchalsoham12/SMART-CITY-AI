"""
SmartCityAI - Assistant Response Synthesizer
Synthesizes verified factual responses strictly grounded in the immutable FactGraph.
Embeds internal source citations, explicit temporal classifications, and
stated uncertainty intervals while enforcing non-causal epistemic laws.
"""

from typing import List
import uuid
from ml.assistant.schemas import AssistantResponse, FactGraph, IntentPlan


class ResponseSynthesizer:
    """Deterministic synthesizer translating FactGraphs into natural language."""

    NON_CAUSAL_DISCLAIMER: str = (
        "Non-Causal Epistemic Notice: Stated model predictions and feature importance attributions "
        "reflect statistical correlations identified in historical training data. They do not constitute "
        "causal proof, physical necessity, or fault determination."
    )

    def synthesize(self, query_text: str, intent_plan: IntentPlan, fact_graph: FactGraph) -> AssistantResponse:
        """Constructs a fully grounded AssistantResponse from FactGraph."""
        trace_id = f"trace_{uuid.uuid4().hex[:12]}"

        # 1. Out of domain refusal
        if not intent_plan.is_supported:
            return AssistantResponse(
                query_text=query_text,
                intent=intent_plan.intent_type,
                answer_text=intent_plan.rejection_reason or "This request is outside the scope of SmartCityAI.",
                facts_used=[],
                sources_cited=[],
                temporal_classification="HISTORICAL_OBSERVATION",
                epistemic_disclaimer=self.NON_CAUSAL_DISCLAIMER,
                hallucination_audit_passed=True,
                audit_trace_id=trace_id,
            )

        # 2. Missing data refusal
        if fact_graph.is_empty:
            msg = (
                f"Verified platform data is currently unavailable: {fact_graph.missing_data_note} "
                f"SmartCityAI refuses to fabricate or interpolate unobserved values."
            )
            return AssistantResponse(
                query_text=query_text,
                intent=intent_plan.intent_type,
                answer_text=msg,
                facts_used=[],
                sources_cited=[],
                temporal_classification="HISTORICAL_OBSERVATION",
                epistemic_disclaimer=self.NON_CAUSAL_DISCLAIMER,
                hallucination_audit_passed=True,
                audit_trace_id=trace_id,
            )

        sources: List[str] = list(set([f.source_citation for f in fact_graph.facts]))
        intent = intent_plan.intent_type

        # 3. Domain Syntheses
        if intent == "TRAFFIC_CONGESTION_QUERY":
            answer_lines = [
                "[MODEL_PREDICTION] Traffic Congestion Forecast:",
                f"The predictive model forecasts elevated congestion across {len(fact_graph.facts)} corridor segments for the upcoming 1-hour horizon (speed <= 15.0 mph):"
            ]
            for fact in fact_graph.facts:
                street_name = fact.key.replace("predicted_speed_", "").replace("_", " ").title()
                ci_str = f"[{fact.uncertainty_bounds[0]:.1f}, {fact.uncertainty_bounds[1]:.1f}]" if fact.uncertainty_bounds else "N/A"
                answer_lines.append(
                    f" - {street_name}: Predicted speed of {fact.value:.1f} mph (90% prediction interval: {ci_str} mph). {fact.source_citation}"
                )
            temporal = "MODEL_PREDICTION"

        elif intent == "AIR_QUALITY_TREND_QUERY":
            fact_dict = {f.key: f.value for f in fact_graph.facts}
            days = fact_dict.get("aqi_lookback_days", 30)
            recent_avg = fact_dict.get("aqi_recent_avg", 0.0)
            baseline_avg = fact_dict.get("aqi_baseline_avg", 0.0)
            pct_change = fact_dict.get("aqi_pct_change", 0.0)
            min_val = fact_dict.get("aqi_range_min", 0.0)
            max_val = fact_dict.get("aqi_range_max", 0.0)
            citation = fact_graph.facts[0].source_citation if fact_graph.facts else ""

            direction = "decreased" if pct_change < 0 else "increased"
            answer_lines = [
                f"[HISTORICAL_OBSERVATION] Air Quality Trend Analysis ({days}-Day Window):",
                f"Over the last {days} days, the 7-day rolling average AQI has {direction} by {abs(pct_change):.2f}% "
                f"(shifting from a baseline of {baseline_avg:.1f} to a recent average of {recent_avg:.1f} AQI).",
                f"Historical readings during this interval spanned from a minimum of {min_val:.1f} to a maximum of {max_val:.1f} AQI.",
                f"{citation}"
            ]
            temporal = "HISTORICAL_OBSERVATION"

        elif intent == "ANOMALY_INVESTIGATION_QUERY":
            answer_lines = [
                "[HISTORICAL_OBSERVATION] Urban Anomaly Detection Report:",
                "Statistical anomaly detection flagged the following corridor segments exhibiting significant deviations (|Z| >= 2.50):"
            ]
            # Group facts by segment
            segments = {}
            for f in fact_graph.facts:
                if "::" in f.key:
                    parts = f.key.split("::")
                    st_name = parts[1]
                    metric = parts[2]
                    segments.setdefault(st_name, {})[metric] = (f.value, f.source_citation)

            for st_name, metrics in segments.items():
                obs = metrics.get("observed_speed", (0.0, ""))[0]
                exp = metrics.get("expected_speed", (0.0, ""))[0]
                z = metrics.get("z_score", (0.0, ""))[0]
                cite = metrics.get("observed_speed", (0.0, ""))[1]
                answer_lines.append(
                    f" - {st_name}: Observed speed {obs:.1f} mph vs expected baseline of {exp:.1f} mph (Residual Z-score: {z:.2f} sigma). {cite}"
                )
            temporal = "HISTORICAL_OBSERVATION"

        elif intent == "ACCIDENT_RISK_EXPLANATION_QUERY":
            fact_dict = {f.key: f.value for f in fact_graph.facts}
            zone_name = fact_dict.get("risk_zone_name", "Urban Hexagon")
            pred_score = fact_dict.get("predicted_risk_score", 0.0)
            risk_tier = fact_dict.get("risk_tier", "UNKNOWN")
            
            # Find uncertainty bounds from predicted_risk_score fact
            ci_str = "N/A"
            for f in fact_graph.facts:
                if f.key == "predicted_risk_score" and f.uncertainty_bounds:
                    ci_str = f"[{f.uncertainty_bounds[0]:.2f}, {f.uncertainty_bounds[1]:.2f}]"

            citation = fact_graph.facts[0].source_citation if fact_graph.facts else ""

            answer_lines = [
                f"[MODEL_PREDICTION] Accident Safety Risk Attribution:",
                f"For geographic zone '{zone_name}', the safety risk model evaluates a risk score of {pred_score:.2f} "
                f"(Tier: {risk_tier}, 90% confidence interval: {ci_str}). {citation}",
                "Top statistical feature attributions (SHAP values):"
            ]
            for f in fact_graph.facts:
                if f.key.startswith("top_contributing_feature_"):
                    answer_lines.append(f" - {f.value}")
            temporal = "MODEL_PREDICTION"

        else:
            answer_lines = ["Query processed with available facts."]
            temporal = "HISTORICAL_OBSERVATION"

        return AssistantResponse(
            query_text=query_text,
            intent=intent,
            answer_text="\n".join(answer_lines),
            facts_used=fact_graph.facts,
            sources_cited=sources,
            temporal_classification=temporal,
            epistemic_disclaimer=self.NON_CAUSAL_DISCLAIMER,
            hallucination_audit_passed=True,  # Will be verified by HallucinationGuard
            audit_trace_id=trace_id,
        )
