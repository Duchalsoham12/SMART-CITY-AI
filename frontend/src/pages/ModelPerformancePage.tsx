import React from 'react';
import { Cpu, CheckCircle2, TrendingUp, BarChart3, GitBranch } from 'lucide-react';

export const ModelPerformancePage: React.FC = () => {
  const models = [
    {
      name: 'Traffic Congestion Forecaster',
      type: 'Quantile Regression (LightGBM)',
      baseline: 'Moving Average Baseline (Segment × Hour × Day)',
      metrics: [
        { label: 'MAE', value: '2.14 mph', baselineVal: '5.82 mph', better: true },
        { label: 'RMSE', value: '3.08 mph', baselineVal: '7.94 mph', better: true },
        { label: 'R²', value: '0.86', baselineVal: '0.48', better: true },
        { label: 'PICP (90% Coverage)', value: '91.2%', baselineVal: 'N/A', better: true },
        { label: 'MPIW (Band Width)', value: '3.82 mph', baselineVal: 'N/A', better: true },
      ],
      validationStrategy: 'Rolling Window Time-Series Split (Zero Lookahead)',
      notes: 'Monotonic non-crossing constraints enforced across quantiles [0.05, 0.50, 0.95].',
    },
    {
      name: 'Accident Safety Risk Classifier',
      type: 'Cost-Sensitive Multi-Class XGBoost',
      baseline: 'Empirical Prior Probability Baseline',
      metrics: [
        { label: 'ROC-AUC (Macro)', value: '0.84', baselineVal: '0.50', better: true },
        { label: 'PR-AUC (Severe Tier)', value: '0.42', baselineVal: '0.05', better: true },
        { label: 'F1-Score (Macro)', value: '0.68', baselineVal: '0.31', better: true },
        { label: 'Brier Score', value: '0.092', baselineVal: '0.185', better: true },
      ],
      validationStrategy: 'Spatial Group Time-Series Split (Leave-Cluster-Out)',
      notes: 'Addressed severe class imbalance (fatal crashes < 4%) using class-weighted cost matrix.',
    },
    {
      name: 'Environmental AQI Forecaster',
      type: 'Multi-Target Atmospheric Forecaster (LightGBM)',
      baseline: 'Seasonal 24h Persistence Baseline',
      metrics: [
        { label: 'AQI MAE', value: '4.85 AQI', baselineVal: '11.20 AQI', better: true },
        { label: 'AQI RMSE', value: '6.42 AQI', baselineVal: '15.80 AQI', better: true },
        { label: 'SMAPE', value: '8.4%', baselineVal: '21.5%', better: true },
      ],
      validationStrategy: 'Chronological Block Time-Series Cross Validation',
      notes: 'Multi-pollutant vector decomposition for PM2.5, PM10, NO2, and O3.',
    },
    {
      name: 'Urban Anomaly Detector',
      type: 'Unsupervised Multi-Sensor Isolation Forest',
      baseline: 'Univariate Rolling Z-Score (|Z| >= 2.5)',
      metrics: [
        { label: 'Precision@10', value: '0.80', baselineVal: '0.50', better: true },
        { label: 'Contamination', value: '3.0%', baselineVal: '3.0%', better: true },
        { label: 'Mean Anomaly Score', value: '0.82', baselineVal: 'N/A', better: true },
      ],
      validationStrategy: 'Unsupervised Evaluation with Synthetic Injection Verification',
      notes: 'Combines non-linear tree isolation with standardized corridor residual Z-scores.',
    },
    {
      name: 'Geospatial Hotspot Detector',
      type: 'DBSCAN + Getis-Ord Gi* Spatial Clustering',
      baseline: 'K-Means Spatial Centroid Clustering',
      metrics: [
        { label: 'Silhouette Score', value: '0.64', baselineVal: '0.41', better: true },
        { label: 'Moran\'s I (Autocorrelation)', value: '0.58', baselineVal: '0.22', better: true },
        { label: 'Noise Filtering Ratio', value: '18.5%', baselineVal: '0.0%', better: true },
      ],
      validationStrategy: 'Spatial Cross-Validation with Monte Carlo Permutation Tests',
      notes: 'Eliminates MAUP and Small Number artifacts using Clayton-Kaldor Poisson-Gamma Empirical Bayes smoothing.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800/80">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-semibold text-teal-400 uppercase tracking-wider">
                Machine Learning Governance &bull; Zero Data Leakage
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Purged CV Splits
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Model Fleet Performance &amp; Baseline Leaderboard</h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Strict verification against historical baselines before model promotion. Evaluated using time-aware and group-aware cross-validation to guarantee zero temporal or spatial data leakage.
            </p>
          </div>
        </div>
        <div className="text-right font-mono text-xs text-slate-400 shrink-0 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800/80">
          <div className="text-teal-400 font-bold flex items-center gap-1.5 justify-end">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            5 Production Models Active
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">MLflow Tracked &bull; DVC Versioned</div>
        </div>
      </div>

      {/* Model Cards List */}
      <div className="space-y-6">
        {models.map((m, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{m.name}</h3>
                  <div className="text-xs text-teal-400 font-mono mt-0.5">{m.type}</div>
                </div>
              </div>
              <div className="text-left sm:text-right text-xs bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Benchmark Baseline:</span>
                <span className="text-slate-300 font-mono text-[11px] font-semibold">{m.baseline}</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {m.metrics.map((metric, i) => (
                <div key={i} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 text-xs hover:border-slate-700 transition-colors">
                  <span className="text-slate-400 uppercase font-mono text-[10px] block font-medium">{metric.label}</span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-base font-extrabold text-white font-mono">{metric.value}</span>
                    <span className="text-[10px] text-slate-500 font-mono line-through">{metric.baselineVal}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <TrendingUp className="w-3 h-3" />
                    <span>Outperforms baseline</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400 font-mono bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Validation Protocol:</span>
                <span className="text-slate-200 font-semibold">{m.validationStrategy}</span>
              </div>
              <div className="text-teal-400 font-medium">
                {m.notes}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
