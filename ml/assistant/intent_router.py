"""
SmartCityAI - Assistant Intent Router & Entity Extractor
Classifies user queries into verified platform domains and extracts parameters.
Rejects out-of-domain requests without hallucinating responses.
"""

import re
from typing import Any, Dict
from ml.assistant.schemas import IntentPlan


class IntentRouter:
    """Routes natural language queries to deterministic query planners."""

    PATTERNS = {
        "TRAFFIC_CONGESTION_QUERY": [
            r"\b(traffic|congestion|speed|slowdown|gridlock|delay|bottleneck)\b",
            r"\b(elevated predicted traffic|heavy traffic|traffic forecast)\b",
        ],
        "AIR_QUALITY_TREND_QUERY": [
            r"\b(aqi|air quality|pm25|pm2\.5|pm10|pollution|smog|emissions)\b",
            r"\b(changed over the last|air quality trend|pollution levels)\b",
        ],
        "ANOMALY_INVESTIGATION_QUERY": [
            r"\b(unusual|anomaly|anomalies|abnormal|unexpected|outlier|irregular)\b",
            r"\b(unusual traffic patterns|unusual slowdowns|sensor fault)\b",
        ],
        "ACCIDENT_RISK_EXPLANATION_QUERY": [
            r"\b(accident|crash|safety|risk|factors contributed|why is.*high risk|blackspot)\b",
            r"\b(contributed to today's high-risk|severity tier|safety risk)\b",
        ],
    }

    def route_query(self, query: str) -> IntentPlan:
        """Classifies intent and extracts recognized entities."""
        query_clean = query.strip().lower()

        # Check domain intents
        scores = {}
        for intent, patterns in self.PATTERNS.items():
            score = 0
            for pat in patterns:
                if re.search(pat, query_clean):
                    score += 1
            scores[intent] = score

        best_intent = max(scores, key=scores.get)
        max_score = scores[best_intent]

        # Out-of-Domain Guard
        if max_score == 0:
            return IntentPlan(
                intent_type="OUT_OF_DOMAIN",
                confidence=0.0,
                entities={},
                query_plan_name="none",
                is_supported=False,
                rejection_reason=(
                    "SmartCityAI Assistant only answers questions regarding urban traffic congestion, "
                    "accident risk safety analysis, air quality environmental metrics, and sensor anomalies."
                ),
            )

        # Entity Extraction
        entities: Dict[str, Any] = {}

        # 1. Days duration extraction (e.g., "last 30 days", "past 7 days")
        days_match = re.search(r"(\d+)\s*(?:day|days)", query_clean)
        if days_match:
            entities["days"] = int(days_match.group(1))
        elif "month" in query_clean:
            entities["days"] = 30
        elif "week" in query_clean:
            entities["days"] = 7
        else:
            entities["days"] = 30  # Default lookback

        # 2. Pollutant target extraction
        if "pm10" in query_clean:
            entities["pollutant"] = "pm10"
        elif "no2" in query_clean:
            entities["pollutant"] = "no2"
        elif "pm2" in query_clean or "pm2.5" in query_clean or "pm25" in query_clean:
            entities["pollutant"] = "pm25"
        else:
            entities["pollutant"] = "aqi"

        # 3. Location / Street extraction
        streets = ["michigan ave", "state st", "halsted st", "ashland ave", "western ave", "karve road", "shivajinagar"]
        for st in streets:
            if st in query_clean:
                entities["street_name"] = st.title()
                break

        # 4. Forecast horizon extraction
        if "3h" in query_clean or "3 hour" in query_clean:
            entities["horizon_hours"] = 3
        elif "6h" in query_clean or "6 hour" in query_clean:
            entities["horizon_hours"] = 6
        else:
            entities["horizon_hours"] = 1

        return IntentPlan(
            intent_type=best_intent,
            confidence=0.95,
            entities=entities,
            query_plan_name=f"plan_{best_intent.lower()}",
            is_supported=True,
        )
