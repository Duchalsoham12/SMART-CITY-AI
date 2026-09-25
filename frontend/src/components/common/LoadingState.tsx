import React from 'react';

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading verified platform telemetry...',
  rows = 3,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center space-y-4 animate-pulse">
      <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-400">{message}</p>
      <div className="w-full max-w-md space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-800 rounded w-full"></div>
        ))}
      </div>
    </div>
  );
};
