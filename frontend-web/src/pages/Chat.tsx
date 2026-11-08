import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  sendChatMessage,
  sendLocalChatMessage,
  type AIEngine,
  type KnowledgeMode,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FormattedMessage } from '../components/FormattedMessage';
import { RoadmapCard } from '../components/RoadmapCard';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  sources?: string[];
  timestamp?: string;
  roadmap?: any;
}

const KNOWLEDGE_MODES: Array<{
  key: KnowledgeMode;
  label: string;
  icon: string;
  desc: string;
}> = [
  { key: 'hybrid', label: 'Best Answer', icon: 'auto_awesome', desc: 'Combines official GATE PYQ library + your personal notes' },
  { key: 'server', label: 'GATE Library', icon: 'verified', desc: '15+ years of verified GATE CSE questions and answer keys' },
  { key: 'local', label: 'My Docs', icon: 'folder_shared', desc: 'Strictly searches your uploaded PDFs, DOCX, and lecture notes' },
];

const AI_ENGINES: Array<{
  key: AIEngine;
  label: string;
  icon: string;
}> = [
  { key: 'cloud', label: 'Cloud AI (Groq Llama 3.3)', icon: 'cloud' },
  { key: 'desktop-local', label: 'Local Offline Model', icon: 'terminal' },
];

interface QuickPrompt {
  subject: string;
  icon: string;
  tag: string;
  color: string;
  prompt: string;
}

const GATE_QUICK_PROMPTS: QuickPrompt[] = [
  {
    subject: 'Algorithms & DS',
    icon: 'account_tree',
    tag: 'Complexity & Recurrence',
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    prompt: 'Explain the Master Theorem cases for divide-and-conquer recurrences with step-by-step GATE examples.',
  },
  {
    subject: 'Operating Systems',
    icon: 'memory',
    tag: 'Virtual Memory & Deadlocks',
    color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
    prompt: 'How does Multi-level Paging reduce page table size? Calculate physical address translation for a 32-bit system.',
  },
  {
    subject: 'Computer Networks',
    icon: 'lan',
    tag: 'TCP/IP & Routing',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    prompt: 'Compare Slow Start and Congestion Avoidance algorithms in TCP Reno with sliding window diagram explanations.',
  },
  {
    subject: 'DBMS',
    icon: 'database',
    tag: 'Normalization & SQL',
    color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    prompt: 'Given relation R(A,B,C,D,E) with FDs, test whether it is in 3NF or BCNF and explain lossless join decomposition.',
  },
  {
    subject: 'Theory of Computation',
    icon: 'auto_graph',
    tag: 'DFA, NFA & Decidability',
    color: 'from-cyan-500/10 to-sky-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    prompt: 'Give the step-by-step procedure to minimize a DFA using Myhill-Nerode table filling method with an example.',
  },
  {
    subject: 'Computer Organization',
    icon: 'developer_board',
    tag: 'Pipelines & Cache',
    color: 'from-rose-500/10 to-red-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
    prompt: 'Calculate CPI and speedup of a 5-stage instruction pipeline considering branch penalties and data hazards.',
  },
];

export default function Chat() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDesktopApp = window.location.protocol === 'file:';
  const availableEngines = isDesktopApp
    ? AI_ENGINES
    : AI_ENGINES.filter((engine) => engine.key === 'cloud');

  const storageKey = `chatHistory:${currentUser?.uid ?? 'anonymous'}`;
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiEngine, setAiEngine] = useState<AIEngine>('cloud');
  const [knowledgeMode, setKnowledgeMode] = useState<KnowledgeMode>('hybrid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (!prompt) return;
    setInput(prompt);
    setSearchParams({}, { replace: true });
    textareaRef.current?.focus();
  }, [searchParams, setSearchParams]);

  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (aiEngine === 'desktop-local') {
        const res = await sendLocalChatMessage(text);
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: res.reply,
          sources: ['Desktop local model weights'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        return;
      }

      const res = await sendChatMessage(text, undefined, knowledgeMode);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.reply,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roadmap: res.roadmap,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Could not complete AI retrieval. Please verify your connection or retry.';
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'error',
          content: detail,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear all conversation history?')) {
      setMessages([]);
      localStorage.removeItem(storageKey);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Layout activePage="chat" title="AI Tutor & Research Assistant">
      <div className="flex flex-col h-full relative bg-[#f8fafc] dark:bg-[#07080e] text-slate-800 dark:text-slate-100">
        {/* Top Control Bar: Knowledge Mode & AI Engine Selector */}
        <div className="px-4 md:px-8 py-2.5 bg-white/70 dark:bg-[#0c0d18]/70 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
          {/* Knowledge Source Mode Pills */}
          <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/70 dark:border-slate-800/70">
            {KNOWLEDGE_MODES.map((mode) => {
              const active = knowledgeMode === mode.key;
              return (
                <button
                  key={mode.key}
                  onClick={() => setKnowledgeMode(mode.key)}
                  title={mode.desc}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{mode.icon}</span>
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Utilities: Engine Selector & Clear History */}
          <div className="flex items-center gap-2 ml-auto">
            {availableEngines.length > 1 && (
              <select
                value={aiEngine}
                onChange={(e) => setAiEngine(e.target.value as AIEngine)}
                className="text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {availableEngines.map((e) => (
                  <option key={e.key} value={e.key}>
                    {e.label}
                  </option>
                ))}
              </select>
            )}

            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Clear current session"
              >
                <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                <span className="hidden sm:inline">Clear Chat</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Conversation Canvas */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-48 pt-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* FIRST SCREEN: Resq.io Inspired Welcome Experience */}
            {messages.length === 0 && !loading && (
              <div className="space-y-8 py-6">
                {/* Hero Showcase Card with Radiant Ambient Beam */}
                <div className="relative rounded-3xl p-6 sm:p-10 resq-hero-dark text-white shadow-2xl shadow-indigo-950/30 border border-indigo-500/20 overflow-hidden">
                  {/* Resq Beam Light Elements */}
                  <div className="resq-beam" />
                  <div className="resq-beam-right" />
                  <div className="absolute inset-0 resq-stardust opacity-20 pointer-events-none" />

                  <div className="relative z-10 max-w-2xl space-y-4">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-indigo-200">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      <span>GATE Computer Science 2026 AI Assistant</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight gradient-text">
                      Master Complex CS Concepts with Instant AI Clarity
                    </h1>

                    {/* Subtitle */}
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                      Ask anything across 15+ years of verified GATE CS papers, standardized university lecture notes, or your personal uploaded documents.
                    </p>

                    {/* Quick CTA Actions */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <Link
                        to="/learning"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <span className="material-symbols-outlined text-[17px]">school</span>
                        <span>Explore Full Syllabus</span>
                      </Link>
                      <Link
                        to="/pyq"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-semibold text-xs transition-all"
                      >
                        <span className="material-symbols-outlined text-[17px]">history_edu</span>
                        <span>Solve PYQs (2012–2026)</span>
                      </Link>
                    </div>
                  </div>

                  {/* Floating Live Metrics Preview Card (Resq Dashboard Preview) */}
                  <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium">
                        <span className="material-symbols-outlined text-[16px]">library_books</span>
                        <span>GATE Library</span>
                      </div>
                      <p className="text-lg font-bold text-white mt-1">1,280+ Qs</p>
                      <p className="text-[10px] text-slate-400">Verified official keys</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                        <span className="material-symbols-outlined text-[16px]">psychology</span>
                        <span>RAG Engine</span>
                      </div>
                      <p className="text-lg font-bold text-white mt-1">Supabase pgvector</p>
                      <p className="text-[10px] text-slate-400">FastEmbed ONNX 384d</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 text-purple-400 text-xs font-medium">
                        <span className="material-symbols-outlined text-[16px]">layers</span>
                        <span>Subjects Covered</span>
                      </div>
                      <p className="text-lg font-bold text-white mt-1">10 Core Subjects</p>
                      <p className="text-[10px] text-slate-400">Algorithms to TOC</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium">
                        <span className="material-symbols-outlined text-[16px]">speed</span>
                        <span>Inference</span>
                      </div>
                      <p className="text-lg font-bold text-white mt-1">&lt; 1.5s Response</p>
                      <p className="text-[10px] text-slate-400">Ultra-low latency</p>
                    </div>
                  </div>
                </div>

                {/* Subject Quick Starters (Resq Structured Cards) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Suggested Study Prompts &amp; High-Yield Topics
                      </h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Click any prompt to instantly query the GATE AI Knowledge Base
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {GATE_QUICK_PROMPTS.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(item.prompt)}
                        className="group text-left p-4 rounded-2xl bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-sm hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-200 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-indigo-500">
                              {item.icon}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {item.subject}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                          {item.prompt}
                        </p>
                        <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Run prompt</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end w-full group">
                    <div className="max-w-[85%] sm:max-w-[75%] space-y-1">
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl rounded-tr-md px-5 py-3.5 shadow-md shadow-indigo-500/15">
                        <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-medium">
                          {msg.content}
                        </p>
                      </div>
                      {msg.timestamp && (
                        <p className="text-[10px] text-right text-slate-400 pr-2">{msg.timestamp}</p>
                      )}
                    </div>
                  </div>
                );
              }

              if (msg.role === 'error') {
                return (
                  <div key={msg.id} className="flex justify-start w-full">
                    <div className="max-w-[90%] sm:max-w-[85%] bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 text-rose-800 dark:text-rose-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        <span>Retrieval Notice</span>
                      </div>
                      <p className="text-xs leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex justify-start w-full group">
                  <div className="max-w-[95%] sm:max-w-[88%] space-y-2">
                    {/* Assistant Card with Subtle Border and Glow */}
                    <div className="bg-white dark:bg-[#101220] rounded-3xl rounded-tl-md border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-5 sm:p-6 space-y-4">
                      {/* Top Header with Model Info & Actions */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-[13px]">
                            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            My Assistant • GATE CS
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Copy response"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {copiedId === msg.id ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Sources Bar */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
                          <span className="material-symbols-outlined text-[14px] text-indigo-500">menu_book</span>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Sources:</span>
                          {msg.sources.map((src, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Content Body with Styled Markdown & Color Highlighting */}
                      <FormattedMessage content={msg.content} />

                      {/* Concept Roadmap for Academic Subjects */}
                      {msg.roadmap && (
                        <RoadmapCard
                          roadmap={msg.roadmap}
                          onSelectPrompt={(prompt) => handleSend(prompt)}
                        />
                      )}

                      {/* Timestamp */}
                      {msg.timestamp && (
                        <div className="text-[10px] text-slate-400 pt-1">
                          Generated at {msg.timestamp}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 shadow-md text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>Synthesizing answer from knowledge base...</span>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </div>

        {/* Floating Input Dock (Resq Glass Style) */}
        <div className="absolute bottom-0 inset-x-0 p-4 md:p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/90 to-transparent dark:from-[#07080e] dark:via-[#07080e]/95 dark:to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <div className="relative rounded-2xl bg-white/95 dark:bg-[#111322]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-950/10 p-2 space-y-2">
              {/* Text Input Area */}
              <div className="flex items-end gap-2 px-2 pt-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="Ask any GATE CS doubt, theorem, recurrence, or search your notes... (Press Enter to send)"
                  className="w-full resize-none bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none max-h-32 leading-relaxed"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="shrink-0 p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-md shadow-indigo-500/20"
                >
                  <span className="material-symbols-outlined text-[19px]">send</span>
                </button>
              </div>

              {/* Bottom Badges */}
              <div className="flex items-center justify-between px-2 pt-1 pb-0.5 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Mode: {KNOWLEDGE_MODES.find((m) => m.key === knowledgeMode)?.label}</span>
                </div>
                <span>Shift + Enter for new line</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
