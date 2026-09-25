import React, { useState, useEffect } from 'react';
import {
  Compass,
  HelpCircle,
  Database,
  Shield,
  Clock,
} from 'lucide-react';
import { PageId } from './Sidebar';

interface HeaderProps {
  currentPage: PageId;
  isLiveApi: boolean;
  onToggleLiveApi: (live: boolean) => void;
  userRole: string;
  onRoleChange: (role: string) => void;
  onOpenHelp?: () => void;
  onOpenTour?: () => void;
  onOpenUpload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  isLiveApi,
  onToggleLiveApi,
  userRole,
  onRoleChange,
  onOpenHelp,
  onOpenTour,
  onOpenUpload,
}) => {
  const [timeUtc, setTimeUtc] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(
        now.toISOString().substring(11, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pageTitles: Record<PageId, { title: string; category: string; subtitle: string }> = {
    overview: {
      category: 'Command Core',
      title: 'Executive Metropolitan Overview',
      subtitle: 'Real-time urban stress index, multimodal KPIs, and high-priority alerts',
    },
    datasets: {
      category: 'Data Engineering',
      title: 'Dataset Ingestion & Management',
      subtitle: 'Upload CSV/Excel telemetry, semantic column mapping, preflight validation & quality audits',
    },
    traffic: {
      category: 'Mobility & Flow',
      title: 'Traffic Intelligence & Corridor Speeds',
      subtitle: 'Corridor speed monitoring, congestion levels, and quantile forecasting',
    },
    environment: {
      category: 'Atmospheric Sensors',
      title: 'Environmental & Air Quality Telemetry',
      subtitle: 'Atmospheric pollutant monitoring, AQI categories, and dispersion modeling',
    },
    safety: {
      category: 'Public Safety',
      title: 'Safety Risk & Crash Analytics',
      subtitle: 'Accident severity classification, H3 spatial binning, and TreeSHAP attributions',
    },
    geospatial: {
      category: 'Spatial Analytics',
      title: 'Geospatial Intelligence Explorer',
      subtitle: 'Interactive Leaflet H3 hexagonal risk grid with Empirical Bayes rate smoothing',
    },
    forecasting: {
      category: 'Machine Learning',
      title: 'Predictive Forecasting Subsystem',
      subtitle: 'Multi-horizon quantile predictions with 90% non-parametric prediction intervals',
    },
    anomalies: {
      category: 'Sensor Quality',
      title: 'Urban Anomaly Detection',
      subtitle: 'Unsupervised Isolation Forest and residual Z-score outlier detection',
    },
    assistant: {
      category: 'Decision Support',
      title: 'AI-Powered Urban Analytics Assistant',
      subtitle: 'Grounded natural language decision support with zero hallucination and source citations',
    },
    models: {
      category: 'MLOps & Fleet',
      title: 'ML Model Fleet Performance',
      subtitle: 'Evaluation benchmarks, cross-validation metrics, and baseline comparisons',
    },
    health: {
      category: 'Infrastructure',
      title: 'System Health & Telemetry Diagnostics',
      subtitle: 'Database connection pooling, model fleet readiness, and infrastructure uptime',
    },
    docs: {
      category: 'Knowledge Base',
      title: 'User Guide & Documentation Center',
      subtitle: 'Platform manuals, prediction explanations, data engineering guides, and FAQs',
    },
  };

  const currentMeta = pageTitles[currentPage] || pageTitles.overview;

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.08] px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Breadcrumb & Section Title */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {currentMeta.category}
            </span>
            <span className="text-slate-600 text-xs">/</span>
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
              {currentMeta.title}
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 hidden lg:block leading-none mt-1">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls & Status Pill Bar */}
      <div className="flex items-center gap-3">
        {/* Live UTC Digital Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-white/[0.08] text-[11px] font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{timeUtc || '00:00:00 UTC'}</span>
        </div>

        {/* Quick Add Dataset Button */}
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-950/50 flex items-center gap-1.5 active:scale-95"
            title="Upload New Dataset Telemetry (CSV, XLSX, JSON)"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="font-bold">+ Ingest Data</span>
          </button>
        )}

        {/* Quick Product Tour Button */}
        {onOpenTour && (
          <button
            onClick={onOpenTour}
            className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/[0.08] hover:border-blue-500/40 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
            title="Start Interactive Platform Tour"
          >
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Tour</span>
          </button>
        )}

        {/* Global Help Center Button */}
        {onOpenHelp && (
          <button
            onClick={onOpenHelp}
            className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-blue-300 border border-white/[0.08] hover:border-blue-500/40 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
            title="Open Help Center & Documentation (Shortcut: ?)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Help</span>
            <span className="hidden md:inline text-[10px] text-blue-400/80 font-mono">(?)</span>
          </button>
        )}

        {/* Live vs Offline Data Mode Segmented Switch */}
        <div className="flex items-center bg-slate-900/90 border border-white/[0.08] rounded-xl p-0.5 text-xs shadow-inner">
          <button
            onClick={() => onToggleLiveApi(true)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
              isLiveApi
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveApi ? 'bg-white animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>Live API</span>
          </button>
          <button
            onClick={() => onToggleLiveApi(false)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              !isLiveApi
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Offline Mock
          </button>
        </div>

        {/* User Role Selector Pill */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/[0.08] rounded-xl px-2 py-1 text-xs">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={userRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
          >
            <option value="viewer" className="bg-slate-900 text-slate-200">Viewer</option>
            <option value="analyst" className="bg-slate-900 text-slate-200">Analyst</option>
            <option value="admin" className="bg-slate-900 text-slate-200">Admin</option>
          </select>
        </div>
      </div>
    </header>
  );
};
