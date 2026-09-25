import React, { useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { AQIForecast, TrafficForecast } from '../types/api';
import { EpistemicNotice } from '../components/common/EpistemicNotice';

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
      {/* Domain Switcher */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 max-w-md">
        <button
          onClick={() => setDomain('traffic')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            domain === 'traffic'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🚦 Corridor Traffic Forecasting
        </button>
        <button
          onClick={() => setDomain('aqi')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            domain === 'aqi'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🍃 Atmospheric AQI Forecasting
        </button>
      </div>

      {domain === 'traffic' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Traffic Forecasting Controls</h3>
            <p className="text-[11px] text-slate-400">
              Select segment, current telemetry speed, and prediction horizon for LightGBM pinball quantile loss.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Target Corridor Segment</label>
                <select
                  value={trafficSegment}
                  onChange={(e) => setTrafficSegment(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value={101}>Segment #101 - Michigan Avenue (Downtown Loop)</option>
                  <option value={108}>Segment #108 - Halsted Street (Near West)</option>
                  <option value={142}>Segment #142 - State Street (Central Core)</option>
                  <option value={204}>Segment #204 - Ashland Avenue (Industrial)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Current Sensor Speed</span>
                  <span className="font-mono text-white">{trafficCurrentSpeed.toFixed(1)} mph</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="55"
                  step="0.5"
                  value={trafficCurrentSpeed}
                  onChange={(e) => setTrafficCurrentSpeed(parseFloat(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Forecast Horizon</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 3, 6].map((h) => (
                    <button
                      key={h}
                      onClick={() => setTrafficHorizon(h)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        trafficHorizon === h
                          ? 'bg-teal-600 text-white border-teal-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
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
                className="w-full mt-2 py-2 bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Evaluating Quantiles...' : 'Run Quantile Forecaster'}
              </button>
            </div>
          </div>

          {/* Results & Visualizer */}
          <div className="lg:col-span-2 space-y-4">
            {trafficForecast && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Quantile Speed Distribution (90% Envelope)</h3>
                    <p className="text-[11px] text-slate-400">Non-crossing monotonicity enforced across α=[0.05, 0.50, 0.95]</p>
                  </div>
                  <span className="text-xs font-mono text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded border border-teal-800/40">
                    {trafficForecast.congestion_level}
                  </span>
                </div>

                {/* Quantile Interval Visual Card */}
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400 font-mono">Lower Bound (q0.05): {trafficForecast.quantile_05.toFixed(1)} mph</span>
                    <span className="text-xl font-extrabold text-teal-400 font-mono">
                      Median: {trafficForecast.predicted_speed_mph.toFixed(1)} mph
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Upper Bound (q0.95): {trafficForecast.quantile_95.toFixed(1)} mph</span>
                  </div>

                  {/* Visual Confidence Bar */}
                  <div className="relative w-full bg-slate-800 h-6 rounded-lg overflow-hidden flex items-center">
                    <div
                      className="absolute bg-teal-500/30 border-l-2 border-r-2 border-teal-400 h-full"
                      style={{
                        left: `${(trafficForecast.quantile_05 / 60) * 100}%`,
                        width: `${((trafficForecast.quantile_95 - trafficForecast.quantile_05) / 60) * 100}%`,
                      }}
                    />
                    <div
                      className="absolute w-2 h-full bg-teal-400"
                      style={{ left: `${(trafficForecast.predicted_speed_mph / 60) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>0 mph (Gridlock)</span>
                    <span>30 mph (Nominal)</span>
                    <span>60 mph (Free-flow Expressway)</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block uppercase font-mono">Prediction Horizon</span>
                    <span className="font-bold text-white font-mono">+{trafficForecast.horizon_hours} Hour</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block uppercase font-mono">Uncertainty Width</span>
                    <span className="font-bold text-cyan-400 font-mono">
                      {(trafficForecast.quantile_95 - trafficForecast.quantile_05).toFixed(1)} mph
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block uppercase font-mono">Speed Differential</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {(trafficForecast.predicted_speed_mph - trafficCurrentSpeed).toFixed(1)} mph
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block uppercase font-mono">Model Engine</span>
                    <span className="font-bold text-slate-300 font-mono text-[11px] truncate block">LightGBM-v2.1</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Atmospheric Forecaster Controls</h3>
            <p className="text-[11px] text-slate-400">
              Select ambient sensor station and input parameters to predict 24h AQI and multi-pollutant vector.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Station Sensor</label>
                <select
                  value={aqiStation}
                  onChange={(e) => setAqiStation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="EPA_17031_0001">Cook County Central Station (EPA AQS)</option>
                  <option value="EPA_17031_0014">South Loop Air Monitoring Lab</option>
                  <option value="CPCB_CAAQMS_04">Regional Cross-City Grid B</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Current Baseline AQI</span>
                  <span className="font-mono text-white">{aqiCurrent.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="250"
                  step="1"
                  value={aqiCurrent}
                  onChange={(e) => setAqiCurrent(parseFloat(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <button
                onClick={handleAqiForecast}
                disabled={loading}
                className="w-full mt-2 py-2 bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Simulating Dispersion...' : 'Generate 24h AQI Forecast'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {aqiForecast && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">24-Hour Multi-Pollutant Forecast</h3>
                    <p className="text-[11px] text-slate-400">Predicted Air Quality Category: {aqiForecast.air_quality_category}</p>
                  </div>
                  <span className="text-xs font-mono text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded border border-teal-800/40">
                    Horizon: +24h
                  </span>
                </div>

                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Projected Metro AQI</span>
                  <div className="text-4xl font-extrabold text-teal-400 font-mono">
                    {aqiForecast.predicted_aqi.toFixed(1)}
                  </div>
                  <div className="text-xs font-mono text-cyan-400 bg-cyan-950/40 py-1 px-3 rounded-full border border-cyan-800/40 inline-block">
                    90% CI: [{aqiForecast.uncertainty_bounds[0].toFixed(1)}, {aqiForecast.uncertainty_bounds[1].toFixed(1)}]
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Pollutant Vector Concentration Estimates
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {Object.entries(aqiForecast.pollutant_breakdown).map(([k, v]) => (
                      <div key={k} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="text-slate-500 uppercase font-mono text-[10px] block">{k}</span>
                        <span className="font-bold text-white font-mono text-base">{v.toFixed(1)}</span>
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
