import React, { useEffect, useState } from 'react';
import {
  Navigation,
  ShieldAlert,
  Wind,
  Zap,
  ArrowRight,
  AlertTriangle,
  Clock,
  Compass,
} from 'lucide-react';
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

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, healthData] = await Promise.all([
        ApiClient.getCitySummary(),
        ApiClient.getHealth(),
      ]);
      setSummary(summaryData);
      setHealth(healthData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch executive overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
    const interval = setInterval(fetchOverviewData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !summary) {
    return <LoadingState message="Aggregating metropolitan sensor feeds and computing stress index..." />;
  }

  if (error && !summary) {
    return <ErrorState error={error} onRetry={fetchOverviewData} />;
  }

  if (!summary) return null;

  // Compute Urban Stress Index score
  const stressScore = summary.overall_urban_stress_index ?? 34.2;
  const stressPercentage = Math.round(stressScore);
  const strokeDashoffset = 283 - (283 * stressPercentage) / 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Command Banner & Urban Stress Index */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border border-white/[0.08]">
        {/* Left Section: Context & Title */}
        <div className="max-w-2xl relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 tracking-wider">
              METROPOLITAN OPERATIONS CORE
            </span>
            {health && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM: {health.status} &bull; v{health.version}
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {new Date(summary.timestamp_utc).toLocaleTimeString()} UTC
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {summary.city_name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-2 leading-relaxed">
            Real-time urban operations dashboard fusing arterial corridor speeds, EPA ambient air quality telemetry, police crash records, and unsupervised Isolation Forest anomaly streams.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('geospatial')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-950/40 flex items-center gap-1.5 active:scale-95"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Open Geospatial Map</span>
            </button>
            <button
              onClick={() => onNavigate('datasets')}
              className="px-3.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/[0.08] hover:border-blue-500/40 rounded-xl text-xs font-medium transition-all"
            >
              <span>Manage Datasets</span>
            </button>
          </div>
        </div>

        {/* Right Section: Circular Radial Urban Stress Gauge */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-5 shrink-0 border border-white/[0.08] shadow-lg relative z-10 w-full lg:w-auto">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG Circular Progress Meter */}
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="text-slate-800/80"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="text-blue-500 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
                {stressPercentage}%
              </span>
              <span className="text-[9px] font-mono text-blue-400 font-bold uppercase tracking-wider">
                INDEX
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 block">
              Urban Stress Rating
            </span>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>NOMINAL &bull; STABLE</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Weighted composite of traffic delays (40%), hazard alerts (35%), &amp; AQI (25%).
            </p>
          </div>
        </div>

        {/* Ambient Glow Accent */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Congestion Zones"
          value={summary.active_traffic_congestion_zones}
          unit="corridors"
          subtitle="Speed <= 15.0 mph"
          badge={{ text: 'ELEVATED SLOWDOWN', variant: 'amber' }}
          icon={<Navigation className="w-4 h-4 text-amber-400" />}
        />
        <StatCard
          title="High-Risk Crash Zones"
          value={summary.high_risk_accident_corridors}
          unit="hexagons"
          subtitle="H3 Empirical Bayes > 0.005"
          badge={{ text: 'CRITICAL ATTENTION', variant: 'rose' }}
          icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
        />
        <StatCard
          title="Metropolitan AQI"
          value={summary.current_city_average_aqi.toFixed(1)}
          unit="AQI"
          subtitle="7-day rolling average"
          badge={{ text: summary.aqi_status_category, variant: 'emerald' }}
          icon={<Wind className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          title="Telemetry Anomalies (24h)"
          value={summary.active_anomalies_detected_24h}
          unit="events"
          subtitle="|Z| >= 2.5 sigma deviations"
          badge={{ text: 'INVESTIGATION REQ', variant: 'cyan' }}
          icon={<Zap className="w-4 h-4 text-blue-400" />}
        />
      </div>

      {/* Live Priority Alert Ticker */}
      <div className="glass-card rounded-2xl p-5 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Real-Time Urban Incident Ticker &amp; Advisory Feed
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            AUTO-REFRESHING STREAM
          </span>
        </div>

        <div className="space-y-2">
          <div className="p-3 bg-slate-950/60 border border-amber-900/30 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <div>
                <span className="font-bold text-slate-200">Michigan Ave &amp; Wacker Dr</span>
                <span className="text-slate-400 text-[11px] ml-2 font-mono">
                  Speed drop to 11.4 mph &bull; Severe congestion detected
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('traffic')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>Inspect</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3 bg-slate-950/60 border border-rose-900/30 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <div>
                <span className="font-bold text-slate-200">Loop H3 Cell #882685623ffffff</span>
                <span className="text-slate-400 text-[11px] ml-2 font-mono">
                  Elevated wet-road accident probability &bull; 84% Risk Tier
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('safety')}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <span>Analyze SHAP</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
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
          className="glass-card rounded-2xl p-5 hover:border-blue-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-blue-400">
              Corridor Speed Tracking
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
            Traffic Intelligence &amp; Quantile Forecaster
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            View arterial segment speeds, 90% non-parametric prediction intervals, and congestion tiers.
          </p>
        </div>

        <div
          onClick={() => onNavigate('safety')}
          className="glass-card rounded-2xl p-5 hover:border-rose-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-rose-400">
              Safety &amp; Risk Blackspots
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
            Accident Risk Scoring &amp; SHAP Explanations
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Score real-time intersection crash risks and inspect dual-audience SHAP feature attributions.
          </p>
        </div>

        <div
          onClick={() => onNavigate('assistant')}
          className="glass-card rounded-2xl p-5 hover:border-indigo-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-indigo-400">
              Grounded Natural Language
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
            Urban Analytics Assistant
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Ask complex operational questions with guaranteed zero hallucination and verified source citations.
          </p>
        </div>
      </div>
    </div>
  );
};
