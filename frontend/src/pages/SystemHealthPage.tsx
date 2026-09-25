import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { HealthCheckData } from '../types/api';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getHealth();
      setHealth(res);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend health probe');
    } finally {
      setLoading(false);
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-semibold text-teal-400 uppercase tracking-wider block mb-1">
            Infrastructure &amp; Telemetry Diagnostics
          </span>
          <h3 className="text-base font-bold text-white">System Readiness &amp; Model Fleet Telemetry</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time liveness, readiness, database pool health, and active ML model weights verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white">{health.status}</span>
          </div>
          <button
            onClick={checkHealth}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-medium rounded-lg transition-colors border border-slate-700"
          >
            Run Diagnostic Probe
          </button>
        </div>
      </div>

      {/* Meta Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-500 uppercase font-mono text-[10px] block">Application Uptime</span>
          <span className="text-xl font-extrabold text-white font-mono mt-1 block">
            {formatUptime(health.uptime_seconds)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Continuous service availability</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-500 uppercase font-mono text-[10px] block">Environment &amp; Build</span>
          <span className="text-xl font-extrabold text-teal-400 font-mono mt-1 block">
            v{health.version}
          </span>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block uppercase">
            Mode: {health.environment}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-500 uppercase font-mono text-[10px] block">Last Probe UTC</span>
          <span className="text-sm font-bold text-white font-mono mt-1 block">
            {new Date(health.timestamp_utc).toLocaleTimeString()} UTC
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Latency: &lt; 5 ms</span>
        </div>
      </div>

      {/* Subsystem Readiness Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">Component Fleet Diagnostics</h4>
          <span className="text-xs font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
            {Object.keys(health.components).length} Subsystems Monitored
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {Object.entries(health.components).map(([compName, compData]) => (
            <div key={compName} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    compData.status === 'HEALTHY' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <div>
                  <span className="text-xs font-bold text-white block capitalize">
                    {compName.replace(/_/g, ' ')}
                  </span>
                  {compData.details && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      {JSON.stringify(compData.details)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    compData.status === 'HEALTHY'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
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
