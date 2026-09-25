import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient, setLiveMode, getLiveMode } from '../services/apiClient';

describe('ApiClient Service & Data Modes', () => {
  beforeEach(() => {
    setLiveMode(false); // Test offline mock fixtures mode
  });

  it('toggles live mode flag properly', () => {
    expect(getLiveMode()).toBe(false);
    setLiveMode(true);
    expect(getLiveMode()).toBe(true);
    setLiveMode(false);
    expect(getLiveMode()).toBe(false);
  });

  it('fetches offline city health summary in mock mode with non-null values', async () => {
    const summary = await ApiClient.getCitySummary();
    expect(summary).toBeDefined();
    expect(summary.city_name).toContain('OFFLINE MOCK FIXTURE');
    expect(summary.active_traffic_congestion_zones).toBeGreaterThanOrEqual(0);
    expect(summary.overall_urban_stress_index).toBeGreaterThanOrEqual(0);
    expect(summary.overall_urban_stress_index).toBeLessThanOrEqual(1);
  });

  it('returns valid paginated traffic records with realistic speeds', async () => {
    const response = await ApiClient.getTrafficRecords(1, 10);
    expect(response.items).toBeDefined();
    expect(response.items.length).toBeGreaterThan(0);
    expect(response.total_count).toBeGreaterThan(0);
    response.items.forEach((item) => {
      expect(item.speed_mph).toBeGreaterThan(0);
      expect(item.speed_mph).toBeLessThan(120);
      expect(item.street_name).toBeDefined();
    });
  });

  it('returns valid 3-class crash risk prediction in offline mode', async () => {
    const risk = await ApiClient.scoreCrashRisk({
      latitude: 18.5204,
      longitude: 73.8567,
      weather_condition: 'RAIN',
      lighting_condition: 'DUSK',
      speed_ratio_to_freeflow: 0.45,
      hour_of_day: 18,
    });

    expect(risk).toBeDefined();
    expect(risk.predicted_risk_score).toBeGreaterThanOrEqual(0);
    expect(risk.predicted_risk_score).toBeLessThanOrEqual(1);
    expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(risk.risk_tier);
    expect(risk.uncertainty_interval.length).toBe(2);
    expect(risk.top_contributing_features.length).toBeGreaterThan(0);
  });
});
