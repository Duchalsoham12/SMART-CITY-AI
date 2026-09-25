import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div>
        <span className="font-semibold text-slate-400">SmartCityAI</span> &bull; Production Urban Intelligence Platform
      </div>
      <div className="flex items-center gap-4 text-[11px] font-mono">
        <span>City of Chicago Open Data</span>
        <span>&bull;</span>
        <span>EPA Air Quality System</span>
        <span>&bull;</span>
        <span>CPCB CAAQMS</span>
        <span>&bull;</span>
        <span className="text-teal-400">FastAPI + PostgreSQL</span>
      </div>
    </footer>
  );
};
