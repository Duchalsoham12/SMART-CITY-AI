/**
 * SmartCityAI - Frontend API Type Definitions
 * Strictly aligned with FastAPI Backend Pydantic Schemas.
 */

export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface TrafficRecord {
  id: number;
  segment_id: number;
  street_name: string;
  speed_mph: number;
  historical_speed_mph?: number;
  bus_count: number;
  recorded_at: string;
  created_at: string;
}

export interface TrafficForecast {
  segment_id: number;
  predicted_speed_mph: number;
  horizon_hours: number;
  quantile_05: number;
  quantile_50: number;
  quantile_95: number;
  congestion_level: 'FREE_FLOW' | 'MODERATE' | 'CONGESTED' | 'SEVERE';
  model_version: string;
  inference_timestamp_utc: string;
}

export interface AccidentRecord {
  id: number;
  crash_record_id: string;
  crash_date: string;
  latitude: number;
  longitude: number;
  h3_index: string;
  injuries_total: number;
  fatalities_total: number;
  weather_condition: string;
  lighting_condition: string;
  risk_score?: number;
  risk_tier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  created_at: string;
}

export interface ContributingFeature {
  feature_name: string;
  attribution_value: number;
  direction: 'RISK_INCREASING' | 'RISK_DECREASING' | 'BASELINE';
}

export interface AccidentRiskScore {
  h3_index: string;
  predicted_risk_score: number;
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  uncertainty_interval: [number, number];
  top_contributing_features: ContributingFeature[];
  model_version: string;
  epistemic_disclaimer: string;
}

export interface AirQualityRecord {
  id: number;
  station_id: string;
  station_name: string;
  recorded_at: string;
  aqi: number;
  pm25?: number;
  pm10?: number;
  no2?: number;
  o3?: number;
  temperature_c?: number;
  humidity_pct?: number;
  created_at: string;
}

export interface AQIForecast {
  station_id: string;
  horizon_hours: number;
  predicted_aqi: number;
  uncertainty_bounds: [number, number];
  pollutant_breakdown: Record<string, number>;
  air_quality_category: 'GOOD' | 'MODERATE' | 'UNHEALTHY_SENSITIVE' | 'UNHEALTHY' | 'VERY_UNHEALTHY' | 'HAZARDOUS';
  model_version: string;
}

export interface AnomalyRecord {
  id: number;
  segment_id: number;
  street_name: string;
  detected_at: string;
  observed_value: number;
  expected_value: number;
  residual_z_score: number;
  anomaly_score: number;
  anomaly_type: string;
  is_confirmed: boolean;
}

export interface AnomalyDetectionResult {
  segment_id: number;
  street_name: string;
  is_anomaly: boolean;
  residual_z_score: number;
  anomaly_score: number;
  anomaly_type: string;
  severity: 'NORMAL' | 'MILD_DEVIATION' | 'SEVERE_ANOMALY';
  action_recommendation: string;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'Point' | 'MultiPolygon';
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface FactItem {
  key: string;
  value: any;
  unit: string;
  temporal_classification: 'HISTORICAL_OBSERVATION' | 'MODEL_PREDICTION';
  uncertainty_bounds?: [number, number];
  source_citation: string;
}

export interface AssistantQueryResponse {
  query_text: string;
  intent: string;
  answer_text: string;
  facts_used: FactItem[];
  sources_cited: string[];
  temporal_classification: 'HISTORICAL_OBSERVATION' | 'MODEL_PREDICTION' | 'HYBRID';
  epistemic_disclaimer: string;
  hallucination_audit_passed: boolean;
  audit_trace_id: string;
}

export interface CityHealthSummary {
  city_name: string;
  timestamp_utc: string;
  active_traffic_congestion_zones: number;
  high_risk_accident_corridors: number;
  current_city_average_aqi: number;
  aqi_status_category: string;
  active_anomalies_detected_24h: number;
  overall_urban_stress_index: number;
}

export interface HealthCheckData {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  version: string;
  environment: string;
  uptime_seconds: number;
  timestamp_utc: string;
  components: Record<string, { status: string; details?: Record<string, any> }>;
}

export interface DataQualityReport {
  completeness_score: number;
  validity_score: number;
  uniqueness_score: number;
  consistency_score: number;
  total_records: number;
  valid_records: number;
  quarantined_records: number;
  is_approved: boolean;
  warnings: string[];
}

export interface DatasetSummary {
  dataset_name: string;
  category: 'traffic' | 'accidents' | 'air_quality' | 'custom' | string;
  version_id: string;
  sha256_hash: string;
  row_count: number;
  columns: string[];
  quality_score: number;
  created_at_utc: string;
  is_active?: boolean;
  manifest_path?: string;
}

export interface ColumnMappingItem {
  source_column: string;
  suggested_target: string;
  confidence: number;
  data_type: string;
  sample_values: string[];
}

export interface DatasetUploadResponse {
  success: boolean;
  message: string;
  dataset_name: string;
  version_id: string;
  sha256_hash: string;
  total_rows: number;
  valid_rows: number;
  quarantined_rows: number;
  quality_report: DataQualityReport;
  preview_records: Record<string, any>[];
}

