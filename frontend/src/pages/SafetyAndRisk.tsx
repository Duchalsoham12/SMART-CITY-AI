import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { AccidentRecord, AccidentRiskScore } from '../types/api';
import { FilterBar } from '../components/common/FilterBar';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EpistemicNotice } from '../components/common/EpistemicNotice';

export const SafetyAndRisk: React.FC = () => {
  const [accidents, setAccidents] = useState<AccidentRecord[]>([]);
  const [riskTierFilter, setRiskTierFilter] = useState('');
  const [riskResult, setRiskResult] = useState<AccidentRiskScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Risk Simulator Input State
  const [simWeather, setSimWeather] = useState('RAIN');
  const [simLighting, setSimLighting] = useState('DUSK');
  const [simSpeedRatio, setSimSpeedRatio] = useState(0.45);
  const [simHour, setSimHour] = useState(18);

  const fetchAccidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getAccidents(1, 20, riskTierFilter);
      setAccidents(res.items);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch crash records');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreRisk = async () => {
    try {
      setScoring(true);
      const res = await ApiClient.scoreCrashRisk({
        latitude: 41.8827,
        longitude: -87.6233,
        weather_condition: simWeather,
        lighting_condition: simLighting,
        speed_ratio_to_freeflow: simSpeedRatio,
        hour_of_day: simHour,
      });
      setRiskResult(res);
    } catch (err: any) {
      console.error('Risk scoring failed:', err);
    } finally {
      setScoring(false);
    }
  };

  useEffect(() => {
    fetchAccidents();
  }, [riskTierFilter]);

  useEffect(() => {
    handleScoreRisk();
  }, []);

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <FilterBar
        searchQuery=""
        onSearchChange={() => {}}
        searchPlaceholder="Showing verified vision crash records..."
        selectedCategory={riskTierFilter}
        onCategoryChange={setRiskTierFilter}
        categories={[
          { label: 'Critical Severity', value: 'CRITICAL' },
          { label: 'High Severity', value: 'HIGH' },
          { label: 'Medium Severity', value: 'MEDIUM' },
          { label: 'Low Severity', value: 'LOW' },
        ]}
        onReset={() => setRiskTierFilter('')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Risk Assessment Simulator & SHAP Bar Card */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-1">Intersection Risk Scoring Simulator</h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Simulate weather, lighting, and congestion parameters to evaluate safety risk score via LightGBM.
            </p>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Weather Condition</label>
                <select
                  value={simWeather}
                  onChange={(e) => setSimWeather(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="CLEAR">Clear Nominal</option>
                  <option value="RAIN">Rain / Wet Pavement</option>
                  <option value="SNOW">Snow / Ice Accumulation</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Lighting Condition</label>
                <select
                  value={simLighting}
                  onChange={(e) => setSimLighting(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="DAYLIGHT">Daylight</option>
                  <option value="DUSK">Dusk / Twilight</option>
                  <option value="DARKNESS">Darkness (Streetlights Unlit)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Speed Ratio to Freeflow</span>
                  <span className="font-mono text-white">{simSpeedRatio.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.2"
                  step="0.05"
                  value={simSpeedRatio}
                  onChange={(e) => setSimSpeedRatio(parseFloat(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Hour of Day</span>
                  <span className="font-mono text-white">{simHour}:00</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  step="1"
                  value={simHour}
                  onChange={(e) => setSimHour(parseInt(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <button
                onClick={handleScoreRisk}
                disabled={scoring}
                className="w-full mt-2 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {scoring ? 'Scoring Risk...' : 'Evaluate Crash Risk & SHAP Attributions'}
              </button>
            </div>

            {/* Inference Result Card */}
            {riskResult && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider">Estimated Crash Risk</span>
                  <div className="text-3xl font-extrabold text-rose-400 font-mono mt-1">
                    {riskResult.predicted_risk_score.toFixed(2)}
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTierBadge(riskResult.risk_tier)}`}>
                      {riskResult.risk_tier} RISK TIER
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-mono text-slate-400">
                    90% CI: [{riskResult.uncertainty_interval[0].toFixed(2)}, {riskResult.uncertainty_interval[1].toFixed(2)}]
                  </div>
                </div>

                {/* SHAP Attributions */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Key Predictive Feature Attributions (SHAP)
                  </span>
                  <div className="space-y-2">
                    {riskResult.top_contributing_features.map((feat, i) => (
                      <div key={i} className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono text-slate-300 text-[11px]">{feat.feature_name}</span>
                          <span
                            className={`font-mono text-xs font-bold ${
                              feat.attribution_value > 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {feat.attribution_value > 0 ? `+${feat.attribution_value.toFixed(2)}` : feat.attribution_value.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${feat.attribution_value > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, Math.abs(feat.attribution_value) * 250)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <EpistemicNotice
            customText="DISCLAIMER: This explanation reflects feature importance within the predictive model based on historical correlations. It does NOT establish physical causation."
            sourceCitation="[Source: City of Chicago Traffic Crashes via AccidentRiskClassifier-LGBM-v1.4]"
          />
        </div>

        {/* Historical Incident Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Verified Crash Incident Records</h3>
              <p className="text-[11px] text-slate-400">Geocoded accident logs with automatic H3 spatial binning</p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {accidents.length} incidents
            </span>
          </div>

          {loading ? (
            <LoadingState message="Querying PostgreSQL incident database..." />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchAccidents} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Record ID</th>
                    <th className="py-3 px-4">Crash Date</th>
                    <th className="py-3 px-4">H3 Index</th>
                    <th className="py-3 px-4">Injuries / Fatalities</th>
                    <th className="py-3 px-4">Conditions</th>
                    <th className="py-3 px-4">Severity Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {accidents.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{acc.crash_record_id}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(acc.crash_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-teal-400 text-[11px]">{acc.h3_index}</td>
                      <td className="py-3 px-4 font-bold">
                        {acc.injuries_total} inj &bull; {acc.fatalities_total} fat
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {acc.weather_condition} &bull; {acc.lighting_condition}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTierBadge(acc.risk_tier)}`}>
                          {acc.risk_tier || 'LOW'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
