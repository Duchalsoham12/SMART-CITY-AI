import React from 'react';
import { PageId } from './Sidebar';

interface HeaderProps {
  currentPage: PageId;
  isLiveApi: boolean;
  onToggleLiveApi: (live: boolean) => void;
  userRole: string;
  onRoleChange: (role: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  isLiveApi,
  onToggleLiveApi,
  userRole,
  onRoleChange,
}) => {
  const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
    overview: {
      title: 'Executive Metropolitan Overview',
      subtitle: 'Real-time urban stress index, multimodal KPIs, and high-priority alerts',
    },
    traffic: {
      title: 'Traffic Intelligence & Flow',
      subtitle: 'Corridor speed monitoring, congestion levels, and quantile forecasting',
    },
    environment: {
      title: 'Environmental & Air Quality',
      subtitle: 'Atmospheric pollutant monitoring, AQI categories, and dispersion modeling',
    },
    safety: {
      title: 'Safety Risk & Crash Analytics',
      subtitle: 'Accident severity classification, H3 spatial binning, and SHAP feature attributions',
    },
    geospatial: {
      title: 'Geospatial Intelligence Explorer',
      subtitle: 'Interactive Leaflet H3 hexagonal risk grid with Empirical Bayes rate smoothing',
    },
    forecasting: {
      title: 'Predictive Forecasting Subsystem',
      subtitle: 'Multi-horizon quantile predictions with 90% non-parametric prediction intervals',
    },
    anomalies: {
      title: 'Urban Anomaly Detection',
      subtitle: 'Unsupervised Isolation Forest and residual Z-score outlier detection',
    },
    assistant: {
      title: 'AI-Powered Urban Analytics Assistant',
      subtitle: 'Grounded natural language decision support with zero hallucination and source citations',
    },
    models: {
      title: 'ML Model Fleet Performance',
      subtitle: 'Evaluation benchmarks, cross-validation metrics, and baseline comparisons',
    },
    health: {
      title: 'System Health & Telemetry Diagnostics',
      subtitle: 'Database connection pooling, model fleet readiness, and infrastructure uptime',
    },
  };

  const currentMeta = pageTitles[currentPage];

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h2 className="text-sm font-bold text-white tracking-tight">{currentMeta.title}</h2>
        <p className="text-[11px] text-slate-400">{currentMeta.subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Live vs Offline Data Toggle */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => onToggleLiveApi(true)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
              isLiveApi
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLiveApi ? 'bg-white animate-pulse' : 'bg-slate-500'}`}></span>
            Live API (Port 8000)
          </button>
          <button
            onClick={() => onToggleLiveApi(false)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              !isLiveApi
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Offline Mock
          </button>
        </div>

        {/* User Role Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Role:</span>
          <select
            value={userRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-teal-500"
          >
            <option value="viewer">Viewer (Read-only)</option>
            <option value="analyst">Analyst (Ingest &amp; Score)</option>
            <option value="admin">Admin (Full Control)</option>
          </select>
        </div>
      </div>
    </header>
  );
};
