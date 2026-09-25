import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { TrafficForecast, TrafficRecord } from '../types/api';
import { FilterBar } from '../components/common/FilterBar';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { EpistemicNotice } from '../components/common/EpistemicNotice';

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
      {/* Top Controls */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filter by corridor (e.g. Michigan, Halsted, State)..."
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
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Active Arterial Corridors</h3>
                <p className="text-[11px] text-slate-400">Click any segment to trigger real-time quantile forecasting</p>
              </div>
              <span className="text-xs font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
                {records.length} segments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Segment</th>
                    <th className="py-3 px-4">Corridor Name</th>
                    <th className="py-3 px-4">Speed</th>
                    <th className="py-3 px-4">Historical Baseline</th>
                    <th className="py-3 px-4">Bus Flow</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {records.map((rec) => {
                    const isSelected = selectedRecord?.segment_id === rec.segment_id;
                    const isCongested = rec.speed_mph <= 15.0;
                    return (
                      <tr
                        key={rec.id}
                        onClick={() => handleSelectRecord(rec)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-teal-500/10 text-white' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-slate-400">{rec.segment_id}</td>
                        <td className="py-3 px-4 font-medium text-white">{rec.street_name}</td>
                        <td className="py-3 px-4 font-bold font-mono">
                          {rec.speed_mph.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">mph</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {rec.historical_speed_mph ? `${rec.historical_speed_mph.toFixed(1)} mph` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{rec.bus_count} transit units</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              isCongested
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Corridor Speed Forecast
                </span>
                {forecasting && <span className="text-xs text-teal-400 animate-pulse font-mono">Inferring...</span>}
              </div>

              {selectedRecord && (
                <div className="mb-4 pb-3 border-b border-slate-800">
                  <div className="text-base font-bold text-white">{selectedRecord.street_name}</div>
                  <div className="text-xs text-slate-400 font-mono">Segment #{selectedRecord.segment_id}</div>
                </div>
              )}

              {/* Forecast Horizon Selector */}
              <div className="mb-4">
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                  Forecast Horizon
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 3, 6].map((h) => (
                    <button
                      key={h}
                      onClick={() => handleHorizonChange(h)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        horizon === h
                          ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      +{h} Hour{h > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {forecast ? (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider">Median Speed Expectation (q0.50)</span>
                    <div className="text-3xl font-extrabold text-teal-400 font-mono mt-1">
                      {forecast.predicted_speed_mph.toFixed(1)} <span className="text-sm font-normal text-slate-400">mph</span>
                    </div>
                    <div className="mt-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 py-1 px-2 rounded border border-cyan-800/40 inline-block">
                      90% CI: [{forecast.quantile_05.toFixed(1)}, {forecast.quantile_95.toFixed(1)}] mph
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Congestion Tier</span>
                      <span className="font-bold text-white text-sm">{forecast.congestion_level}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Model Version</span>
                      <span className="font-mono text-slate-300 text-[11px] truncate block">
                        {forecast.model_version.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-6">Select a segment to view forecast</div>
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
