/**
 * SmartCityAI - Offline Mock Development Fixtures
 * 
 * [MOCK / OFFLINE FIXTURE NOTICE]:
 * These fixtures are strictly quarantined for local offline frontend rendering and unit testing.
 * When Live Mode is enabled, ALL data is retrieved deterministically from the FastAPI backend.
 */

import {
  AccidentRecord,
  AccidentRiskScore,
  AirQualityRecord,
  AnomalyRecord,
  CityHealthSummary,
  GeoJSONFeatureCollection,
  HealthCheckData,
  TrafficForecast,
  TrafficRecord,
} from '../types/api';

export const MOCK_CITY_SUMMARY: CityHealthSummary = {
  city_name: 'Chicago Metropolitan Area [OFFLINE MOCK FIXTURE]',
  timestamp_utc: new Date().toISOString(),
  active_traffic_congestion_zones: 3,
  high_risk_accident_corridors: 2,
  current_city_average_aqi: 53.5,
  aqi_status_category: 'MODERATE',
  active_anomalies_detected_24h: 2,
  overall_urban_stress_index: 0.34,
};

export const MOCK_TRAFFIC_RECORDS: TrafficRecord[] = [
  { id: 1, segment_id: 101, street_name: 'Michigan Avenue', speed_mph: 11.4, historical_speed_mph: 24.0, bus_count: 5, recorded_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 2, segment_id: 108, street_name: 'Halsted Street', speed_mph: 13.2, historical_speed_mph: 22.5, bus_count: 3, recorded_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 3, segment_id: 142, street_name: 'State Street', speed_mph: 14.1, historical_speed_mph: 26.0, bus_count: 6, recorded_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 4, segment_id: 204, street_name: 'Ashland Avenue', speed_mph: 8.2, historical_speed_mph: 24.5, bus_count: 2, recorded_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 5, segment_id: 315, street_name: 'Western Avenue', speed_mph: 9.5, historical_speed_mph: 26.0, bus_count: 4, recorded_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 6, segment_id: 401, street_name: 'Lake Shore Drive', speed_mph: 38.5, historical_speed_mph: 42.0, bus_count: 1, recorded_at: new Date().toISOString(), created_at: new Date().toISOString() },
];

export const MOCK_TRAFFIC_FORECAST: TrafficForecast = {
  segment_id: 101,
  predicted_speed_mph: 11.4,
  horizon_hours: 1,
  quantile_05: 9.8,
  quantile_50: 11.4,
  quantile_95: 13.1,
  congestion_level: 'SEVERE',
  model_version: 'TrafficForecaster-QuantileLGBM-v2.1 [MOCK FIXTURE]',
  inference_timestamp_utc: new Date().toISOString(),
};

export const MOCK_ACCIDENTS: AccidentRecord[] = [
  { id: 1, crash_record_id: 'CRASH_2026_001', crash_date: new Date().toISOString(), latitude: 41.8827, longitude: -87.6233, h3_index: '882685623ffffff', injuries_total: 2, fatalities_total: 0, weather_condition: 'RAIN', lighting_condition: 'DUSK', risk_score: 0.84, risk_tier: 'HIGH', created_at: new Date().toISOString() },
  { id: 2, crash_record_id: 'CRASH_2026_002', crash_date: new Date().toISOString(), latitude: 41.8950, longitude: -87.6250, h3_index: '882685625ffffff', injuries_total: 0, fatalities_total: 0, weather_condition: 'CLEAR', lighting_condition: 'DAYLIGHT', risk_score: 0.22, risk_tier: 'LOW', created_at: new Date().toISOString() },
  { id: 3, crash_record_id: 'CRASH_2026_003', crash_date: new Date().toISOString(), latitude: 41.8820, longitude: -87.6450, h3_index: '882685621ffffff', injuries_total: 1, fatalities_total: 0, weather_condition: 'SNOW', lighting_condition: 'DARKNESS', risk_score: 0.68, risk_tier: 'HIGH', created_at: new Date().toISOString() },
];

export const MOCK_RISK_SCORE: AccidentRiskScore = {
  h3_index: '882685623ffffff',
  predicted_risk_score: 0.84,
  risk_tier: 'HIGH',
  uncertainty_interval: [0.78, 0.90],
  top_contributing_features: [
    { feature_name: 'precipitation_depth_mm', attribution_value: 0.28, direction: 'RISK_INCREASING' },
    { feature_name: 'speed_ratio_to_freeflow', attribution_value: -0.22, direction: 'RISK_INCREASING' },
    { feature_name: 'hour_of_day_18', attribution_value: 0.19, direction: 'RISK_INCREASING' },
  ],
  model_version: 'AccidentRiskClassifier-LGBM-v1.4 [MOCK FIXTURE]',
  epistemic_disclaimer: 'DISCLAIMER: This explanation reflects feature importance within the predictive model based on historical correlations. It does NOT establish physical causation.',
};

export const MOCK_AIR_QUALITY: AirQualityRecord[] = [
  { id: 1, station_id: 'EPA_17031_0001', station_name: 'Cook County Central Station', recorded_at: new Date().toISOString(), aqi: 53.5, pm25: 14.2, pm10: 28.5, no2: 18.2, o3: 24.1, temperature_c: 19.5, humidity_pct: 58.0, created_at: new Date().toISOString() },
  { id: 2, station_id: 'EPA_17031_0014', station_name: 'South Loop Air Lab', recorded_at: new Date().toISOString(), aqi: 62.0, pm25: 18.5, pm10: 34.0, no2: 22.0, o3: 20.4, temperature_c: 20.0, humidity_pct: 54.0, created_at: new Date().toISOString() },
  { id: 3, station_id: 'CPCB_CAAQMS_04', station_name: 'Regional Sensor Grid B', recorded_at: new Date().toISOString(), aqi: 45.0, pm25: 11.0, pm10: 22.0, no2: 15.0, o3: 26.5, temperature_c: 21.0, humidity_pct: 50.0, created_at: new Date().toISOString() },
];

export const MOCK_ANOMALIES: AnomalyRecord[] = [
  { id: 1, segment_id: 204, street_name: 'Ashland Ave', detected_at: new Date().toISOString(), observed_value: 8.2, expected_value: 24.5, residual_z_score: -3.85, anomaly_score: 0.92, anomaly_type: 'UNEXPECTED_SEVERE_CONGESTION', is_confirmed: false },
  { id: 2, segment_id: 315, street_name: 'Western Ave', detected_at: new Date().toISOString(), observed_value: 9.5, expected_value: 26.0, residual_z_score: -3.42, anomaly_score: 0.88, anomaly_type: 'UNEXPECTED_SLOWDOWN', is_confirmed: false },
];

export const MOCK_GEOJSON_HEXAGONS: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[ -87.6273, 41.8827 ], [ -87.6253, 41.8862 ], [ -87.6213, 41.8862 ], [ -87.6193, 41.8827 ], [ -87.6213, 41.8792 ], [ -87.6253, 41.8792 ], [ -87.6273, 41.8827 ]]],
      },
      properties: {
        h3_index: '882685623ffffff',
        zone_name: 'Loop Downtown',
        incident_count: 18,
        traffic_exposure: 2500,
        raw_rate: 0.0072,
        eb_smoothed_rate: 0.0084,
        is_sparse_exposure: false,
        risk_tier: 'CRITICAL',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[ -87.6290, 41.8950 ], [ -87.6270, 41.8985 ], [ -87.6230, 41.8985 ], [ -87.6210, 41.8950 ], [ -87.6230, 41.8915 ], [ -87.6270, 41.8915 ], [ -87.6290, 41.8950 ]]],
      },
      properties: {
        h3_index: '882685625ffffff',
        zone_name: 'Near North',
        incident_count: 12,
        traffic_exposure: 1800,
        raw_rate: 0.0066,
        eb_smoothed_rate: 0.0071,
        is_sparse_exposure: false,
        risk_tier: 'HIGH',
      },
    },
  ],
};

export const MOCK_SYSTEM_HEALTH: HealthCheckData = {
  status: 'HEALTHY',
  version: '1.0.0',
  environment: 'development [OFFLINE FIXTURE]',
  uptime_seconds: 3600.0,
  timestamp_utc: new Date().toISOString(),
  components: {
    database: { status: 'HEALTHY', details: { dialect: 'sqlite', pool_status: 'connected' } },
    traffic_forecaster_model: { status: 'HEALTHY', details: { model: 'QuantileForecaster', version: 'v2.1' } },
    accident_risk_model: { status: 'HEALTHY', details: { model: 'AccidentRiskClassifier', version: 'v1.4' } },
    aqi_forecaster_model: { status: 'HEALTHY', details: { model: 'AQIForecaster', version: 'v1.3' } },
    anomaly_detector_model: { status: 'HEALTHY', details: { model: 'UrbanAnomalyDetector', version: 'v1.0' } },
  },
};
