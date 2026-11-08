import { useState } from 'react';
import type { FormEvent } from 'react';
import Layout from '../components/Layout';
import { aiExamMentor, aiQuizGenerator, aiRevisionPlan, aiTutor } from '../services/api';

type ToolKey = 'tutor' | 'quiz' | 'mentor' | 'revision';

const TOOL_INFOS: Record<ToolKey, { title: string; subtitle: string; icon: string; buttonLabel: string }> = {
  tutor: {
    title: 'AI Concept Tutor',
    subtitle: 'Deep conceptual explanations with mathematical proofs, edge cases, and GATE CS tricks.',
    icon: 'school',
    buttonLabel: 'Explain Topic',
  },
  quiz: {
    title: 'AI Quiz Generator',
    subtitle: 'Dynamically synthesize fresh practice questions tailored to your chosen difficulty.',
    icon: 'quiz',
    buttonLabel: 'Generate Practice Questions',
  },
  mentor: {
    title: 'GATE Exam Mentor',
    subtitle: 'Ask questions about preparation strategy, subject balance, or exam anxiety.',
    icon: 'psychology',
    buttonLabel: 'Consult Mentor',
  },
  revision: {
    title: 'Dynamic Revision Plan',
    subtitle: 'Produce structured daily schedules with spaced repetition for your target topics.',
    icon: 'event_repeat',
    buttonLabel: 'Build Revision Schedule',
  },
};

export default function AIFeatures() {
  const [tool, setTool] = useState<ToolKey>('tutor');
  const [topic, setTopic] = useState('Operating Systems: Banker’s Deadlock Avoidance Algorithm');
  const [level, setLevel] = useState('GATE Aspirant / Advanced');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium / Hard');
  const [concern, setConcern] = useState('I am scoring low in Theory of Computation and Compiler Design. How should I prioritize my remaining 60 days?');
  const [days, setDays] = useState(7);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function run(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const res = tool === 'tutor'
        ? await aiTutor({ topic, level })
        : tool === 'quiz'
          ? await aiQuizGenerator({ topic, count, difficulty })
          : tool === 'mentor'
            ? await aiExamMentor({ concern })
            : await aiRevisionPlan({ days, target: topic });
      setAnswer(res.answer);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'AI generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeToolConfig = TOOL_INFOS[tool];

  return (
    <Layout activePage="ai" title="AI Suite">
      <div className="max-w-container-max mx-auto px-4 md:px-gutter pb-16 flex flex-col gap-8">
        
        {/* Resq.io Ambient Hero Header */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Specialized GATE CS Neural Engines
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
              AI Study &amp; Strategy Suite
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
              Tailored AI assistants powered by Gemini 2.5 Flash and indexed with standard Computer Science references (Cormen, Silberschatz, Korth, Tanenbaum).
            </p>
          </div>
        </div>

        {/* 4 Tool Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['tutor', 'quiz', 'mentor', 'revision'] as ToolKey[]).map((key) => {
            const item = TOOL_INFOS[key];
            const isActive = tool === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setTool(key); setAnswer(''); setError(''); }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between group cursor-pointer ${
                  isActive
                    ? 'border-primary bg-primary/10 shadow-glow-sm'
                    : 'border-border bg-surface hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? 'bg-primary text-white' : 'bg-surface-container text-text-muted group-hover:text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                  </div>
                  <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                  {item.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        {/* Main Workstation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Tool Form */}
          <div className="lg:col-span-5 bg-surface rounded-3xl border border-border shadow-soft p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">{activeToolConfig.icon}</span>
                {activeToolConfig.title}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">{activeToolConfig.subtitle}</p>
            </div>

            <form onSubmit={run} className="space-y-4">
              {(tool === 'tutor' || tool === 'quiz' || tool === 'revision') && (
                <div>
                  <label className="text-xs font-bold text-text-primary mb-1.5 block">
                    {tool === 'revision' ? 'Target Subject / Module' : 'Topic or Concept'}
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Virtual Memory Paging & TLB"
                    className="w-full rounded-xl border border-border bg-surface-container-lowest px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              )}

              {tool === 'tutor' && (
                <div>
                  <label className="text-xs font-bold text-text-primary mb-1.5 block">
                    Depth / Preparation Level
                  </label>
                  <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="e.g. GATE Aspirant, Beginner, or Advanced"
                    className="w-full rounded-xl border border-border bg-surface-container-lowest px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              )}

              {tool === 'quiz' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-primary mb-1.5 block">Question Count</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-surface-container-lowest px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-primary mb-1.5 block">Difficulty</label>
                    <input
                      type="text"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      placeholder="e.g. Medium / Hard"
                      className="w-full rounded-xl border border-border bg-surface-container-lowest px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {tool === 'mentor' && (
                <div>
                  <label className="text-xs font-bold text-text-primary mb-1.5 block">
                    Preparation Concern or Strategic Question
                  </label>
                  <textarea
                    rows={4}
                    value={concern}
                    onChange={(e) => setConcern(e.target.value)}
                    placeholder="Describe your current syllabus status, weak areas, or time constraints..."
                    className="w-full rounded-xl border border-border bg-surface-container-lowest p-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary leading-relaxed"
                  />
                </div>
              )}

              {tool === 'revision' && (
                <div>
                  <label className="text-xs font-bold text-text-primary mb-1.5 block">
                    Revision Window (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-surface-container-lowest px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-xs shadow-glow-sm hover:shadow-glow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Synthesizing with AI...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    <span>{activeToolConfig.buttonLabel}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* AI Response Display Canvas */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            {answer ? (
              <div className="bg-surface rounded-3xl border border-border shadow-soft p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-text-primary">Verified AI Response</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-text-muted hover:text-text-primary text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    <span>{copied ? 'Copied' : 'Copy Response'}</span>
                  </button>
                </div>

                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-text-primary whitespace-pre-line leading-relaxed font-normal">
                  {answer}
                </div>
              </div>
            ) : (
              <div className="bg-surface rounded-3xl border border-dashed border-border/80 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-1">Awaiting Generation</h3>
                <p className="text-xs text-text-muted max-w-xs">
                  Fill in your target parameters on the left and click "{activeToolConfig.buttonLabel}" to receive an instant response.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
}
