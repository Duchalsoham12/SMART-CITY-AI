import React from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onReset?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Telemetry Records Found',
  message = 'No sensor readings match the selected geographic corridor or threshold filter.',
  onReset,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center mb-4 text-xl font-bold">
        Ø
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-400 max-w-md">{message}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-medium rounded-lg transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};
