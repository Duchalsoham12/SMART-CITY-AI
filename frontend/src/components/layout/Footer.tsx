import React from 'react';
import { ShieldCheck, Server, Globe2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-white/[0.08] bg-slate-950/90 backdrop-blur-md px-6 py-4 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold text-white font-sans">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <span>SmartCity<span className="text-teal-400">AI</span></span>
        </div>
        <span className="text-slate-600 hidden sm:inline">&bull;</span>
        <span className="text-slate-400 hidden sm:inline">
          Enterprise Urban Intelligence &amp; Decision-Support Platform
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <Globe2 className="w-3.5 h-3.5 text-teal-400" />
          <span>Chicago Open Data &bull; Cook Co.</span>
        </span>
        <span className="text-slate-700 hidden sm:inline">&bull;</span>
        <span className="flex items-center gap-1">
          <Server className="w-3.5 h-3.5 text-indigo-400" />
          <span>FastAPI + PostgreSQL Analytical Pool</span>
        </span>
        <span className="text-slate-700 hidden sm:inline">&bull;</span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400 font-semibold">SLA 99.98%</span>
        </span>
      </div>
    </footer>
  );
};
