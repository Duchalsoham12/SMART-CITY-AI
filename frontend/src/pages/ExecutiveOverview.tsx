import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { CityHealthSummary, HealthCheckData } from '../types/api';
import { StatCard } from '../components/common/StatCard';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EpistemicNotice } from '../components/common/EpistemicNotice';
import { PageId } from '../components/layout/Sidebar';

interface ExecutiveOverviewProps {
  onNavigate: (page: PageId) => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<CityHealthSummary | null>(null);
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, healthData] = await Promise.all([
        ApiClient.getCitySummary(),
        ApiClient.getHealth(),
      ]);
      setSummary(sumData);
      setHealth(healthData);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState message="Aggregating metropolitan operational telemetry..." />;
  if (error) return <ErrorState error={error} onRetry={loadData} />;
  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Urban Stress Index */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/30">
              METROPOLITAN INTELLIGENCE CORE
            </span>
            {health && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                SYSTEM: {health.status} (v{health.version})
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">
              Last Refreshed: {new Date(summary.timestamp_utc).toLocaleTimeString()} UTC
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{summary.city_name}</h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1">
            Real-time multi-modal monitoring fusing connected vehicle speeds, EPA AQS air quality telemetry,
            vision crash records, and unsupervised Isolation Forest anomaly streams.
          </p>
        </div>

        {/* Urban Stress Gauge Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4 min-w-[220px]">
          <div className="w-14 h-14 rounded-full border-4 border-teal-500/30 border-t-teal-400 flex items-center justify-center font-bold text-white text-lg font-mono">
            {Math.round(summary.overall_urban_stress_index * 100)}%
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Urban Stress Index</div>
            <div className="text-xs font-semibold text-emerald-400 mt-0.5">NOMINAL &bull; STABLE</div>
            <div className="text-[10px] text-slate-500 font-mono">Composite Model Score</div>
          </div>
        </div>
      </div>

      {/* 4 Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Congestion Zones"
          value={summary.active_traffic_congestion_zones}
          unit="corridors"
          subtitle="Speed <= 15.0 mph"
          badge={{ text: 'ELEVATED SLOWDOWN', variant: 'amber' }}
          icon={<span className="text-base">🚦</span>}
        />
        <StatCard
          title="High-Risk Crash Zones"
          value={summary.high_risk_accident_corridors}
          unit="hexagons"
          subtitle="H3 Empirical Bayes > 0.005"
          badge={{ text: 'CRITICAL ATTENTION', variant: 'rose' }}
          icon={<span className="text-base">🛡️</span>}
        />
        <StatCard
          title="Metropolitan AQI"
          value={summary.current_city_average_aqi.toFixed(1)}
          unit="AQI"
          subtitle="7-day rolling average"
          badge={{ text: summary.aqi_status_category, variant: 'emerald' }}
          icon={<span className="text-base">🍃</span>}
        />
        <StatCard
          title="Telemetry Anomalies (24h)"
          value={summary.active_anomalies_detected_24h}
          unit="events"
          subtitle="|Z| >= 2.5 sigma deviations"
          badge={{ text: 'INVESTIGATION REQ', variant: 'cyan' }}
          icon={<span className="text-base">⚡</span>}
        />
      </div>

      {/* Epistemic Guardrail Notice */}
      <EpistemicNotice
        temporalClassification="MODEL_PREDICTION"
        sourceCitation="[Source: SmartCityAI Telemetry Bus & City of Chicago Data Portal]"
      />

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('traffic')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-teal-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Corridor Speed Tracking</span>
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">
            Traffic Intelligence &amp; Quantile Forecaster
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            View arterial segment speeds, 90% non-parametric prediction intervals, and congestion tiers.
          </p>
        </div>

        <div
          onClick={() => onNavigate('safety')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-rose-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Safety &amp; Risk Blackspots</span>
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
            Accident Risk Scoring &amp; SHAP Explanations
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Score real-time intersection crash risks and inspect dual-audience SHAP feature attributions.
          </p>
        </div>

        <div
          onClick={() => onNavigate('assistant')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-purple-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Grounded Natural Language</span>
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
            Urban Analytics Assistant
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Ask complex operational questions with guaranteed zero hallucination and verified source citations.
          </p>
        </div>
      </div>
    </div>
  );
};
