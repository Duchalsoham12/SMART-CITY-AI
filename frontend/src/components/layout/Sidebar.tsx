import React from 'react';
import {
  LayoutDashboard,
  Database,
  Navigation,
  Wind,
  ShieldAlert,
  Compass,
  TrendingUp,
  Zap,
  Sparkles,
  Cpu,
  HeartPulse,
  BookOpen,
} from 'lucide-react';

export type PageId =
  | 'overview'
  | 'datasets'
  | 'traffic'
  | 'environment'
  | 'safety'
  | 'geospatial'
  | 'forecasting'
  | 'anomalies'
  | 'assistant'
  | 'models'
  | 'health'
  | 'docs';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

interface NavItemConfig {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavSectionConfig {
  sectionTitle: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const navSections: NavSectionConfig[] = [
    {
      sectionTitle: 'COMMAND & INGESTION',
      items: [
        {
          id: 'overview',
          label: 'Executive Overview',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'datasets',
          label: 'Dataset Ingestion',
          icon: <Database className="w-4 h-4" />,
          badge: 'GATEWAY',
        },
      ],
    },
    {
      sectionTitle: 'PREDICTIVE INTELLIGENCE',
      items: [
        {
          id: 'traffic',
          label: 'Traffic Intelligence',
          icon: <Navigation className="w-4 h-4" />,
        },
        {
          id: 'environment',
          label: 'Environmental AQI',
          icon: <Wind className="w-4 h-4" />,
        },
        {
          id: 'safety',
          label: 'Safety Risk & SHAP',
          icon: <ShieldAlert className="w-4 h-4" />,
        },
        {
          id: 'geospatial',
          label: 'Geospatial Explorer',
          icon: <Compass className="w-4 h-4" />,
        },
        {
          id: 'forecasting',
          label: 'Quantile Forecasting',
          icon: <TrendingUp className="w-4 h-4" />,
        },
        {
          id: 'anomalies',
          label: 'Anomaly Detection',
          icon: <Zap className="w-4 h-4" />,
        },
      ],
    },
    {
      sectionTitle: 'DECISION & SYSTEM',
      items: [
        {
          id: 'assistant',
          label: 'Analytics Assistant',
          icon: <Sparkles className="w-4 h-4" />,
          badge: 'AI',
        },
        {
          id: 'models',
          label: 'Model Performance',
          icon: <Cpu className="w-4 h-4" />,
        },
        {
          id: 'health',
          label: 'System Health',
          icon: <HeartPulse className="w-4 h-4" />,
        },
        {
          id: 'docs',
          label: 'User Guide & Docs',
          icon: <BookOpen className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-white/[0.08] flex flex-col shrink-0 min-h-screen relative z-30 select-none shadow-2xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Hexagonal Radar Icon */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-950/40">
            <span className="w-2 h-2 rounded-full bg-blue-400 absolute animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold tracking-tight text-white font-sans">
                SmartCity<span className="text-blue-400 font-black">AI</span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              URBAN INTELLIGENCE
            </p>
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
          PRO
        </span>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {navSections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
              {sec.sectionTitle}
            </div>
            {sec.items.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-200 border border-blue-500/30 shadow-sm shadow-blue-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`transition-colors ${
                        isActive
                          ? 'text-blue-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-blue-500 text-white font-extrabold'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Active Left Indicator Notch */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full shadow-sm shadow-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Telemetry Operational Status Box */}
      <div className="p-4 border-t border-white/[0.08] bg-slate-950/90 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">
            Cluster Telemetry
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            14ms &bull; LIVE
          </span>
        </div>
        <div className="text-[11px] text-slate-300 font-medium truncate">
          Chicago Open Data &bull; Cook Co.
        </div>
        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
          SLA 99.98% &bull; 4 ML Models Active
        </div>
      </div>
    </aside>
  );
};
