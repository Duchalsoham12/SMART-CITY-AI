import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { TrafficForecast, TrafficRecord } from '../types/api';
import { FilterBar } from '../components/common/FilterBar';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { EpistemicNotice } from '../components/common/EpistemicNotice';
import { Navigation, Activity, TrendingUp, Gauge, Zap, ChevronRight, Clock } from 'lucide-react';

export const TrafficIntelligence: React.FC = () => {
  const [records, setRecords] = useState<TrafficRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<TrafficRecord | null>(null);
  const [forecast, setForecast] = useState<TrafficForecast | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [horizon, setHorizon] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [forecasting, setForecasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTraffic = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getTrafficRecords(1, 50, searchQuery);
      setRecords(res.items);
      if (res.items.length > 0 && !selectedRecord) {
        setSelectedRecord(res.items[0]);
        runForecast(res.items[0], horizon);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch traffic records');
    } finally {
      setLoading(false);
    }
  };

  const runForecast = async (record: TrafficRecord, horizonHours: number) => {
    try {
      setForecasting(true);
      const fc = await ApiClient.forecastTraffic(record.segment_id, record.speed_mph, horizonHours);
      setForecast(fc);
    } catch (err: any) {
      console.error('Forecast failed:', err);
    } finally {
      setForecasting(false);
    }
  };

  useEffect(() => {
    fetchTraffic();
  }, [searchQuery]);

  const handleSelectRecord = (rec: TrafficRecord) => {
    setSelectedRecord(rec);
    runForecast(rec, horizon);
  };

  const handleHorizonChange = (h: number) => {
    setHorizon(h);
    if (selectedRecord) {
      runForecast(selectedRecord, h);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800/80">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-semibold text-teal-400 uppercase tracking-wider">
                Corridor Telemetry &amp; Quantile Forecasting
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-teal-500/10 text-teal-300 border border-teal-500/20">
                LightGBM Pinball
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Active Arterial Network Operations</h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Real-time vehicle loop sensor telemetry linked to quantile regression models ($q_{0.05}, q_{0.50}, q_{0.95}$) to establish non-crossing uncertainty envelopes across critical city corridors.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Sensors: {records.length} Online
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filter by corridor (e.g. Michigan, Halsted, State, Ashland)..."
        onReset={() => setSearchQuery('')}
      />

      {loading ? (
        <LoadingState message="Fetching live corridor telemetry and vehicle loop sensor feeds..." />
      ) : error ? (
        <ErrorState error={error} onRetry={fetchTraffic} />
      ) : records.length === 0 ? (
        <EmptyState title="No Traffic Corridors Match Query" onReset={() => setSearchQuery('')} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Corridor Telemetry Table */}
          <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden flex flex-col border border-slate-800/80">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Live Segment Readings</h3>
              </div>
              <span className="text-xs font-mono text-teal-400 bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-800/40">
                {records.length} segments reported
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Segment</th>
                    <th className="py-3 px-4">Corridor Name</th>
                    <th className="py-3 px-4">Observed Speed</th>
                    <th className="py-3 px-4">Historical Baseline</th>
                    <th className="py-3 px-4">Bus Flow</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {records.map((rec) => {
                    const isSelected = selectedRecord?.segment_id === rec.segment_id;
                    const isCongested = rec.speed_mph <= 15.0;
                    return (
                      <tr
                        key={rec.id}
                        onClick={() => handleSelectRecord(rec)}
                        className={`cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'bg-teal-500/10 text-white border-l-2 border-teal-400'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-slate-400 font-semibold">#{rec.segment_id}</td>
                        <td className="py-3 px-4 font-medium text-white flex items-center gap-1.5">
                          {rec.street_name}
                          {isSelected && <ChevronRight className="w-3.5 h-3.5 text-teal-400 ml-auto" />}
                        </td>
                        <td className="py-3 px-4 font-bold font-mono text-slate-100">
                          {rec.speed_mph.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">mph</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {rec.historical_speed_mph ? `${rec.historical_speed_mph.toFixed(1)} mph` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{rec.bus_count} units</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isCongested
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCongested ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                            />
                            {isCongested ? 'ELEVATED SLOWDOWN' : 'NOMINAL FLOW'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drill-down Quantile Forecasting Card */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Corridor Speed Forecast
                  </span>
                </div>
                {forecasting && (
                  <span className="text-xs text-teal-400 animate-pulse font-mono flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Inferring...
                  </span>
                )}
              </div>

              {selectedRecord ? (
                <div className="mb-4">
                  <div className="text-base font-bold text-white tracking-tight">{selectedRecord.street_name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">Segment #{selectedRecord.segment_id} &bull; Lat 41.8827, Lon -87.6233</div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic mb-4">Select a corridor to view live forecast</div>
              )}

              {/* Forecast Horizon Selector */}
              <div className="mb-5">
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Prediction Horizon
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 3, 6].map((h) => (
                    <button
                      key={h}
                      onClick={() => handleHorizonChange(h)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        horizon === h
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white border-teal-400 shadow-lg shadow-teal-500/20'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      +{h} Hour{h > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {forecast ? (
                <div className="space-y-4">
                  {/* Gauge Display */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-indigo-500"></div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                      Median Expected Velocity ($q_{0.50}$)
                    </span>
                    <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-200 to-emerald-300 font-mono mt-1">
                      {forecast.predicted_speed_mph.toFixed(1)} <span className="text-sm font-normal text-slate-400">mph</span>
                    </div>
                    <div className="mt-2 text-xs font-mono text-cyan-300 bg-cyan-950/60 py-1 px-3 rounded-full border border-cyan-800/40 inline-flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-cyan-400" />
                      90% CI: [{forecast.quantile_05.toFixed(1)}, {forecast.quantile_95.toFixed(1)}] mph
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px] mb-1">Congestion Tier</span>
                      <span className="font-bold text-white text-sm tracking-tight">{forecast.congestion_level}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px] mb-1">Model Version</span>
                      <span className="font-mono text-slate-300 text-[11px] truncate block" title={forecast.model_version}>
                        {forecast.model_version.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-8">Select a segment to view forecast</div>
              )}
            </div>

            <EpistemicNotice
              temporalClassification="MODEL_PREDICTION"
              sourceCitation="[Source: Chicago Traffic Tracker via TrafficForecaster-QuantileLGBM-v2.1]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
