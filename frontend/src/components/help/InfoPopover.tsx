import React, { useState, useRef, useEffect } from 'react';
import { CONTEXTUAL_TOOLTIPS, TooltipDefinition } from '../../content/helpContent';

interface InfoPopoverProps {
  termKey?: keyof typeof CONTEXTUAL_TOOLTIPS;
  customTitle?: string;
  customContent?: string;
  epistemicNote?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  termKey,
  customTitle,
  customContent,
  epistemicNote,
  size = 'sm',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const def: TooltipDefinition = (termKey && CONTEXTUAL_TOOLTIPS[termKey]) || {
    term: customTitle || 'Information',
    shortDefinition: customContent || '',
    detailedContext: '',
    epistemicNote: epistemicNote,
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const sizeClasses = size === 'sm' ? 'w-4 h-4 text-[10px]' : 'w-5 h-5 text-xs';

  return (
    <div className={`relative inline-flex items-center align-middle ml-1.5 ${className}`} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Learn more about ${def.term}`}
        className={`${sizeClasses} rounded-full bg-slate-800 hover:bg-teal-500/20 text-slate-400 hover:text-teal-300 border border-slate-700 hover:border-teal-500/40 flex items-center justify-center font-bold font-serif transition-colors focus:outline-none focus:ring-1 focus:ring-teal-400`}
      >
        i
      </button>

      {isOpen && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3.5 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-xl text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span className="text-teal-400 font-serif">ⓘ</span> {def.term}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-1 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-200 font-medium mb-1.5 leading-relaxed">
            {def.shortDefinition}
          </p>

          {def.detailedContext && (
            <p className="text-[11px] text-slate-400 leading-normal mb-2">
              {def.detailedContext}
            </p>
          )}

          {def.epistemicNote && (
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-start gap-1.5">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider shrink-0 mt-0.5">
                Note:
              </span>
              <span className="text-[10px] text-slate-400 italic leading-tight">
                {def.epistemicNote}
              </span>
            </div>
          )}

          {/* Pointer tail */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45" />
        </div>
      )}
    </div>
  );
};
