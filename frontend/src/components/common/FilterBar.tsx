import React from 'react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: { label: string; value: string }[];
  timeWindow?: string;
  onTimeWindowChange?: (window: string) => void;
  onReset?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Filter by corridor or street...',
  selectedCategory,
  onCategoryChange,
  categories,
  timeWindow,
  onTimeWindowChange,
  onReset,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-1 min-w-[240px] items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {categories && onCategoryChange && (
          <select
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Tiers / Categories</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        )}

        {timeWindow && onTimeWindowChange && (
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            {['24h', '7d', '30d'].map((tw) => (
              <button
                key={tw}
                onClick={() => onTimeWindowChange(tw)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  timeWindow === tw ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tw}
              </button>
            ))}
          </div>
        )}

        {onReset && (
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-white underline underline-offset-4 px-2"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
