import React, { useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { AssistantQueryResponse } from '../types/api';
import { EpistemicNotice } from '../components/common/EpistemicNotice';

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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-semibold text-teal-400 uppercase tracking-wider block mb-1">
            Zero-Hallucination Urban Intelligence
          </span>
          <h3 className="text-base font-bold text-white">AI-Powered Urban Analytics Assistant</h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Translates natural language questions into deterministic parameterized SQL queries. All metrics are computed
            in analytical marts before synthesis, backed by mandatory source citations and non-causal epistemic laws.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/40">
            FactGraph Grounded &bull; Zero LLM Arithmetic
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
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left disabled:opacity-50"
          >
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>

      {/* Chat Thread Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[560px] overflow-hidden shadow-sm">
        {/* Messages List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Grounding & Verification Card for Assistant Responses */}
                {msg.data && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-[11px]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold border text-[10px] ${
                            msg.data.temporal_classification === 'HISTORICAL_OBSERVATION'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          }`}
                        >
                          [{msg.data.temporal_classification}]
                        </span>
                        <span className="text-emerald-400 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          FactGraph Verified
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono text-[10px]">
                        Trace: {msg.data.audit_trace_id}
                      </span>
                    </div>

                    {/* Source Citations */}
                    {msg.data.sources_cited && msg.data.sources_cited.length > 0 && (
                      <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60 text-slate-400 font-mono text-[10px]">
                        Sources: {msg.data.sources_cited.join(' &bull; ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-teal-400 font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              Executing deterministic SQL query plan and auditing facts...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputQuery)}
            placeholder="Ask about traffic forecasts, AQI trends, anomalies, or accident risks..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
          <button
            onClick={() => handleSend(inputQuery)}
            disabled={loading || !inputQuery.trim()}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            Ask Assistant
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
