import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { AnomalyDetectionResult, AnomalyRecord } from '../types/api';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EpistemicNotice } from '../components/common/EpistemicNotice';

export const AnomalyDetectionPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Anomaly Scoring Simulator
  const [simSegment] = useState(204);
  const [simStreet, setSimStreet] = useState('Ashland Ave');
  const [simObserved, setSimObserved] = useState(8.2);
  const [simExpected, setSimExpected] = useState(24.5);
  const [simResult, setSimResult] = useState<AnomalyDetectionResult | null>(null);
  const [scoring, setScoring] = useState(false);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getAnomalies(1, 20);
      setAnomalies(res.items);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch detected anomalies');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreAnomaly = async () => {
    setScoring(true);
    try {
      // In live mode or mock fallback, call API
      const res = await fetch('http://localhost:8000/api/v1/anomalies/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'analyst_smartcity_secret_key_2026',
        },
        body: JSON.stringify({
          segment_id: simSegment,
          street_name: simStreet,
          observed_speed_mph: simObserved,
          expected_speed_mph: simExpected,
          bus_count: 5,
          hour_of_day: 14,
        }),
      }).then((r) => r.json());
      setSimResult(res);
    } catch (err) {
      // Fallback calculation for offline fixture
      const residual = simObserved - simExpected;
      const z = residual / 4.5;
      const isAnom = Math.abs(z) >= 2.5;
      setSimResult({
        segment_id: simSegment,
        street_name: simStreet,
        is_anomaly: isAnom,
        residual_z_score: parseFloat(z.toFixed(2)),
        anomaly_score: isAnom ? 0.92 : 0.15,
        anomaly_type: isAnom ? (z < 0 ? 'UNEXPECTED_SEVERE_CONGESTION' : 'ELEVATED_FLOW') : 'NONE',
        severity: isAnom ? 'SEVERE_ANOMALY' : 'NORMAL',
        action_recommendation: isAnom
          ? 'Trigger immediate signal optimization and field inspection.'
          : 'Traffic flow is within nominal bounds.',
      });
    } finally {
      setScoring(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
    handleScoreAnomaly();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-semibold text-teal-400 uppercase tracking-wider block mb-1">
            Unsupervised Anomaly Detection Stream
          </span>
          <h3 className="text-base font-bold text-white">Isolation Forest &amp; Residual Z-Score Outlier Engine</h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Detects sensor telemetry dropouts, reverse flow anomalies, and unpredicted congestion gridlock
            exceeding $|Z| \ge 2.50\sigma$ without requiring labeled training datasets.
          </p>
        </div>
        <div className="text-right font-mono text-xs text-slate-400 shrink-0">
          <div className="text-rose-400 font-bold">Z-Threshold: &ge; 2.50&sigma;</div>
          <div className="text-[11px] text-slate-500">Contamination Prior: 0.03</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly Simulator Controls */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-1">Telemetry Anomaly Scorer</h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Submit observed vs expected speed to score deviation in real-time.
            </p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Corridor Segment</label>
                <input
                  type="text"
                  value={simStreet}
                  onChange={(e) => setSimStreet(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Observed Speed</span>
                  <span className="font-mono text-white">{simObserved.toFixed(1)} mph</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="45"
                  step="0.5"
                  value={simObserved}
                  onChange={(e) => setSimObserved(parseFloat(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Expected Baseline Speed</span>
                  <span className="font-mono text-white">{simExpected.toFixed(1)} mph</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  step="0.5"
                  value={simExpected}
                  onChange={(e) => setSimExpected(parseFloat(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <button
                onClick={handleScoreAnomaly}
                disabled={scoring}
                className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {scoring ? 'Scoring...' : 'Evaluate Telemetry Anomaly'}
              </button>
            </div>

            {simResult && (
              <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider">Residual Z-Score</span>
                  <div
                    className={`text-3xl font-extrabold font-mono mt-1 ${
                      simResult.is_anomaly ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {simResult.residual_z_score.toFixed(2)} &sigma;
                  </div>
                  <div className="mt-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        simResult.is_anomaly
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {simResult.severity}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Prescribed Municipal Action</span>
                  <p className="text-slate-200 text-xs">{simResult.action_recommendation}</p>
                </div>
              </div>
            )}
          </div>

          <EpistemicNotice
            temporalClassification="HISTORICAL_OBSERVATION"
            sourceCitation="[Source: SmartCityAI Anomaly Stream via IsolationForest-v1.0]"
          />
        </div>

        {/* Historical Anomaly Events Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Detected Urban Anomalies Log</h3>
              <p className="text-[11px] text-slate-400">Events exceeding 2.50&sigma; deviation threshold</p>
            </div>
            <span className="text-xs font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
              {anomalies.length} Flagged
            </span>
          </div>

          {loading ? (
            <LoadingState message="Scanning real-time anomaly event log..." />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchAnomalies} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Segment</th>
                    <th className="py-3 px-4">Corridor</th>
                    <th className="py-3 px-4">Observed vs Expected</th>
                    <th className="py-3 px-4">Z-Score</th>
                    <th className="py-3 px-4">Anomaly Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {anomalies.map((anom) => (
                    <tr key={anom.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{anom.segment_id}</td>
                      <td className="py-3 px-4 font-medium text-white">{anom.street_name}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className="text-rose-400 font-bold">{anom.observed_value.toFixed(1)}</span>
                        <span className="text-slate-500"> vs </span>
                        <span className="text-slate-300">{anom.expected_value.toFixed(1)} mph</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-400">
                        {anom.residual_z_score.toFixed(2)} &sigma;
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          {anom.anomaly_type}
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
