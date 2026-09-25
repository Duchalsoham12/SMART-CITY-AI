import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-100 bg-slate-900 border border-slate-700/80 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150 ${positionClasses[position]}`}
        >
          {content}
          <div
            className={`absolute w-1.5 h-1.5 bg-slate-900 border-slate-700/80 rotate-45 ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1 border-r border-b'
                : position === 'bottom'
                ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1 border-l border-t'
                : position === 'left'
                ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1 border-r border-t'
                : 'right-full top-1/2 -translate-y-1/2 translate-x-1 border-l border-b'
            }`}
          />
        </div>
      )}
    </div>
  );
};
