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
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        {icon && <div className="text-slate-400 p-2 bg-slate-800/60 rounded-lg">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      {uncertaintyInterval && (
        <div className="mt-1 text-xs text-cyan-400/90 font-mono">
          90% CI: {uncertaintyInterval}
        </div>
      )}

      {(subtitle || trend || badge) && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
          {badge && (
            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${badgeClasses[badge.variant]}`}>
              {badge.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
