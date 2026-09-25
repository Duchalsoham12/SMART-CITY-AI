import React from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  onOpenGuide: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  onOpenGuide,
}) => {
  if (!isOpen) return null;

  const handleDismiss = (dontShowAgain: boolean = true) => {
    if (dontShowAgain) {
      localStorage.setItem('smartcityai_onboarding_shown', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-900/60 p-6 border-b border-slate-800 relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-lg shadow-sm">
              🏙️
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-widest text-blue-400 uppercase font-semibold">
                Welcome to SmartCityAI
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Urban Intelligence &amp; Decision Support Platform
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 font-medium tracking-wide mt-2 font-mono">
            Analyze → Predict → Understand → Recommend → Act
          </p>
          <button
            onClick={() => handleDismiss(false)}
            className="absolute top-5 right-5 text-slate-400 hover:text-white text-sm w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Core Principles & Guidance */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs text-slate-300 leading-relaxed">
          <p className="text-slate-200">
            SmartCityAI unifies municipal traffic flows, road safety incident records, and environmental air quality sensors into a transparent predictive analytics platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-blue-400 flex items-center gap-1.5 text-[11px]">
                <span>🚦</span> What It Does
              </span>
              <p className="text-[11px] text-slate-400">
                Anticipates corridor congestion, detects sensor anomalies, and evaluates accident risk blackspots with calibrated confidence.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-indigo-400 flex items-center gap-1.5 text-[11px]">
                <span>📈</span> Predictions &amp; Uncertainty
              </span>
              <p className="text-[11px] text-slate-400">
                Outputs 90% non-parametric prediction intervals $[q_{0.05}, q_{0.95}]$ rather than single guesses, ensuring dispatchers understand variance.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px]">
                <span>🗺️</span> Geospatial Intelligence
              </span>
              <p className="text-[11px] text-slate-400">
                Visualizes Uber H3 hexagonal hazard grids with Empirical Bayes smoothing to eliminate false positives in sparse residential zones.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-rose-400 flex items-center gap-1.5 text-[11px]">
                <span>🛡️</span> Decision-Support Only
              </span>
              <p className="text-[11px] text-slate-400">
                The platform suggests advisory actions for human review. It does not pretend to autonomously actuate physical traffic signals.
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl flex items-start gap-2.5">
            <span className="text-blue-400 text-sm mt-0.5">ⓘ</span>
            <p className="text-[11px] text-blue-200">
              <strong>Epistemic Principle:</strong> Observed data reflects verified empirical history. Predictions reflect probabilistic estimations. Recommendations represent advisory options awaiting human authorization.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => handleDismiss(true)}
            className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors"
          >
            Skip &amp; don't show again
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                handleDismiss(true);
                onOpenGuide();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
            >
              📚 Read User Guide
            </button>
            <button
              onClick={() => {
                handleDismiss(true);
                onStartTour();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-950/50 transition-all flex items-center gap-1.5"
            >
              <span>🧭</span> Take a Quick Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
