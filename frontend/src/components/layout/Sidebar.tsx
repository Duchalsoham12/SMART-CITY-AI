import React from 'react';

export type PageId =
  | 'overview'
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

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const navItems: { id: PageId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Executive Overview', icon: '📊' },
    { id: 'traffic', label: 'Traffic Intelligence', icon: '🚦' },
    { id: 'environment', label: 'Environmental Intelligence', icon: '🍃' },
    { id: 'safety', label: 'Safety & Risk', icon: '🛡️' },
    { id: 'geospatial', label: 'Geospatial Explorer', icon: '🗺️' },
    { id: 'forecasting', label: 'Predictive Forecasting', icon: '📈' },
    { id: 'anomalies', label: 'Anomaly Detection', icon: '⚡' },
    { id: 'assistant', label: 'AI Analytics Assistant', icon: '🤖' },
    { id: 'models', label: 'Model Performance', icon: '🎯' },
    { id: 'health', label: 'System Health', icon: '❤️' },
    { id: 'docs', label: 'User Guide & Docs', icon: '📚' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-base shadow-sm">
          S
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">SmartCityAI</h1>
          <p className="text-[11px] text-slate-400 font-mono">Urban Intelligence v1.0</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Telemetry Status Bar */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400">Stream Status</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ACTIVE
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono truncate">
          Chicago Open Data &bull; Cook Co.
        </div>
      </div>
    </aside>
  );
};
