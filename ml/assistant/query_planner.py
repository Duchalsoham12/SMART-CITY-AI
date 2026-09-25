"""
SmartCityAI - Assistant Query Planner
Converts structured IntentPlans into deterministic, parameterized queries
for the platform's analytical storage and ML inference stores.
Never delegates numerical calculations or SQL generation to an LLM.
"""

from typing import Any, Dict
from pydantic import BaseModel, Field
from ml.assistant.schemas import IntentPlan


class DeterministicQueryPlan(BaseModel):
    """Parameterized analytical execution plan for deterministic execution."""
    plan_name: str
    target_table: str
    parameterized_sql: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    aggregation_target: str
    temporal_nature: str  # 'HISTORICAL_OBSERVATION' or 'MODEL_PREDICTION'


class QueryPlanner:
    """Deterministic Query Planner mapping intents to verified analytical queries."""

    SPEED_CONGESTION_THRESHOLD_MPH: float = 15.0
    ANOMALY_Z_THRESHOLD: float = 2.5

    def plan(self, intent_plan: IntentPlan) -> DeterministicQueryPlan:
        """Translates an intent plan into an immutable parameterized query plan."""
        intent = intent_plan.intent_type
        entities = intent_plan.entities

        if intent == "TRAFFIC_CONGESTION_QUERY":
            horizon = entities.get("horizon_hours", 1)
            street = entities.get("street_name")
            params = {
                "speed_threshold": self.SPEED_CONGESTION_THRESHOLD_MPH,
                "horizon_hours": horizon,
            }
            if street:
                params["street_name"] = street
                sql = (
                    "SELECT segment_id, street_name, predicted_speed_mph, "
                    "lower_ci_90, upper_ci_90, model_version, inference_time "
                    "FROM mart_traffic_forecasts "
                    "WHERE street_name = :street_name AND horizon_hours = :horizon_hours "
                    "AND predicted_speed_mph <= :speed_threshold "
                    "ORDER BY predicted_speed_mph ASC LIMIT 10;"
                )
            else:
                sql = (
                    "SELECT segment_id, street_name, predicted_speed_mph, "
                    "lower_ci_90, upper_ci_90, model_version, inference_time "
                    "FROM mart_traffic_forecasts "
                    "WHERE horizon_hours = :horizon_hours "
                    "AND predicted_speed_mph <= :speed_threshold "
                    "ORDER BY predicted_speed_mph ASC LIMIT 10;"
                )
            return DeterministicQueryPlan(
                plan_name="fetch_congested_forecast_segments",
                target_table="mart_traffic_forecasts",
                parameterized_sql=sql,
                parameters=params,
                aggregation_target="congested_segments",
                temporal_nature="MODEL_PREDICTION",
            )

        elif intent == "AIR_QUALITY_TREND_QUERY":
            days = entities.get("days", 30)
            pollutant = entities.get("pollutant", "aqi").lower()
            params = {"lookback_days": days, "pollutant": pollutant}
            sql = (
                "WITH time_window AS ("
                "  SELECT timestamp, {pollutant}_value as val "
                "  FROM mart_air_quality_hourly "
                "  WHERE timestamp >= NOW() - INTERVAL ':lookback_days DAYS' "
                "), "
                "aggregates AS ("
                "  SELECT "
                "    AVG(val) FILTER (WHERE timestamp >= NOW() - INTERVAL '7 DAYS') as recent_avg, "
                "    AVG(val) FILTER (WHERE timestamp < NOW() - INTERVAL '7 DAYS') as baseline_avg, "
                "    MIN(val) as min_val, "
                "    MAX(val) as max_val "
                "  FROM time_window"
                ") "
                "SELECT recent_avg, baseline_avg, min_val, max_val, "
                "((recent_avg - baseline_avg) / NULLIF(baseline_avg, 0)) * 100.0 as pct_change "
                "FROM aggregates;"
            ).format(pollutant=pollutant)
            return DeterministicQueryPlan(
                plan_name="compute_aqi_historical_trend",
                target_table="mart_air_quality_hourly",
                parameterized_sql=sql,
                parameters=params,
                aggregation_target="trend_summary",
                temporal_nature="HISTORICAL_OBSERVATION",
            )

        elif intent == "ANOMALY_INVESTIGATION_QUERY":
            params = {
                "z_threshold": self.ANOMALY_Z_THRESHOLD,
                "window_hours": entities.get("window_hours", 24),
            }
            sql = (
                "SELECT segment_id, street_name, observed_speed_mph, expected_speed_mph, "
                "residual_z_score, anomaly_type, detector_version, detection_timestamp "
                "FROM mart_traffic_anomalies "
                "WHERE detection_timestamp >= NOW() - INTERVAL ':window_hours HOURS' "
                "AND ABS(residual_z_score) >= :z_threshold "
                "ORDER BY ABS(residual_z_score) DESC LIMIT 10;"
            )
            return DeterministicQueryPlan(
                plan_name="fetch_recent_traffic_anomalies",
                target_table="mart_traffic_anomalies",
                parameterized_sql=sql,
                parameters=params,
                aggregation_target="anomalous_segments",
                temporal_nature="HISTORICAL_OBSERVATION",
            )

        elif intent == "ACCIDENT_RISK_EXPLANATION_QUERY":
            params = {
                "risk_tier": "HIGH_RISK",
                "h3_index": entities.get("h3_index", "882685623ffffff"),
            }
            sql = (
                "SELECT h3_index, zone_name, predicted_risk_score, risk_tier, "
                "top_1_feature_name, top_1_shap_value, "
                "top_2_feature_name, top_2_shap_value, "
                "top_3_feature_name, top_3_shap_value, "
                "base_rate, model_version, scoring_timestamp "
                "FROM mart_accident_risk_explanations "
                "WHERE h3_index = :h3_index "
                "ORDER BY scoring_timestamp DESC LIMIT 1;"
            )
            return DeterministicQueryPlan(
                plan_name="fetch_crash_risk_shap_explanations",
                target_table="mart_accident_risk_explanations",
                parameterized_sql=sql,
                parameters=params,
                aggregation_target="risk_factors",
                temporal_nature="MODEL_PREDICTION",
            )

        else:
            return DeterministicQueryPlan(
                plan_name="unsupported_plan",
                target_table="none",
                parameterized_sql="",
                parameters={},
                aggregation_target="none",
                temporal_nature="HISTORICAL_OBSERVATION",
            )
