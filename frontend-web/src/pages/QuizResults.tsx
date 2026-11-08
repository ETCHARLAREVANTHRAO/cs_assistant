import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function QuizResults() {
  const [expanded, setExpanded] = useState<number | null>(0);

  const toggle = (i: number) => setExpanded((cur) => (cur === i ? null : i));

  return (
    <Layout activePage="quiz" title="Practice Results">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 px-4 md:px-gutter pb-16">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
          <Link className="hover:text-primary transition-colors flex items-center gap-1" to="/quiz">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Practice Builder
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-text-primary">Attempt Performance Analysis</span>
        </div>

        {/* Resq.io Ambient Hero Score Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
            
            {/* Score Ring */}
            <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                <circle
                  className="text-slate-800 stroke-current"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="42"
                  strokeWidth="8"
                />
                <circle
                  className="text-emerald-400 stroke-current transition-all duration-1000 ease-out"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="42"
                  strokeWidth="8"
                  strokeDasharray="263.89"
                  strokeDashoffset="52.78"
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex flex-col items-center z-10 text-center">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  8<span className="text-slate-400 text-xl font-normal">/10</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full mt-1 border border-emerald-400/30">
                  80% Accuracy
                </span>
              </div>
            </div>

            {/* Assessment & CTA */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">verified</span>
                Target Score Achieved
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text tracking-tight">
                Outstanding Performance!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl font-normal leading-relaxed">
                You demonstrated solid conceptual clarity in Cache Memory and Algorithms.
                Review the step-by-step explanations for the 2 missed questions to eliminate negative marking before your next full mock.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                <Link
                  to="/quiz"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-xs font-bold shadow-glow-sm hover:shadow-glow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">replay</span>
                  Retake New Drill
                </Link>
                <Link
                  to="/progress"
                  className="px-6 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700/60 transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">insights</span>
                  View Global Analytics
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Stats Bento Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface rounded-2xl p-5 border border-border shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">timer</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Total Time Spent</p>
              <div className="text-xl font-extrabold text-text-primary mt-0.5">24m 15s</div>
              <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">speed</span>
                2m 25s / question
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-border shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Net Marks Scored</p>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">14.67 / 18</div>
              <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                81.5% mark capture
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-border shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Percentile Prediction</p>
              <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">Top 8.4%</div>
              <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">military_tech</span>
                Estimated AIR &lt; 850
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Question Review */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">fact_check</span>
                Question-by-Question Solution Review
              </h2>
              <p className="text-xs text-text-muted mt-0.5">Inspect full step-by-step reasoning and official answer keys</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-sm">check_circle</span> 8 Correct
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-sm">cancel</span> 2 Missed
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Question 1: Correct */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-soft transition-all">
              <button
                type="button"
                onClick={() => toggle(0)}
                className="w-full p-5 flex items-center gap-4 cursor-pointer hover:bg-surface-container-low transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-lg">check</span>
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-text-muted">Q1 • 2 Marks</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-text-muted text-[10px] font-semibold uppercase tracking-wider">
                      Computer Organization &amp; Architecture
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-primary truncate">
                    Consider a machine with a byte addressable main memory of 2^32 bytes and block size of 16 bytes...
                  </p>
                </div>
                <span className="material-symbols-outlined text-text-muted">
                  {expanded === 0 ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {expanded === 0 && (
                <div className="p-6 border-t border-border/60 bg-surface-container-lowest flex flex-col gap-4">
                  <div className="p-4 bg-surface rounded-xl border border-border text-sm text-text-primary leading-relaxed">
                    <p>
                      Consider a machine with a byte addressable main memory of 2<sup>32</sup> bytes and block size of
                      16 bytes. Assume that a direct mapped cache consisting of 32 lines is used with this machine.
                      How many bits will be there in Tag, Line and Word field of format of main memory addresses?
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
                    <span className="material-symbols-outlined text-emerald-500 mt-0.5">check_circle</span>
                    <div>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Your Answer (Correct)</p>
                      <p className="text-xs font-mono font-bold text-text-primary mt-1 bg-surface px-2.5 py-1 rounded-lg border border-border inline-block">
                        Tag: 23 bits, Line: 5 bits, Word: 4 bits
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 relative">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2">
                      <span className="material-symbols-outlined text-base">lightbulb</span>
                      <span>Verified GATE Explanation</span>
                    </div>
                    <div className="text-xs text-text-primary space-y-2 leading-relaxed">
                      <p>• Total Physical Address Size = 32 bits (since memory is 2<sup>32</sup> bytes byte-addressable).</p>
                      <p>• Block Size = 16 Bytes = 2<sup>4</sup> Bytes &rarr; Word Offset = <strong>4 bits</strong>.</p>
                      <p>• Number of Cache Lines = 32 = 2<sup>5</sup> lines &rarr; Line (Index) Offset = <strong>5 bits</strong>.</p>
                      <p>• Tag Bits = Total Address &minus; Line &minus; Word = 32 &minus; 5 &minus; 4 = <strong>23 bits</strong>.</p>
                      <p>Therefore, the format is <strong>(23, 5, 4)</strong>.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Question 2: Incorrect */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-soft transition-all">
              <button
                type="button"
                onClick={() => toggle(1)}
                className="w-full p-5 flex items-center gap-4 cursor-pointer hover:bg-surface-container-low transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                  <span className="material-symbols-outlined text-lg">close</span>
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-text-muted">Q2 • 1 Mark (Negative: -0.33)</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-text-muted text-[10px] font-semibold uppercase tracking-wider">
                      Operating Systems
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-primary truncate">
                    Which scheduling algorithm avoids starvation without requiring process runtime predictions?
                  </p>
                </div>
                <span className="material-symbols-outlined text-text-muted">
                  {expanded === 1 ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {expanded === 1 && (
                <div className="p-6 border-t border-border/60 bg-surface-container-lowest flex flex-col gap-4">
                  <div className="p-4 bg-surface rounded-xl border border-border text-sm text-text-primary leading-relaxed">
                    <p>
                      Which of the following CPU scheduling algorithms is guaranteed not to cause starvation for any process and does not require prior estimates of burst time?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-red-500 text-lg mt-0.5">cancel</span>
                      <div>
                        <p className="text-xs font-bold text-red-600 dark:text-red-400">Your Selection (Incorrect)</p>
                        <p className="text-xs text-text-primary font-medium mt-0.5">Shortest Job First (SJF)</p>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-500 text-lg mt-0.5">check_circle</span>
                      <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Official Correct Answer</p>
                        <p className="text-xs text-text-primary font-medium mt-0.5">Round Robin (RR) with aging</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2">
                      <span className="material-symbols-outlined text-base">lightbulb</span>
                      <span>Verified GATE Explanation</span>
                    </div>
                    <p className="text-xs text-text-primary leading-relaxed">
                      SJF and SRTF require burst time estimation and can cause starvation for longer processes if short processes continuously arrive.
                      Round Robin with a finite time quantum guarantees every ready process gets CPU attention periodically, completely preventing starvation without knowing burst times.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>

      </div>
    </Layout>
  );
}
