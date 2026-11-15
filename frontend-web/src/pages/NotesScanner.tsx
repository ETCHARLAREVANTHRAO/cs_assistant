import { useState } from 'react';
import Layout from '../components/Layout';
import {
  processNotesOCR,
  type ProcessNotesResult,
} from '../services/api';

const SAMPLE_NOTES = {
  master_theorem: `Master Theorem:
T(n) = a*T(n/b) + f(n), a >= 1, b > 1
Compare f(n) with n^(log_b a):
Case 1: if f(n) = O(n^(log_b a - eps)), then T(n) = Theta(n^(log_b a))
Case 2: if f(n) = Theta(n^(log_b a) * log^k n), then T(n) = Theta(n^(log_b a) * log^(k+1) n)
Case 3: if f(n) = Omega(n^(log_b a + eps)) and regularity a*f(n/b) <= c*f(n), then T(n) = Theta(f(n))
Warning: Does not apply if f(n) and n^(log_b a) are polynomially non-comparable (e.g. n^2 vs n^2 / log n)!`,
  effective_access: `Virtual Memory EAT calculation:
TLB hit ratio = h, TLB search time = c, Main memory access time = m.
If TLB hit: access = c + m.
If TLB miss (single level paging): access = c + m (to fetch page table entry) + m (to fetch data) = c + 2m.
Overall Effective Access Time:
EAT = h * (c + m) + (1 - h) * (c + 2m)
If page fault with probability p, fault service time S:
EAT_total = (1 - p) * EAT_normal + p * S. Note that S is in milliseconds (10^6 ns)!`,
};

export default function NotesScanner() {
  const [inputText, setInputText] = useState<string>(SAMPLE_NOTES.master_theorem);
  const [subject, setSubject] = useState<string>('Algorithms');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<ProcessNotesResult | null>(null);
  const [exportedStatus, setExportedStatus] = useState<boolean>(false);

  const handleProcess = async () => {
    if (!inputText.trim() || isProcessing) return;
    setIsProcessing(true);
    setExportedStatus(false);
    try {
      const res = await processNotesOCR(inputText, subject);
      setResult(res);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportFlashcards = () => {
    setExportedStatus(true);
  };

  return (
    <Layout activePage="notes-scanner" title="Handwritten Notes to LaTeX OCR">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900/80 to-slate-900 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">document_scanner</span>
                <span>Vision &amp; LaTeX Extraction Engine</span>
              </div>
              <h1 className="text-2xl font-black text-white">Handwritten Notes Scanner &amp; LaTeX Converter</h1>
              <p className="text-sm text-slate-300 mt-1">
                Converts rough notes into clean structured Markdown with KaTeX formulas and auto-generated active recall flashcards.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setInputText(SAMPLE_NOTES.master_theorem);
                  setSubject('Algorithms');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white"
              >
                Sample: Master Theorem
              </button>
              <button
                onClick={() => {
                  setInputText(SAMPLE_NOTES.effective_access);
                  setSubject('Operating Systems');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white"
              >
                Sample: Memory EAT
              </button>
            </div>
          </div>
        </div>

        {/* Dual Pane Studio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input & OCR Settings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Raw Notes / OCR Text Input
              </span>

              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-white"
              >
                <option value="Algorithms">Algorithms</option>
                <option value="Operating Systems">Operating Systems</option>
                <option value="Computer Networks">Computer Networks</option>
                <option value="Databases (DBMS)">Databases (DBMS)</option>
                <option value="Theory of Computation">Theory of Computation</option>
              </select>
            </div>

            <textarea
              rows={12}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw notes, copied transcript, or OCR text..."
              className="w-full text-xs font-mono p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                AI extracts formulas and generates flashcards automatically.
              </span>

              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isProcessing ? 'progress_activity' : 'auto_fix_high'}
                </span>
                <span>{isProcessing ? 'Extracting LaTeX...' : 'Process & Format Notes'}</span>
              </button>
            </div>
          </div>

          {/* Right: Structured Output & Flashcards */}
          <div className="space-y-4">
            {/* Extracted Markdown Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-amber-400">format_quote</span>
                  <span>Structured Markdown Preview</span>
                </span>
              </div>

              <div className="h-64 overflow-y-auto pr-2 space-y-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">
                {result ? (
                  result.structured_markdown
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 italic">
                    Click &quot;Process &amp; Format Notes&quot; to view structured output.
                  </div>
                )}
              </div>

              {/* Extracted Formulas Chips */}
              {result && result.extracted_formulas.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Extracted Formulas:</div>
                  <div className="flex flex-wrap gap-2">
                    {result.extracted_formulas.map((form, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs font-bold"
                      >
                        {form}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auto Generated Flashcards */}
            {result && result.auto_flashcards.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-teal-400">psychology</span>
                    <span>Auto-Generated Active Recall Cards ({result.auto_flashcards.length})</span>
                  </span>

                  <button
                    onClick={handleExportFlashcards}
                    disabled={exportedStatus}
                    className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {exportedStatus ? 'check' : 'save'}
                    </span>
                    <span>{exportedStatus ? 'Saved to SM-2 Decks!' : 'Save to Flashcards'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {result.auto_flashcards.map((card, cIdx) => (
                    <div
                      key={cIdx}
                      className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-2"
                    >
                      <div className="font-bold text-slate-900 dark:text-white">Q: {card.front}</div>
                      <div className="text-slate-300">A: {card.back}</div>
                      {card.exam_trap && (
                        <div className="text-amber-400 text-[11px] font-medium">
                          ⚠️ Trap: {card.exam_trap}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
