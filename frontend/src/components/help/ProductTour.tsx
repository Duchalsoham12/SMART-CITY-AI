import React, { useState } from 'react';
import { ONBOARDING_TOUR_STEPS, TourStep } from '../../content/helpContent';

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigatePage: (pageId: string) => void;
}

export const ProductTour: React.FC<ProductTourProps> = ({
  isOpen,
  onClose,
  onNavigatePage,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  if (!isOpen) return null;

  const currentStep: TourStep = ONBOARDING_TOUR_STEPS[currentStepIdx];
  const isFirst = currentStepIdx === 0;
  const isLast = currentStepIdx === ONBOARDING_TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      if (ONBOARDING_TOUR_STEPS[nextIdx].targetPage) {
        onNavigatePage(ONBOARDING_TOUR_STEPS[nextIdx].targetPage!);
      }
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      if (ONBOARDING_TOUR_STEPS[prevIdx].targetPage) {
        onNavigatePage(ONBOARDING_TOUR_STEPS[prevIdx].targetPage!);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-teal-500/40 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 relative">
        {/* Step Progress Bar */}
        <div className="h-1 bg-slate-800 w-full">
          <div
            className="h-full bg-teal-500 transition-all duration-300"
            style={{ width: `${((currentStepIdx + 1) / ONBOARDING_TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentStep.icon}</span>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-teal-400 uppercase font-bold">
                  Step {currentStep.step} of {ONBOARDING_TOUR_STEPS.length} • {currentStep.category}
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {currentStep.title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs w-6 h-6 rounded-md hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {currentStep.description}
          </p>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5 mb-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Key Capabilities:
            </span>
            {currentStep.keyPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                <span className="text-teal-400 text-xs leading-none mt-0.5">•</span>
                <span>{point}</span>
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 shadow-sm transition-colors flex items-center gap-1"
              >
                {isLast ? 'Complete Tour ✓' : 'Next Step →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
