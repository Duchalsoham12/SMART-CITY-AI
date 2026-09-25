import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositiveGood?: boolean;
  };
  badge?: {
    text: string;
    variant: 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate';
  };
  uncertaintyInterval?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  trend,
  badge,
  uncertaintyInterval,
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
  };

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 group">
      {/* Top subtle inner accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* Header: Title and Icon */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
          {title}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-white/[0.08] flex items-center justify-center text-teal-400 group-hover:text-teal-300 group-hover:border-teal-500/30 group-hover:bg-teal-500/10 transition-all duration-300 shadow-inner">
            {icon}
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-400 font-mono">
            {unit}
          </span>
        )}
      </div>

      {/* Calibrated Uncertainty Interval (if present) */}
      {uncertaintyInterval && (
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300 font-mono font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>90% CI: {uncertaintyInterval}</span>
        </div>
      )}

      {/* Footer: Subtitle and Badge / Trend */}
      {(subtitle || trend || badge) && (
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs gap-2">
          {subtitle && (
            <span className="text-slate-400 text-[11px] font-medium truncate max-w-[65%]">
              {subtitle}
            </span>
          )}
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono uppercase tracking-wider shrink-0 ${badgeClasses[badge.variant]}`}
            >
              {badge.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
