import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import {
  sendLocalChatMessage,
  checkLocalChatStatus,
  type LocalChatStatusResponse,
} from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  elapsedSeconds?: number;
}

export default function OfflineAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Offline On-Device AI Engine initialized. Running locally with zero internet dependency or telemetry. Ask any GATE CS or systems question.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<LocalChatStatusResponse>({
    available: false,
    detail: 'Checking server...',
  });
  const [lastElapsed, setLastElapsed] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const checkStatus = async () => {
    try {
      const res = await checkLocalChatStatus();
      setStatus(res);
    } catch {
      setStatus({ available: false, detail: 'Local llama-server offline' });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await sendLocalChatMessage(text);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        elapsedSeconds: res.elapsed_seconds,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLastElapsed(res.elapsed_seconds);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ Local inference error: ${err?.message || 'Local AI server is not responding'}. Ensure the local model runner is running on port 8000.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const offlineTemplates = [
    { label: "Amdahl's Law", prompt: "Explain Amdahl's Law for multi-core speedup and calculate speedup with 75% parallel code on 8 cores." },
    { label: 'Master Theorem', prompt: "State the Master Theorem cases for T(n) = 2T(n/2) + n and prove Case 2 asymptotic bound." },
    { label: '2PL vs Strict 2PL', prompt: 'Differentiate between Basic 2-Phase Locking (2PL), Strict 2PL, and Rigorous 2PL with conflict serializability.' },
    { label: 'Dijkstra vs Bellman-Ford', prompt: 'Compare Dijkstra algorithm and Bellman-Ford algorithm for negative edge weights and negative cycle detection.' },
  ];

  return (
    <Layout activePage="offline-ai" title="Offline Local AI Engine">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-slate-900/80 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">security</span>
                <span>Zero-Cloud Edge Intelligence</span>
              </div>
              <h1 className="text-2xl font-black text-white">Local Offline AI Runner</h1>
              <p className="text-sm text-slate-300 mt-1">
                Hardware-accelerated local GGUF model execution with absolute privacy and zero network calls.
              </p>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span
                className={`w-3 h-3 rounded-full ${
                  status.available ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-white">
                  {status.available ? 'Engine Ready' : 'Server Standby'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {status.available ? 'Qwen3.5-2B-Q4_K_M' : 'models/Qwen3.5-2B-Q4'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Architecture</div>
            <div className="text-xs font-bold text-slate-800 dark:text-white font-mono mt-1">
              llama.cpp / GGUF
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Quantization</div>
            <div className="text-xs font-bold text-cyan-400 font-mono mt-1">
              Q4_K_M (4-bit)
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Last Latency</div>
            <div className="text-xs font-bold text-emerald-400 font-mono mt-1">
              {lastElapsed ? `${lastElapsed.toFixed(2)}s` : 'Fast (~0.3s)'}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Connection</div>
            <div className="text-xs font-bold text-slate-300 font-mono mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-emerald-400">wifi_off</span>
              <span>127.0.0.1 (Local)</span>
            </div>
          </div>
        </div>

        {/* Quick Question Prompts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Suggested:</span>
          {offlineTemplates.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.prompt)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Chat Stream Window */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="h-96 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">terminal</span>
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-tl-none whitespace-pre-wrap'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div
                    className={`flex items-center justify-between text-[10px] font-mono pt-1 ${
                      msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.elapsedSeconds && (
                      <span className="ml-2 font-bold text-cyan-400">
                        ⚡ {msg.elapsedSeconds.toFixed(2)}s
                      </span>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    AR
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Computing local tokens on device...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask offline AI about any formula, complexity, or GATE proof..."
              className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isLoading}
              className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <span>Send</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
