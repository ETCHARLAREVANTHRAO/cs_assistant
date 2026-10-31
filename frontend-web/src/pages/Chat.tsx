import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  sendChatMessage,
  sendLocalChatMessage,
  type AIEngine,
  type KnowledgeMode,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  sources?: string[];
}

const KNOWLEDGE_MODES: Array<{
  key: KnowledgeMode;
  label: string;
  icon: string;
}> = [
  { key: 'server', label: 'GATE Library', icon: 'cloud' },
  { key: 'local', label: 'My Docs', icon: 'description' },
  { key: 'hybrid', label: 'Best Answer', icon: 'layers' },
];

const AI_ENGINES: Array<{
  key: AIEngine;
  label: string;
  icon: string;
}> = [
  { key: 'cloud', label: 'Cloud Assistant', icon: 'cloud_sync' },
  { key: 'desktop-local', label: 'Desktop Local', icon: 'desktop_windows' },
];

const MODE_LOADING_TEXT: Record<KnowledgeMode, string> = {
  server: 'Searching GATE Library...',
  local: 'Searching your documents...',
  hybrid: 'Searching all study sources...',
};
const ENGINE_LOADING_TEXT: Record<AIEngine, string> = {
  cloud: 'Preparing answer...',
  'desktop-local': 'Thinking on this computer...',
};
const PROMPT_SUGGESTIONS = [
  'Ask the GATE Library or your own notes',
  'Try: explain B+ trees from my DBMS notes',
  'Summarize the key points of my OS chapter on deadlocks',
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [searchParams, setSearchParams]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
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
          sources: ['Desktop local model'],
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
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Something went wrong. Please try again.';
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'error', content: detail },
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

  return (
    <Layout activePage="chat">
      <div className="flex flex-col h-full relative bg-background text-on-background">
        {/* Chat Canvas */}
        <div className="flex-1 overflow-y-auto px-4 pb-[190px] scroll-smooth">
          <div className="max-w-[900px] mx-auto flex flex-col gap-stack-lg py-stack-md">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center text-center gap-4 py-24">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-text-primary">
                  Ask from GATE Library, My Docs, or both
                </h2>
                <div className="flex flex-col gap-2 max-w-md w-full mt-2">
                  {PROMPT_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="px-4 py-2.5 bg-surface border border-border rounded-full font-label-sm text-label-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors shadow-soft text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end w-full group">
                    <div className="max-w-[75%] bg-primary text-white rounded-[16px] rounded-tr-sm px-5 py-4 shadow-soft whitespace-pre-wrap">
                      <p className="font-body-md text-body-md">{msg.content}</p>
                    </div>
                  </div>
                );
              }
              if (msg.role === 'error') {
                return (
                  <div key={msg.id} className="flex justify-start w-full">
                    <div className="max-w-[85%] bg-error-container/40 border border-error/30 text-on-error-container rounded-[16px] px-5 py-3">
                      <p className="font-body-md text-body-md text-error">{msg.content}</p>
                    </div>
                  </div>
                );
              }
              return (
                <div key={msg.id} className="flex justify-start w-full">
                  <div className="max-w-[85%] bg-surface rounded-[16px] rounded-tl-sm shadow-soft border-l-4 border-primary border-t border-r border-b border-border overflow-hidden">
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="bg-surface-container-lowest border-b border-border px-5 py-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-primary">description</span>
                        <span className="font-label-sm text-label-sm text-text-muted">
                          Found in:{' '}
                          <span className="font-semibold text-on-surface">{msg.sources.join(', ')}</span>
                        </span>
                      </div>
                    )}
                    <div className="px-5 py-4">
                      <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start pl-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-[32px] border border-border shadow-soft">
                  <span className="material-symbols-outlined text-[16px] text-primary animate-pulse">search</span>
                  <span className="font-label-sm text-label-sm text-text-muted">
                    {aiEngine === 'desktop-local'
                      ? ENGINE_LOADING_TEXT[aiEngine]
                      : MODE_LOADING_TEXT[knowledgeMode]}
                  </span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Bottom Input Area (Glassmorphism) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-surface/80 backdrop-blur-xl border-t border-border/50">
          <div className="max-w-[900px] mx-auto relative">
            {availableEngines.length > 1 && (
              <div className="mb-2 grid grid-cols-2 gap-2">
                {availableEngines.map((engine) => {
                  const active = aiEngine === engine.key;
                  return (
                    <button
                      key={engine.key}
                      type="button"
                      onClick={() => setAiEngine(engine.key)}
                      disabled={loading}
                      aria-pressed={active}
                      className={`min-h-10 rounded-lg border px-3 flex items-center justify-center gap-2 font-label-sm text-label-sm transition-colors disabled:opacity-60 ${
                        active
                          ? 'bg-primary text-white border-primary shadow-soft'
                          : 'bg-surface-container-low text-text-muted border-border hover:border-primary hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{engine.icon}</span>
                      <span className="truncate">{engine.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {aiEngine === 'cloud' && (
              <div className="mb-3 grid grid-cols-3 gap-2">
                {KNOWLEDGE_MODES.map((mode) => {
                  const active = knowledgeMode === mode.key;
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => setKnowledgeMode(mode.key)}
                      disabled={loading}
                      aria-pressed={active}
                      className={`min-h-10 rounded-lg border px-3 flex items-center justify-center gap-2 font-label-sm text-label-sm transition-colors disabled:opacity-60 ${
                        active
                          ? 'bg-primary text-white border-primary shadow-soft'
                          : 'bg-surface-container-low text-text-muted border-border hover:border-primary hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{mode.icon}</span>
                      <span className="truncate">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="relative bg-surface rounded-[16px] shadow-soft border border-border focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all duration-200">
              <textarea
                className="w-full bg-transparent border-none rounded-[16px] pl-4 pr-16 py-3 resize-none font-body-md text-body-md text-on-surface placeholder-text-muted focus:ring-0"
                placeholder="Ask a question about your GATE notes..."
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    className="p-2 text-text-muted hover:text-primary transition-colors rounded-full hover:bg-surface-container-low disabled:opacity-50"
                    title="New chat"
                    type="button"
                    onClick={() => setMessages([])}
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined">edit_square</span>
                  </button>
                )}
                <button
                  className="p-2 text-text-muted hover:text-primary transition-colors rounded-full hover:bg-surface-container-low"
                  title="Attach Document"
                  type="button"
                >
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <button
                  className="w-10 h-10 bg-primary hover:bg-primary-container text-white rounded-lg flex items-center justify-center shadow-soft transition-colors shadow-hover disabled:opacity-50"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  type="button"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
            <div className="text-center mt-2">
              <span className="font-label-sm text-label-sm text-text-muted">
                my_assistant can make mistakes. Verify important formulas.
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
