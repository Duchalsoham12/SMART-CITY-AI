import React, { useState } from 'react';

export interface ErrorGuidanceProps {
  title?: string;
  message?: string;
  errorCode?: string | number;
  technicalDetails?: string;
  possibleCauses?: string[];
  onRetry?: () => void;
  onSwitchToMock?: () => void;
  onOpenHelp?: () => void;
  className?: string;
}

export const ErrorGuidance: React.FC<ErrorGuidanceProps> = ({
  title = 'Operational Alert / Request Error',
  message = 'The system encountered an unexpected response while processing telemetry or model inference.',
  errorCode,
  technicalDetails,
  possibleCauses = [
    'Backend API daemon may not be active on port 8000',
    'Network timeout occurred while communicating with the data server',
    'Uploaded payload or filter bounds failed preflight schema validation',
  ],
  onRetry,
  onSwitchToMock,
  onOpenHelp,
  className = '',
}) => {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <div
      className={`bg-slate-900 border border-rose-900/60 rounded-2xl p-6 shadow-xl text-left ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-lg shrink-0">
          ⚠️
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              {title}
              {errorCode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  CODE {errorCode}
                </span>
              )}
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{message}</p>

          {/* Likely Causes Checklist */}
          {possibleCauses && possibleCauses.length > 0 && (
            <div className="mt-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Likely Root Causes &amp; Verification:
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {possibleCauses.map((cause, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collapsible Technical Details */}
          {technicalDetails && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTechnical(!showTechnical)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline font-mono flex items-center gap-1"
              >
                <span>{showTechnical ? '▼ Hide' : '▶ Show'} Technical Diagnostic Output</span>
              </button>
              {showTechnical && (
                <pre className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap">
                  {technicalDetails}
                </pre>
              )}
            </div>
          )}

          {/* Remediation Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>🔄</span> Retry Request
              </button>
            )}

            {onSwitchToMock && (
              <button
                onClick={onSwitchToMock}
                className="px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>⚡</span> Switch to Offline Mock
              </button>
            )}

            {onOpenHelp && (
              <button
                onClick={onOpenHelp}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>📖</span> Troubleshooting Guide
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
