import React from 'react';

interface EpistemicNoticeProps {
  customText?: string;
  sourceCitation?: string;
  temporalClassification?: 'HISTORICAL_OBSERVATION' | 'MODEL_PREDICTION' | 'HYBRID';
}

export const EpistemicNotice: React.FC<EpistemicNoticeProps> = ({
  customText,
  sourceCitation,
  temporalClassification = 'MODEL_PREDICTION',
}) => {
  const defaultText =
    "Non-Causal Epistemic Notice: Stated model predictions and feature importance attributions reflect statistical associations identified in historical training data. They do not constitute causal proof, physical necessity, or fault determination.";

  const tagColor =
    temporalClassification === 'HISTORICAL_OBSERVATION'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : 'bg-purple-500/10 text-purple-400 border-purple-500/20';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${tagColor}`}>
          [{temporalClassification}]
        </span>
        <span className="text-slate-400 italic">{customText || defaultText}</span>
      </div>
      {sourceCitation && (
        <span className="text-[11px] text-teal-400/90 font-mono whitespace-nowrap bg-teal-950/40 px-2 py-0.5 rounded border border-teal-800/40">
          {sourceCitation}
        </span>
      )}
    </div>
  );
};
