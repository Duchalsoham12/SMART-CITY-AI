/**
 * SmartCityAI - API Client Service
 * Connects directly to the FastAPI backend endpoints with authentication.
 * Supports toggling between Live Backend API and Offline Mock Fixtures.
 */

import {
  AccidentRecord,
  AccidentRiskScore,
  AirQualityRecord,
  AnomalyRecord,
  AQIForecast,
  AssistantQueryResponse,
  CityHealthSummary,
  GeoJSONFeatureCollection,
  HealthCheckData,
  PaginatedResponse,
  TrafficForecast,
  TrafficRecord,
} from '../types/api';
import * as mock from './mockData';

// Configuration
export const API_BASE_URL = 'http://localhost:8000/api/v1';
export const DEFAULT_API_KEY = 'viewer_smartcity_public_key_2026';

// State flag for Live vs Offline
let isLiveMode = true;

export const setLiveMode = (enabled: boolean) => {
  isLiveMode = enabled;
};

export const getLiveMode = () => isLiveMode;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-API-Key': DEFAULT_API_KEY,
});

async function apiFetch<T>(endpoint: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  if (!isLiveMode && fallbackData !== undefined) {
    // Artificial small delay for realistic offline UI feel
    await new Promise((r) => setTimeout(r, 150));
    return fallbackData;
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    if (fallbackData !== undefined) {
      console.warn(`[SmartCityAI] Live API call to ${endpoint} failed. Falling back to offline fixture:`, err);
      return fallbackData;
    }
    throw err;
  }
}

export const ApiClient = {
  // 1. Health & Overview
  getHealth: () => apiFetch<HealthCheckData>('/health', {}, mock.MOCK_SYSTEM_HEALTH),
  getCitySummary: () => apiFetch<CityHealthSummary>('/insights/city-summary', {}, mock.MOCK_CITY_SUMMARY),

  // 2. Traffic
  getTrafficRecords: (page = 1, pageSize = 20, streetName?: string) => {
    let url = `/traffic?page=${page}&page_size=${pageSize}`;
    if (streetName) url += `&street_name=${encodeURIComponent(streetName)}`;
    return apiFetch<PaginatedResponse<TrafficRecord>>(
      url,
      {},
      {
        items: mock.MOCK_TRAFFIC_RECORDS,
        total_count: mock.MOCK_TRAFFIC_RECORDS.length,
        page,
        page_size: pageSize,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      }
    );
  },
  forecastTraffic: (segmentId: number, currentSpeed: number, horizon = 1) =>
    apiFetch<TrafficForecast>(
      '/traffic/forecast',
      {
        method: 'POST',
        body: JSON.stringify({ segment_id: segmentId, current_speed_mph: currentSpeed, horizon_hours: horizon }),
      },
      mock.MOCK_TRAFFIC_FORECAST
    ),

  // 3. Accidents & Safety
  getAccidents: (page = 1, pageSize = 20, riskTier?: string) => {
    let url = `/accidents?page=${page}&page_size=${pageSize}`;
    if (riskTier) url += `&risk_tier=${encodeURIComponent(riskTier)}`;
    return apiFetch<PaginatedResponse<AccidentRecord>>(
      url,
      {},
      {
        items: mock.MOCK_ACCIDENTS,
        total_count: mock.MOCK_ACCIDENTS.length,
        page,
        page_size: pageSize,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      }
    );
  },
  scoreCrashRisk: (payload: { latitude: number; longitude: number; weather_condition: string; lighting_condition: string; speed_ratio_to_freeflow: number; hour_of_day: number }) =>
    apiFetch<AccidentRiskScore>(
      '/accidents/score-risk',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      mock.MOCK_RISK_SCORE
    ),

  // 4. Environmental Intelligence
  getAirQualityRecords: (page = 1, pageSize = 20) =>
    apiFetch<PaginatedResponse<AirQualityRecord>>(
      `/environment?page=${page}&page_size=${pageSize}`,
      {},
      {
        items: mock.MOCK_AIR_QUALITY,
        total_count: mock.MOCK_AIR_QUALITY.length,
        page,
        page_size: pageSize,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      }
    ),
  forecastAirQuality: (stationId: string, currentAqi: number) =>
    apiFetch<AQIForecast>(
      '/environment/forecast',
      {
        method: 'POST',
        body: JSON.stringify({ station_id: stationId, current_aqi: currentAqi, horizon_hours: 24 }),
      },
      {
        station_id: stationId,
        horizon_hours: 24,
        predicted_aqi: currentAqi * 0.92,
        uncertainty_bounds: [currentAqi * 0.82, currentAqi * 1.05],
        pollutant_breakdown: { pm25: 18.2, pm10: 36.4, no2: 21.0, o3: 19.5 },
        air_quality_category: 'MODERATE',
        model_version: 'AQIForecaster-XGBoost-v1.3',
      }
    ),

  // 5. Anomalies
  getAnomalies: (page = 1, pageSize = 20) =>
    apiFetch<PaginatedResponse<AnomalyRecord>>(
      `/anomalies?page=${page}&page_size=${pageSize}`,
      {},
      {
        items: mock.MOCK_ANOMALIES,
        total_count: mock.MOCK_ANOMALIES.length,
        page,
        page_size: pageSize,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      }
    ),

  // 6. Geospatial
  getHexagonalRiskGrid: (minRisk = 0.0) =>
    apiFetch<GeoJSONFeatureCollection>(`/geospatial/hexagons?min_risk=${minRisk}`, {}, mock.MOCK_GEOJSON_HEXAGONS),
  getSpatialHotspots: () =>
    apiFetch<GeoJSONFeatureCollection>('/geospatial/hotspots', {}, {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-87.6233, 41.8827] },
          properties: { cluster_id: 0, severity_label: 'CRITICAL_CONGESTION_HOTSPOT', incident_count: 8, z_score: 3.45 },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-87.6250, 41.8950] },
          properties: { cluster_id: 1, severity_label: 'HIGH_CRASH_CORRIDOR', incident_count: 5, z_score: 2.82 },
        },
      ],
    }),

  // 7. AI Assistant
  askAssistant: (queryText: string) =>
    apiFetch<AssistantQueryResponse>('/insights/ask', {
      method: 'POST',
      body: JSON.stringify({ query_text: queryText, session_id: 'dashboard_session' }),
    }),
};
