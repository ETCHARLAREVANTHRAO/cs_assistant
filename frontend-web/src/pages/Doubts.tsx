import { useState } from 'react';
import Layout from '../components/Layout';
import { solveDoubt } from '../services/api';

const GATE_SUBJECT_SUGGESTIONS = [
  'Algorithms & Data Structures',
  'Operating Systems',
  'Computer Networks',
  'Database Management (DBMS)',
  'Theory of Computation (TOC)',
  'Compiler Design',
  'Computer Organization (COA)',
  'Discrete Mathematics & Linear Algebra',
];

export default function Doubts() {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [answer, setAnswer] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function submit() {
    setError('');
    setAnswer('');
    setExtractedText('');
    setLoading(true);
    try {
      const result = await solveDoubt({ message, subject, topic, file });
      setAnswer(result.answer);
      setExtractedText(result.extracted_text);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not solve this doubt. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && (message.trim() || file);

  const copyAnswer = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout activePage="doubts" title="AI Doubt Solver">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Resq Beam Header Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-indigo-200">
              <span className="material-symbols-outlined text-[14px]">psychology_alt</span>
              <span>Step-by-Step AI Examination Reasoning</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text tracking-tight">
              GATE CS Doubt Solver &amp; OCR Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Stuck on a tricky recurrence, scheduling algorithm, or normalization question? Type your problem or upload a screenshot for a detailed mathematical breakdown.
            </p>
          </div>
        </div>

        {/* Workstation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Panel */}
          <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Submit Your Problem</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Include subject, topic, and where your calculation deviated.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Quick Subject Suggestions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quick Subject Select</label>
              <div className="flex flex-wrap gap-1.5">
                {GATE_SUBJECT_SUGGESTIONS.slice(0, 4).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubject(sub)}
                    className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                      subject === sub
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Topic / Chapter</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Banker's Algorithm"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Problem Description</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste the problem statement or describe where you are getting a contradiction..."
                rows={6}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-3.5 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
              />
            </div>

            {/* File & Photo Upload with OCR */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Attachment (Optional OCR)</label>
              <label className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3.5 cursor-pointer hover:border-indigo-500/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {file ? file.name : 'Attach problem image or document'}
                    </p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, PDF, DOCX, TXT</p>
                  </div>
                </div>
                {file && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.bmp,.tiff,.webp,.pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <button
              onClick={submit}
              disabled={!canSubmit}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Detailed Derivation...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  <span>Solve with Step-by-Step AI</span>
                </>
              )}
            </button>
          </section>

          {/* Right Solution Canvas */}
          <section className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 min-h-[420px] flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Verified AI Explanation</h3>
                    <p className="text-[10px] text-slate-400">Standard GATE conventions &amp; notations applied</p>
                  </div>
                </div>

                {answer && (
                  <button
                    onClick={copyAnswer}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {answer ? (
                <div className="flex-1 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/20">
                  {answer}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-indigo-500">
                    <span className="material-symbols-outlined text-3xl">psychology</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Your solution will appear here</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Our system provides formal definitions, counter-examples for false options, and step-by-step arithmetic.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* OCR Extracted Text Drawer */}
            {extractedText && (
              <details className="rounded-2xl bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-4">
                <summary className="cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-indigo-500">document_scanner</span>
                  <span>Extracted OCR Problem Text</span>
                </summary>
                <pre className="mt-3 whitespace-pre-wrap font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 max-h-60 overflow-auto border border-slate-200/60 dark:border-slate-800/60">
                  {extractedText}
                </pre>
              </details>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
