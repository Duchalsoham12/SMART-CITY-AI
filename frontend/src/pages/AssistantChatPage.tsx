import React, { useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { AssistantQueryResponse } from '../types/api';
import { EpistemicNotice } from '../components/common/EpistemicNotice';
import { Bot, Send, Sparkles, CheckCircle2, User, Database, ShieldCheck, Terminal } from 'lucide-react';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  data?: AssistantQueryResponse;
}

export const AssistantChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello! I am the SmartCityAI Urban Analytics Assistant. I answer municipal operations questions strictly using verified platform data and machine learning inference marts, with guaranteed zero numerical hallucination.\n\nYou can ask about current corridor congestion forecasts, 30-day AQI atmospheric trends, telemetry anomalies, or intersection safety risk attributions.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'What areas currently have elevated predicted traffic?',
    'How has AQI changed over the last 30 days?',
    'Which locations experienced unusual traffic patterns?',
    "What factors contributed to today's high-risk prediction?",
  ];

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: Message = { sender: 'user', text: queryText };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await ApiClient.askAssistant(queryText);
      const assistantMsg: Message = {
        sender: 'assistant',
        text: res.answer_text,
        data: res,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Error connecting to Assistant engine: ${err.message || 'Server timeout'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800/80">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-semibold text-purple-400 uppercase tracking-wider">
                Natural Language Intelligence &bull; Zero Hallucination
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                FactGraph Grounded
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">AI Urban Analytics Query Copilot</h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Translates natural language questions into deterministic parameterized SQL queries. All metrics are computed in analytical marts before synthesis, backed by mandatory source citations and non-causal epistemic laws.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800/40 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Zero LLM Arithmetic
          </span>
        </div>
      </div>

      {/* Suggested Canonical Prompts */}
      <div className="flex flex-wrap gap-2">
        {samplePrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="glass-card hover:border-teal-500/50 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-medium transition-all text-left disabled:opacity-50 flex items-center gap-2 border border-slate-800/80 hover:shadow-md hover:shadow-teal-500/10"
          >
            <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>

      {/* Chat Thread Container */}
      <div className="glass-panel rounded-2xl flex flex-col h-[580px] overflow-hidden border border-slate-800/80 shadow-xl">
        {/* Messages List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                {msg.sender === 'user' ? (
                  <>
                    <span className="text-[11px] font-medium text-slate-400">You (Analyst)</span>
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px]">
                      <User className="w-3 h-3" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px]">
                      <Bot className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] font-semibold text-purple-400">Urban Analytics Copilot</span>
                  </>
                )}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-600/20'
                    : 'glass-card border border-slate-800/80 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Grounding & Verification Card for Assistant Responses */}
                {msg.data && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5 text-[11px]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono font-bold border text-[10px] ${
                            msg.data.temporal_classification === 'HISTORICAL_OBSERVATION'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          [{msg.data.temporal_classification}]
                        </span>
                        <span className="text-emerald-400 font-mono flex items-center gap-1.5 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          FactGraph Verified
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono text-[10px]">
                        Trace: {msg.data.audit_trace_id}
                      </span>
                    </div>

                    {/* Source Citations */}
                    {msg.data.sources_cited && msg.data.sources_cited.length > 0 && (
                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 text-slate-400 font-mono text-[10px] flex items-center gap-2">
                        <Database className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Sources: {msg.data.sources_cited.join(' &bull; ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-teal-400 font-mono animate-pulse bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 w-fit">
              <Terminal className="w-4 h-4 text-teal-400 animate-spin" />
              Executing deterministic SQL query plan and auditing analytical marts...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputQuery)}
            placeholder="Ask about traffic forecasts, AQI trends, anomalies, or accident risks..."
            className="flex-1 bg-slate-900/80 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors font-medium"
          />
          <button
            onClick={() => handleSend(inputQuery)}
            disabled={loading || !inputQuery.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-teal-500/20 flex items-center gap-1.5"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <EpistemicNotice
        temporalClassification="HYBRID"
        customText="Assistant responses synthesize deterministic SQL metrics and ML inference tables. Zero hallucinations permitted."
        sourceCitation="[Audit: logs/assistant_audit.jsonl]"
      />
    </div>
  );
};
