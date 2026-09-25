import React, { useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { AQIForecast, TrafficForecast } from '../types/api';
import { EpistemicNotice } from '../components/common/EpistemicNotice';
import { Navigation, Wind, TrendingUp, Sliders, Clock, Zap, Gauge, Droplets } from 'lucide-react';

export const ForecastingPage: React.FC = () => {
  const [domain, setDomain] = useState<'traffic' | 'aqi'>('traffic');
  const [trafficSegment, setTrafficSegment] = useState(101);
  const [trafficCurrentSpeed, setTrafficCurrentSpeed] = useState(12.5);
  const [trafficHorizon, setTrafficHorizon] = useState(1);
  const [trafficForecast, setTrafficForecast] = useState<TrafficForecast | null>({
    segment_id: 101,
    predicted_speed_mph: 11.4,
    horizon_hours: 1,
    quantile_05: 9.8,
    quantile_50: 11.4,
    quantile_95: 13.1,
    congestion_level: 'SEVERE',
    model_version: 'TrafficForecaster-QuantileLGBM-v2.1',
    inference_timestamp_utc: new Date().toISOString(),
  });

  const [aqiStation, setAqiStation] = useState('EPA_17031_0001');
  const [aqiCurrent, setAqiCurrent] = useState(53.5);
  const [aqiForecast, setAqiForecast] = useState<AQIForecast | null>({
    station_id: 'EPA_17031_0001',
    horizon_hours: 24,
    predicted_aqi: 49.2,
    uncertainty_bounds: [43.0, 56.5],
    pollutant_breakdown: { pm25: 14.5, pm10: 29.0, no2: 17.5, o3: 21.0 },
    air_quality_category: 'GOOD',
    model_version: 'AQIForecaster-XGBoost-v1.3',
  });

  const [loading, setLoading] = useState(false);

  const handleTrafficForecast = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.forecastTraffic(trafficSegment, trafficCurrentSpeed, trafficHorizon);
      setTrafficForecast(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAqiForecast = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.forecastAirQuality(aqiStation, aqiCurrent);
      setAqiForecast(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800/80">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-wider">
                Multi-Horizon Predictive Simulation
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Pinball Loss Enforced
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Parametric Forecast Simulator &amp; Quantile Envelopes</h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Simulate traffic congestion speeds and atmospheric pollutant vectors with calibrated 90% confidence bands, mitigating over-confident point predictions.
            </p>
          </div>
        </div>

        {/* Domain Switcher */}
        <div className="flex bg-slate-950/80 border border-slate-800/80 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setDomain('traffic')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              domain === 'traffic'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Corridor Traffic
          </button>
          <button
            onClick={() => setDomain('aqi')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              domain === 'aqi'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            Atmospheric AQI
          </button>
        </div>
      </div>

      {domain === 'traffic' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800/80">
              <Sliders className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Traffic Parameters</h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Select segment, current telemetry speed, and prediction horizon for LightGBM pinball quantile loss.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1.5">Target Corridor Segment</label>
                <select
                  value={trafficSegment}
                  onChange={(e) => setTrafficSegment(parseInt(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-medium"
                >
                  <option value={101}>Segment #101 - Michigan Avenue (Downtown Loop)</option>
                  <option value={108}>Segment #108 - Halsted Street (Near West)</option>
                  <option value={142}>Segment #142 - State Street (Central Core)</option>
                  <option value={204}>Segment #204 - Ashland Avenue (Industrial)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1.5">
                  <span className="font-medium uppercase tracking-wider">Current Sensor Speed</span>
                  <span className="font-mono text-blue-300 font-bold">{trafficCurrentSpeed.toFixed(1)} mph</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="55"
                  step="0.5"
                  value={trafficCurrentSpeed}
                  onChange={(e) => setTrafficCurrentSpeed(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Forecast Horizon
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 3, 6].map((h) => (
                    <button
                      key={h}
                      onClick={() => setTrafficHorizon(h)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        trafficHorizon === h
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-white'
                      }`}
                    >
                      +{h}h
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleTrafficForecast}
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                {loading ? 'Evaluating Quantiles...' : 'Run Quantile Forecaster'}
              </button>
            </div>
          </div>

          {/* Results & Visualizer */}
          <div className="lg:col-span-2 space-y-4">
            {trafficForecast && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Quantile Speed Distribution (90% Envelope)</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Non-crossing monotonicity enforced across &alpha; = [0.05, 0.50, 0.95]</p>
                  </div>
                  <span className="text-xs font-mono text-blue-400 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-800/40 font-bold">
                    {trafficForecast.congestion_level}
                  </span>
                </div>

                {/* Quantile Interval Visual Card */}
                <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-800/80 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400 font-mono">Lower (q0.05): <strong className="text-slate-200">{trafficForecast.quantile_05.toFixed(1)} mph</strong></span>
                    <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-200 font-mono">
                      Median: {trafficForecast.predicted_speed_mph.toFixed(1)} mph
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Upper (q0.95): <strong className="text-slate-200">{trafficForecast.quantile_95.toFixed(1)} mph</strong></span>
                  </div>

                  {/* Visual Confidence Bar */}
                  <div className="relative w-full bg-slate-900 h-7 rounded-xl overflow-hidden flex items-center border border-slate-800">
                    <div
                      className="absolute bg-blue-500/25 border-l-2 border-r-2 border-blue-400 h-full transition-all duration-300"
                      style={{
                        left: `${(trafficForecast.quantile_05 / 60) * 100}%`,
                        width: `${((trafficForecast.quantile_95 - trafficForecast.quantile_05) / 60) * 100}%`,
                      }}
                    />
                    <div
                      className="absolute w-2 h-full bg-blue-400 shadow-md shadow-blue-400/50 transition-all duration-300"
                      style={{ left: `${(trafficForecast.predicted_speed_mph / 60) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>0 mph (Gridlock)</span>
                    <span>30 mph (Nominal)</span>
                    <span>60 mph (Free-flow Expressway)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block uppercase font-mono font-medium">Prediction Horizon</span>
                    <span className="font-bold text-white font-mono text-sm mt-0.5 block">+{trafficForecast.horizon_hours} Hour</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block uppercase font-mono font-medium">Uncertainty Width</span>
                    <span className="font-bold text-cyan-400 font-mono text-sm mt-0.5 block">
                      {(trafficForecast.quantile_95 - trafficForecast.quantile_05).toFixed(1)} mph
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block uppercase font-mono font-medium">Speed Differential</span>
                    <span className="font-bold text-amber-400 font-mono text-sm mt-0.5 block">
                      {(trafficForecast.predicted_speed_mph - trafficCurrentSpeed).toFixed(1)} mph
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block uppercase font-mono font-medium">Model Engine</span>
                    <span className="font-bold text-slate-300 font-mono text-[11px] truncate mt-0.5 block">LightGBM-v2.1</span>
                  </div>
                </div>
              </div>
            )}

            <EpistemicNotice
              temporalClassification="MODEL_PREDICTION"
              sourceCitation="[Source: Chicago Congestion Tracker via TrafficForecaster-QuantileLGBM-v2.1]"
            />
          </div>
        </div>
      ) : (
        /* AQI Forecasting Domain */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-5 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800/80">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Atmospheric Parameters</h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Select ambient sensor station and input parameters to predict 24h AQI and multi-pollutant vector.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1.5">Station Sensor</label>
                <select
                  value={aqiStation}
                  onChange={(e) => setAqiStation(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
                >
                  <option value="EPA_17031_0001">Cook County Central Station (EPA AQS)</option>
                  <option value="EPA_17031_0014">South Loop Air Monitoring Lab</option>
                  <option value="CPCB_CAAQMS_04">Regional Cross-City Grid B</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1.5">
                  <span className="font-medium uppercase tracking-wider">Current Baseline AQI</span>
                  <span className="font-mono text-cyan-300 font-bold">{aqiCurrent.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="250"
                  step="1"
                  value={aqiCurrent}
                  onChange={(e) => setAqiCurrent(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <button
                onClick={handleAqiForecast}
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                {loading ? 'Simulating Dispersion...' : 'Generate 24h AQI Forecast'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {aqiForecast && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">24-Hour Multi-Pollutant Forecast</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Predicted Air Quality Category: {aqiForecast.air_quality_category}</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/40 font-bold">
                    Horizon: +24h
                  </span>
                </div>

                <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-800/80 text-center space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400"></div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Projected Metro AQI</span>
                  <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-200 font-mono">
                    {aqiForecast.predicted_aqi.toFixed(1)}
                  </div>
                  <div className="text-xs font-mono text-cyan-300 bg-cyan-950/60 py-1 px-3 rounded-full border border-cyan-800/40 inline-flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-cyan-400" />
                    90% CI: [{aqiForecast.uncertainty_bounds[0].toFixed(1)}, {aqiForecast.uncertainty_bounds[1].toFixed(1)}]
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Pollutant Vector Concentration Estimates
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {Object.entries(aqiForecast.pollutant_breakdown).map(([k, v]) => (
                      <div key={k} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400 uppercase font-mono text-[10px] block font-semibold">{k}</span>
                        <span className="font-bold text-white font-mono text-base mt-0.5 block">{v.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-500 block">µg/m³</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <EpistemicNotice
              temporalClassification="MODEL_PREDICTION"
              sourceCitation="[Source: EPA AQS & CAAQMS via AQIForecaster-XGBoost-v1.3]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
