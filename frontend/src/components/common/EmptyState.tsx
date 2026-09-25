import React from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onReset?: () => void;
  helpLink?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Telemetry Records Found',
  message = 'No sensor readings match the selected geographic corridor or threshold filter.',
  icon = 'Ø',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  onReset,
  helpLink,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-sm">
      <div className="w-14 h-14 bg-slate-800/80 text-teal-400 border border-slate-700/80 rounded-2xl flex items-center justify-center mb-4 text-2xl font-bold shadow-inner">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed max-w-md">{message}</p>

      {/* Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            {actionLabel}
          </button>
        )}

        {onReset && (
          <button
            onClick={onReset}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-medium rounded-lg transition-colors border border-slate-700"
          >
            Clear Filters
          </button>
        )}

        {onSecondaryAction && secondaryActionLabel && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>

      {helpLink && (
        <button
          onClick={helpLink.onClick}
          className="mt-4 text-[11px] text-slate-500 hover:text-teal-400 underline transition-colors"
        >
          {helpLink.label}
        </button>
      )}
    </div>
  );
};
