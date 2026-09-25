import React, { useState, useMemo, useEffect } from 'react';
import { HELP_ARTICLES, HelpArticle } from '../../content/helpContent';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  onOpenFullDocs?: () => void;
  initialArticleId?: string;
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  onOpenFullDocs,
  initialArticleId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(
    initialArticleId || HELP_ARTICLES[0].id
  );

  useEffect(() => {
    if (initialArticleId) {
      setSelectedArticleId(initialArticleId);
    }
  }, [initialArticleId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const categories = [
    { id: 'all', label: 'All Topics', icon: '📖' },
    { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
    { id: 'modules', label: 'Modules & Map', icon: '🗺️' },
    { id: 'predictions', label: 'Predictions & Metrics', icon: '📈' },
    { id: 'solutions', label: 'Solutions & Assistant', icon: '💡' },
    { id: 'datasets', label: 'Datasets & Quality', icon: '📁' },
    { id: 'faq', label: 'FAQ', icon: '❓' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: '🔧' },
    { id: 'shortcuts', label: 'Hotkeys', icon: '⌨️' },
  ];

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full h-[85vh] max-h-[750px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="bg-slate-900/90 border-b border-slate-800 p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-base shadow-sm">
              ?
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  SmartCityAI Knowledge Base &amp; Help Center
                </h2>
                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono rounded-full font-semibold">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Search guides, mathematical definitions, error diagnostics, and workflows.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onStartTour();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold rounded-lg transition-colors"
            >
              <span>🚀</span> Start Tour
            </button>
            {onOpenFullDocs && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFullDocs();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                <span>📚</span> Full Documentation
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center transition-colors"
              aria-label="Close Help Center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-slate-950/70 border-b border-slate-800/80 p-3 px-6 space-y-2.5">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics, metrics, formulas, or troubleshooting..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
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

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Body: Two-column split */}
        <div className="flex-1 flex min-h-0 divide-x divide-slate-800">
          {/* Article List / Index */}
          <div className="w-1/3 min-w-[240px] max-w-[320px] overflow-y-auto p-3 space-y-1.5 bg-slate-950/40">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-10 px-4 text-xs text-slate-500">
                <p className="text-xl mb-1">🔍</p>
                <p className="font-semibold text-slate-400">No matching articles</p>
                <p className="mt-1 text-[11px]">Try adjusting your search query or topic filter.</p>
              </div>
            ) : (
              filteredArticles.map((article) => {
                const isSelected = activeArticle.id === article.id;
                return (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticleId(article.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-slate-800/90 border-blue-500/40 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{article.icon}</span>
                      {article.badge && (
                        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-blue-400 border border-slate-700">
                          {article.badge}
                        </span>
                      )}
                    </div>
                    <h4
                      className={`text-xs font-semibold line-clamp-1 mb-1 ${
                        isSelected ? 'text-blue-300' : 'text-slate-200'
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

          {/* Active Article Detail View */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/60 space-y-5">
            {activeArticle && (
              <>
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{activeArticle.icon}</span>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                        {activeArticle.category.replace('-', ' ')}
                      </span>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {activeArticle.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                    {activeArticle.summary}
                  </p>
                </div>

                {/* Content paragraphs / list */}
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  {activeArticle.content.map((paragraph, idx) => {
                    const isQ = paragraph.startsWith('Q:');
                    const isIssue = paragraph.startsWith('Issue:');
                    const isStep = paragraph.startsWith('Step ');
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${
                          isQ
                            ? 'bg-indigo-950/20 border-indigo-900/40 text-slate-200'
                            : isIssue
                            ? 'bg-amber-950/20 border-amber-900/40 text-slate-200'
                            : isStep
                            ? 'bg-slate-950/60 border-blue-900/30 text-slate-200'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <p className="whitespace-pre-line leading-relaxed font-sans">{paragraph}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Pro Tips Box */}
                {activeArticle.tips && activeArticle.tips.length > 0 && (
                  <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3.5 space-y-1.5">
                    <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                      <span>💡</span> Recommended Best Practice
                    </span>
                    {activeArticle.tips.map((tip, i) => (
                      <p key={i} className="text-xs text-blue-200 leading-relaxed pl-4 relative">
                        <span className="absolute left-0 top-0 text-blue-400">•</span>
                        {tip}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="bg-slate-950/80 border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-2">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Esc</kbd> to close</span>
            <span>&bull;</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">?</kbd> anywhere to re-open</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-mono text-[10px]">
              Epistemic Principle: Observed ≠ Predicted ≠ Recommended
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
