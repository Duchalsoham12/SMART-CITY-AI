import React, { useState, useMemo } from 'react';
import { HELP_ARTICLES, HelpArticle } from '../content/helpContent';
import {
  BookOpen,
  Sparkles,
  Layers,
  TrendingUp,
  Lightbulb,
  Database,
  HelpCircle,
  Wrench,
  Keyboard,
  Compass,
  Sliders,
  Search,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';

interface DocumentationCenterPageProps {
  onStartTour?: () => void;
  onOpenOnboarding?: () => void;
  onNavigate?: (pageId: any) => void;
}

export const DocumentationCenterPage: React.FC<DocumentationCenterPageProps> = ({
  onStartTour,
  onOpenOnboarding,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(HELP_ARTICLES[0].id);
  const [activeRoleTab, setActiveRoleTab] = useState<'admin' | 'analyst' | 'data_scientist' | 'safety'>('analyst');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: 'All Manuals', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'getting-started', label: 'Getting Started', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'modules', label: 'Modules & Map', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'predictions', label: 'Predictions & Metrics', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'solutions', label: 'Solutions & Assistant', icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: 'datasets', label: 'Datasets & Quality', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'faq', label: 'FAQ', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'shortcuts', label: 'Hotkeys', icon: <Keyboard className="w-3.5 h-3.5" /> },
  ];

  const roleGuidance = {
    admin: {
      title: 'City Administrator & Executive Leadership',
      focus: 'High-level urban stress oversight, risk mitigation, and policy sign-offs.',
      keyActions: [
        'Monitor the Urban Stress Index on the Executive Overview for daily operational briefings.',
        'Review and sign off on high-priority recommendations under Decision Support.',
        'Inspect immutable audit trails before allocating public civil engineering budgets.',
      ],
      recommendedModules: ['overview', 'safety', 'assistant'],
    },
    analyst: {
      title: 'Traffic & Urban Operations Analyst',
      focus: 'Congestion root cause analysis, corridor monitoring, and incident investigations.',
      keyActions: [
        'Track corridor speeds and 90% prediction intervals on the Traffic Intelligence page.',
        'Investigate spatial DBSCAN clusters and Getis-Ord Gi* hotspots on the Geospatial Explorer.',
        'Validate sensor telemetry and examine anomaly detections for hardware sensor faults.',
      ],
      recommendedModules: ['traffic', 'geospatial', 'anomalies'],
    },
    data_scientist: {
      title: 'AI/ML Engineer & Data Scientist',
      focus: 'Model performance benchmarks, feature importance, and population stability drift.',
      keyActions: [
        'Inspect LightGBM pinball loss coverage (PICP >= 85%) on the Model Performance page.',
        'Audit TreeSHAP feature attributions on the Safety & Risk module.',
        'Monitor Population Stability Index (PSI) drift reports to trigger automated retraining.',
      ],
      recommendedModules: ['models', 'forecasting', 'safety'],
    },
    safety: {
      title: 'Public Safety & Emergency Dispatcher',
      focus: 'Hazard classification, Empirical Bayes smoothed risk grids, and advisory response planning.',
      keyActions: [
        'Monitor H3 hexagonal grid cells flagged with HIGH and CRITICAL crash probabilities.',
        'Use Empirical Bayes smoothing to avoid over-allocating units to sparse residential noise.',
        'Query the Urban Assistant for instant localized historical accident evidence.',
      ],
      recommendedModules: ['safety', 'geospatial', 'assistant'],
    },
  };

  const filteredArticles = useMemo(() => {
    return HELP_ARTICLES.filter((article) => {
      const matchesCategory =
        selectedCategory === 'all' || article.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q) ||
        article.content.some((c) => c.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const activeArticle: HelpArticle = useMemo(() => {
    const found = filteredArticles.find((a) => a.id === selectedArticleId);
    return found || filteredArticles[0] || HELP_ARTICLES[0];
  }, [filteredArticles, selectedArticleId]);

  const faqItems = [
    {
      q: 'Does SmartCityAI automatically change physical traffic signals or dispatch police?',
      a: 'No. SmartCityAI is an advisory decision-support platform designed to assist qualified municipal professionals. All recommendations require human review and authorization before any real-world actions are executed.',
    },
    {
      q: 'What does a 90% Prediction Interval mean in non-technical terms?',
      a: 'Instead of predicting a single number (e.g. exactly 18.2 mph), the system outputs a calibrated range [q0.05, q0.95]. Mathematically, there is a 90% likelihood that the actual future speed will fall within this envelope.',
    },
    {
      q: 'Why does the map use Empirical Bayes smoothing?',
      a: 'In rural or quiet suburban zones with very low traffic exposure, a single random incident can artificially inflate the calculated crash rate per mile. Empirical Bayes adjusts low-sample cells toward the regional average, eliminating false-positive alarm blackspots.',
    },
    {
      q: 'How does the AI Assistant ensure zero numerical hallucination?',
      a: 'The assistant uses a deterministic query execution planner grounded strictly against the live PostgreSQL database and active ML inference pipelines. If requested metrics are missing, it refuses to guess and explicitly states insufficient data.',
    },
    {
      q: 'Can I upload custom datasets without GPS coordinates?',
      a: 'Yes, tabular datasets can be analyzed for statistical distributions and time-series forecasting. However, H3 hexagonal spatial binning and Leaflet map rendering require valid latitude and longitude coordinates.',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="glass-panel rounded-3xl p-8 relative overflow-hidden border border-teal-500/30 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 font-mono text-xs rounded-full font-bold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              System Documentation &amp; User Manual
            </span>
            <span className="text-slate-500 text-xs font-mono">&bull; v1.0 Production Edition</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
            SmartCityAI Urban Intelligence Platform Guide
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Learn how to analyze multimodal telemetry, interpret calibrated quantile forecasts, explore H3 hexagonal risk maps, and navigate human-in-the-loop decision-support recommendations.
          </p>

          {/* Quick Action CTA Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {onStartTour && (
              <button
                onClick={onStartTour}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-teal-900/30"
              >
                <Compass className="w-3.5 h-3.5" /> Launch Interactive Tour
              </button>
            )}
            {onOpenOnboarding && (
              <button
                onClick={onOpenOnboarding}
                className="px-4 py-2 glass-card hover:border-slate-600 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-300" /> Re-open Welcome Onboarding
              </button>
            )}
            <button
              onClick={() => setSelectedCategory('shortcuts')}
              className="px-4 py-2 glass-card hover:border-slate-600 text-slate-300 border border-slate-800 text-xs font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <Keyboard className="w-3.5 h-3.5 text-slate-400" /> View Hotkeys
            </button>
          </div>
        </div>

        {/* Decorative Background Accent */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Role-Based Quick Path Selector */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-400" /> Role-Based Quick Path
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your role to see curated responsibilities, operational priorities, and suggested workflows.
            </p>
          </div>

          <div className="flex items-center bg-slate-950/80 border border-slate-800/80 rounded-xl p-1 text-xs">
            {(
              [
                ['analyst', 'Traffic Analyst'],
                ['admin', 'City Administrator'],
                ['data_scientist', 'Data Scientist'],
                ['safety', 'Safety Dispatcher'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveRoleTab(key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeRoleTab === key
                    ? 'bg-teal-600 text-white shadow-md font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Role Content Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-teal-300">
              {roleGuidance[activeRoleTab].title}
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Operational Scope: {roleGuidance[activeRoleTab].focus}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Key Daily Responsibilities:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {roleGuidance[activeRoleTab].keyActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-teal-400 text-xs mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Recommended Primary Modules:
              </span>
              <div className="flex flex-wrap gap-2">
                {roleGuidance[activeRoleTab].recommendedModules.map((modId) => (
                  <button
                    key={modId}
                    onClick={() => onNavigate && onNavigate(modId)}
                    className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3 h-3 text-teal-400" />
                    <span className="capitalize">{modId}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Knowledge Base Browser */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Search & Category Filter Navigation */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 bg-slate-950/40 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all user manuals, metrics, or errors..."
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Showing <span className="font-bold text-teal-400">{filteredArticles.length}</span> documented topics
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                    active
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Column Explorer Layout */}
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80 min-h-[500px]">
          {/* Article Index Column */}
          <div className="lg:w-80 p-4 space-y-2 bg-slate-950/40 overflow-y-auto max-h-[600px]">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="font-semibold text-slate-400">No matching articles</p>
                <p className="mt-1 text-[11px]">Try adjusting your search query.</p>
              </div>
            ) : (
              filteredArticles.map((article) => {
                const isSelected = activeArticle.id === article.id;
                return (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticleId(article.id)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-slate-800/90 border-teal-500/50 shadow-md ring-1 ring-teal-500/20'
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base">{article.icon}</span>
                      {article.badge && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-950 text-teal-400 border border-slate-800">
                          {article.badge}
                        </span>
                      )}
                    </div>
                    <h4
                      className={`text-xs font-bold line-clamp-1 mb-1 ${
                        isSelected ? 'text-teal-300' : 'text-slate-200'
                      }`}
                    >
                      {article.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Active Article Full Reader */}
          <div className="flex-1 p-6 sm:p-8 bg-slate-900/50 space-y-6 overflow-y-auto max-h-[700px]">
            {activeArticle && (
              <>
                <div className="border-b border-slate-800/80 pb-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{activeArticle.icon}</span>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400">
                        Category: {activeArticle.category.replace('-', ' ')}
                      </span>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        {activeArticle.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mt-3">
                    {activeArticle.summary}
                  </p>
                </div>

                {/* Main Content Paragraphs */}
                <div className="space-y-3.5">
                  {activeArticle.content.map((paragraph, idx) => {
                    const isStep = paragraph.startsWith('Step ');
                    const isFaq = paragraph.startsWith('Q:');
                    const isIssue = paragraph.startsWith('Issue:');
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${
                          isFaq
                            ? 'bg-indigo-950/20 border-indigo-900/40 text-slate-200'
                            : isIssue
                            ? 'bg-amber-950/20 border-amber-900/40 text-slate-200'
                            : isStep
                            ? 'bg-slate-950/60 border-teal-900/30 text-slate-200'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <p className="text-xs sm:text-sm whitespace-pre-line leading-relaxed font-sans">
                          {paragraph}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Best Practices & Pro Tips Box */}
                {activeArticle.tips && activeArticle.tips.length > 0 && (
                  <div className="bg-teal-950/30 border border-teal-800/40 rounded-2xl p-4 sm:p-5 space-y-2">
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5" /> Operational Recommendations &amp; Guidance
                    </span>
                    <ul className="space-y-1.5 pl-2">
                      {activeArticle.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-teal-200 leading-relaxed flex items-start gap-2">
                          <span className="text-teal-400 mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive FAQ Accordion Section */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-teal-400" /> Frequently Asked Questions &amp; Methodological Clarifications
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Common questions regarding prediction validity, legal disclaimers, data privacy, and platform behavior.
          </p>
        </div>

        <div className="space-y-2.5">
          {faqItems.map((item, idx) => {
            const isExpanded = expandedFaqIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-800/80 bg-slate-950/50 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between text-xs font-semibold text-slate-200 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-teal-400 font-bold font-mono">Q{idx + 1}.</span>
                    <span>{item.q}</span>
                  </span>
                  <span className="text-slate-500 font-mono">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-teal-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </span>
                </button>
                {isExpanded && (
                  <div className="p-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/80">
                    <p className="pl-6 border-l-2 border-teal-500/50">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Epistemic Integrity Notice */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white tracking-tight">
            Epistemic Distinction Standard
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            SmartCityAI strictly distinguishes between: <strong>(1) Observed Data</strong> (ground-truth sensor readings and recorded incident archives), <strong>(2) Model Predictions</strong> (probabilistic quantile estimates subject to environmental uncertainty), and <strong>(3) Recommendations</strong> (decision-support suggestions requiring human review before implementation). The platform never treats probabilistic estimations as established physical facts.
          </p>
        </div>
      </div>
    </div>
  );
};
