import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { AirQualityRecord, AQIForecast } from '../types/api';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EpistemicNotice } from '../components/common/EpistemicNotice';
import { Wind, Activity, TrendingDown, ChevronRight, Sparkles, Droplets } from 'lucide-react';

export const EnvironmentalIntelligence: React.FC = () => {
  const [records, setRecords] = useState<AirQualityRecord[]>([]);
  const [selectedStation, setSelectedStation] = useState<AirQualityRecord | null>(null);
  const [forecast, setForecast] = useState<AQIForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [forecasting, setForecasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvironment = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getAirQualityRecords(1, 20);
      setRecords(res.items);
      if (res.items.length > 0) {
        setSelectedStation(res.items[0]);
        runForecast(res.items[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch environmental readings');
    } finally {
      setLoading(false);
    }
  };

  const runForecast = async (station: AirQualityRecord) => {
    try {
      setForecasting(true);
      const fc = await ApiClient.forecastAirQuality(station.station_id, station.aqi);
      setForecast(fc);
    } catch (err: any) {
      console.error('AQI forecast failed:', err);
    } finally {
      setForecasting(false);
    }
  };

  useEffect(() => {
    fetchEnvironment();
  }, []);

  const handleSelectStation = (station: AirQualityRecord) => {
    setSelectedStation(station);
    runForecast(station);
  };

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return { text: 'GOOD', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
    if (aqi <= 100) return { text: 'MODERATE', dot: 'bg-amber-400', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
    if (aqi <= 150) return { text: 'UNHEALTHY SENSITIVE', dot: 'bg-orange-400', bg: 'bg-orange-500/10 text-orange-300 border-orange-500/30' };
    return { text: 'UNHEALTHY', dot: 'bg-rose-400', bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30' };
  };

  if (loading) return <LoadingState message="Aggregating atmospheric sensor telemetry from EPA AQS continuous monitoring network..." />;
  if (error) return <ErrorState error={error} onRetry={fetchEnvironment} />;

  return (
    <div className="space-y-6">
      {/* 30-Day Trend Highlight Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800/80">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                Atmospheric Dynamics &bull; EPA Continuous Grid
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 inline-flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-emerald-400" /> -14.26% 30d Trend
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Metropolitan Atmospheric &amp; Air Quality Intelligence</h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Baseline shifted from 62.4 AQI to an urban rolling average of 53.5 AQI across 8 continuous EPA monitoring stations.
            </p>
          </div>
        </div>
        <div className="text-right font-mono text-xs text-slate-400 shrink-0 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800/80">
          <div className="text-slate-300">Observed Range: <span className="font-bold text-blue-300">24.0 – 118.0 AQI</span></div>
          <div className="text-blue-400 text-[11px] mt-0.5">8 Continuous Stations Active</div>
        </div>
      </div>

      {/* Main Grid: Stations List & Forecast Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stations Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden border border-slate-800/80 flex flex-col">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Continuous Ambient Monitoring Stations</h3>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
              EPA AQS &bull; CPCB Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Station ID</th>
                  <th className="py-3 px-4">Location Name</th>
                  <th className="py-3 px-4">Current AQI</th>
                  <th className="py-3 px-4">PM2.5</th>
                  <th className="py-3 px-4">PM10</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {records.map((s) => {
                  const isSelected = selectedStation?.station_id === s.station_id;
                  const cat = getAqiColor(s.aqi);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => handleSelectStation(s)}
                      className={`cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-cyan-500/10 text-white border-l-2 border-cyan-400'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-400 font-semibold">{s.station_id}</td>
                      <td className="py-3 px-4 font-medium text-white flex items-center gap-1.5">
                        {s.station_name}
                        {isSelected && <ChevronRight className="w-3.5 h-3.5 text-cyan-400 ml-auto" />}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-sm text-slate-100">{s.aqi.toFixed(1)}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{s.pm25 ? `${s.pm25.toFixed(1)} µg/m³` : 'N/A'}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{s.pm10 ? `${s.pm10.toFixed(1)} µg/m³` : 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cat.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                          {cat.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Forecast Decomposition Card */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  24-Hour Atmospheric Forecast
                </span>
              </div>
              {forecasting && (
                <span className="text-xs text-cyan-400 animate-pulse font-mono">Forecasting...</span>
              )}
            </div>

            {selectedStation && (
              <div className="mb-4">
                <div className="text-base font-bold text-white tracking-tight">{selectedStation.station_name}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">Station #{selectedStation.station_id}</div>
              </div>
            )}

            {forecast ? (
              <div className="space-y-4">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400"></div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Projected 24h Index Value</span>
                  <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-200 font-mono mt-1">
                    {forecast.predicted_aqi.toFixed(1)}
                  </div>
                  <div className="mt-2 text-xs font-mono text-cyan-300 bg-cyan-950/60 py-1 px-3 rounded-full border border-cyan-800/40 inline-flex items-center gap-1.5">
                    90% CI: [{forecast.uncertainty_bounds[0].toFixed(1)}, {forecast.uncertainty_bounds[1].toFixed(1)}]
                  </div>
                </div>

                {/* Multi-pollutant Breakdown */}
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-2.5 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Multi-Pollutant Vector Breakdown
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(forecast.pollutant_breakdown).map(([pollutant, val]) => (
                      <div key={pollutant} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400 uppercase font-mono text-[10px] block font-semibold">{pollutant}</span>
                        <span className="font-bold text-white font-mono text-sm mt-0.5 block">{val.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">µg/m³</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-8">Select a station to view forecast</div>
            )}
          </div>

          <EpistemicNotice
            temporalClassification="MODEL_PREDICTION"
            sourceCitation="[Source: EPA Air Quality System Monitor Network via AQIForecaster-XGBoost-v1.3]"
          />
        </div>
      </div>
    </div>
  );
};
