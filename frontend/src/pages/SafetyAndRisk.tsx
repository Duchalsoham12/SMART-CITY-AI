import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { AccidentRecord, AccidentRiskScore } from '../types/api';
import { FilterBar } from '../components/common/FilterBar';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EpistemicNotice } from '../components/common/EpistemicNotice';
import { ShieldAlert, Sliders, Activity, Zap } from 'lucide-react';

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
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800/80">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-semibold text-rose-400 uppercase tracking-wider">
                Public Safety &bull; H3 Spatial Grid Binning
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20">
                TreeSHAP Grounded
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Vision Zero Crash Risk &amp; Hazard Intelligence</h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Evaluates traffic exposure, weather interaction, and historical incident frequency to predict spatial accident hazards and explain feature attributions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
            Empirical Bayes Smoothed
          </span>
        </div>
      </div>

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
          <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800/80">
              <Sliders className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Intersection Risk Simulator</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Simulate weather, lighting, and congestion parameters to evaluate safety risk score via LightGBM.
            </p>

            <div className="space-y-3.5 text-xs mb-5">
              <div>
                <label className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1.5">Weather Condition</label>
                <select
                  value={simWeather}
                  onChange={(e) => setSimWeather(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors font-medium"
                >
                  <option value="CLEAR">Clear Nominal</option>
                  <option value="RAIN">Rain / Wet Pavement</option>
                  <option value="SNOW">Snow / Ice Accumulation</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1.5">Lighting Condition</label>
                <select
                  value={simLighting}
                  onChange={(e) => setSimLighting(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors font-medium"
                >
                  <option value="DAYLIGHT">Daylight</option>
                  <option value="DUSK">Dusk / Twilight</option>
                  <option value="DARKNESS">Darkness (Streetlights Unlit)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1.5">
                  <span className="font-medium uppercase tracking-wider">Speed Ratio to Freeflow</span>
                  <span className="font-mono text-teal-300 font-bold">{simSpeedRatio.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.2"
                  step="0.05"
                  value={simSpeedRatio}
                  onChange={(e) => setSimSpeedRatio(parseFloat(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1.5">
                  <span className="font-medium uppercase tracking-wider">Hour of Day</span>
                  <span className="font-mono text-teal-300 font-bold">{simHour}:00</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  step="1"
                  value={simHour}
                  onChange={(e) => setSimHour(parseInt(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              <button
                onClick={handleScoreRisk}
                disabled={scoring}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                {scoring ? 'Scoring Risk...' : 'Evaluate Crash Risk & SHAP Attributions'}
              </button>
            </div>

            {/* Inference Result Card */}
            {riskResult && (
              <div className="space-y-4 pt-4 border-t border-slate-800/80">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600"></div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Estimated Crash Risk Index</span>
                  <div className="text-3xl font-extrabold text-rose-400 font-mono mt-1">
                    {riskResult.predicted_risk_score.toFixed(2)}
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTierBadge(riskResult.risk_tier)}`}>
                      {riskResult.risk_tier} RISK TIER
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-mono text-slate-400">
                    90% CI: [{riskResult.uncertainty_interval[0].toFixed(2)}, {riskResult.uncertainty_interval[1].toFixed(2)}]
                  </div>
                </div>

                {/* SHAP Attributions */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                    Key Predictive Feature Attributions (SHAP)
                  </span>
                  <div className="space-y-2">
                    {riskResult.top_contributing_features.map((feat, i) => (
                      <div key={i} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-mono text-slate-300 text-[11px] font-medium">{feat.feature_name}</span>
                          <span
                            className={`font-mono text-xs font-bold ${
                              feat.attribution_value > 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {feat.attribution_value > 0 ? `+${feat.attribution_value.toFixed(2)}` : feat.attribution_value.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${feat.attribution_value > 0 ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
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
        <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden flex flex-col border border-slate-800/80">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Verified Crash Incident Records</h3>
                <p className="text-[11px] text-slate-400">Geocoded accident logs with automatic Uber H3 spatial binning</p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-800">
              {accidents.length} incidents recorded
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
                    <th className="py-3 px-4">Conditions</th>
                    <th className="py-3 px-4">Injuries</th>
                    <th className="py-3 px-4">Risk Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {accidents.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 font-semibold">{acc.crash_record_id.slice(0, 10)}...</td>
                      <td className="py-3 px-4 text-slate-300">{acc.crash_date ? new Date(acc.crash_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3 px-4 font-mono text-teal-400">{acc.h3_index || '882685623ffffff'}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {acc.weather_condition} &bull; {acc.lighting_condition}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono">
                        <span className={acc.injuries_total > 0 ? 'text-rose-400' : 'text-slate-400'}>
                          {acc.injuries_total} inj
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTierBadge(acc.risk_tier)}`}>
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
