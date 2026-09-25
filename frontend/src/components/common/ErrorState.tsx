import React from 'react';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-6 text-center flex flex-col items-center justify-center">
      <div className="w-10 h-10 bg-rose-900/40 text-rose-400 rounded-full flex items-center justify-center mb-3 font-bold">
        !
      </div>
      <h3 className="text-sm font-semibold text-rose-300">API Communication Error</h3>
      <p className="mt-1 text-xs text-rose-200/80 max-w-lg">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-3 py-1.5 bg-rose-900/50 hover:bg-rose-800/60 text-white text-xs font-medium rounded-lg transition-colors border border-rose-700/50"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
};
