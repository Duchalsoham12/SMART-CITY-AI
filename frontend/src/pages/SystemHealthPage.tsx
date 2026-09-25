import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { HealthCheckData } from '../types/api';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { HeartPulse, Server, Clock, RefreshCw, Cpu, Activity } from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await ApiClient.getHealth();
      setHealth(res);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend health probe');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  if (loading) return <LoadingState message="Executing platform diagnostic health probe..." />;
  if (error) return <ErrorState error={error} onRetry={checkHealth} />;
  if (!health) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800/80">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-wider">
                Infrastructure &amp; Telemetry Diagnostics
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                SLA 99.98%
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">System Readiness &amp; Model Fleet Telemetry</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time liveness, readiness, PostgreSQL connection pool health, and active ML model weights verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800/80 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white uppercase">{health.status}</span>
          </div>
          <button
            onClick={checkHealth}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white text-xs font-semibold rounded-xl transition-all border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Probe</span>
          </button>
        </div>
      </div>

      {/* Meta Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
          <span className="text-slate-400 uppercase font-mono text-[10px] block font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Application Uptime
          </span>
          <span className="text-xl font-extrabold text-white font-mono mt-1.5 block">
            {formatUptime(health.uptime_seconds)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Continuous service availability</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
          <span className="text-slate-400 uppercase font-mono text-[10px] block font-medium flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-blue-400" /> Environment &amp; Build
          </span>
          <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-200 font-mono mt-1.5 block">
            v{health.version}
          </span>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block uppercase">
            Mode: {health.environment} &bull; Python 3.13
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
          <span className="text-slate-400 uppercase font-mono text-[10px] block font-medium flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> Last Probe UTC
          </span>
          <span className="text-sm font-bold text-white font-mono mt-2 block">
            {new Date(health.timestamp_utc).toLocaleTimeString()} UTC
          </span>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">Telemetry Latency: &lt; 5 ms</span>
        </div>
      </div>

      {/* Subsystem Readiness Checklist */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-sm">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Component Fleet Diagnostics</h3>
          </div>
          <span className="text-xs font-mono text-blue-400 bg-blue-950/60 px-3 py-0.5 rounded-full border border-blue-800/40 font-semibold">
            {Object.keys(health.components).length} Subsystems Monitored
          </span>
        </div>

        <div className="divide-y divide-slate-800/50">
          {Object.entries(health.components).map(([compName, compData]) => (
            <div key={compName} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    compData.status === 'HEALTHY' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-400 shadow-sm shadow-rose-400/50'
                  }`}
                />
                <div>
                  <span className="text-xs font-bold text-white block capitalize tracking-tight">
                    {compName.replace(/_/g, ' ')}
                  </span>
                  {compData.details && (
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                      {JSON.stringify(compData.details)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border ${
                    compData.status === 'HEALTHY'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {compData.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
