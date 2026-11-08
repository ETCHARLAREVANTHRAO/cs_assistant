import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { pyqGetResult, type PYQResult as PYQResultData } from '../services/api';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function PYQResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateResult = (location.state as { result?: PYQResultData } | null)?.result;

  const [result, setResult] = useState<PYQResultData | null>(stateResult ?? null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (stateResult || !attemptId) return;
    pyqGetResult(attemptId).then(setResult).catch(() => setError('Could not load this result.'));
  }, [attemptId, stateResult]);

  if (error) {
    return (
      <Layout activePage="pyq" title="Result">
        <div className="max-w-xl mx-auto text-center py-20 px-4">
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  if (!result) {
    return (
      <Layout activePage="pyq" title="Result">
        <div className="flex items-center gap-3 text-text-muted text-sm px-4 md:px-gutter py-12">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading official test result...
        </div>
      </Layout>
    );
  }

  const attemptedTotal = result.correct + result.incorrect;
  const accuracy = attemptedTotal > 0 ? Math.round((result.correct / attemptedTotal) * 100) : 0;
  const totalQuestions = result.correct + result.incorrect + result.unattempted;
  const scorePercent = result.max_marks > 0 ? Math.round((result.total_marks / result.max_marks) * 100) : 0;

  return (
    <Layout activePage="pyq" title={`${result.paper_title} — Result`}>
      <div className="max-w-container-max mx-auto space-y-8 px-4 md:px-gutter pb-16">
        
        {/* Resq.io Ambient Hero Score Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">verified</span>
                Official GATE Paper Simulation Completed
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
                {result.paper_title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
                Time taken: <strong className="text-white">{formatDuration(result.time_taken_seconds)}</strong> of {result.duration_minutes} minutes allotted.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 sm:p-6 self-start lg:self-auto">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Score</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl sm:text-5xl font-black text-white font-mono">{result.total_marks}</span>
                  <span className="text-sm font-semibold text-slate-400">/ {result.max_marks} Marks</span>
                </div>
              </div>
              <div className="pl-4 border-l border-slate-700/50 text-right">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/30">
                  {scorePercent}% Score Rate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Summary Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            label="Questions Attempted"
            value={`${attemptedTotal} / ${totalQuestions}`}
            icon="fact_check"
            sub={`${result.unattempted} skipped`}
          />
          <StatTile
            label="Net Accuracy"
            value={`${accuracy}%`}
            icon="my_location"
            sub={`${result.correct} correct · ${result.incorrect} incorrect`}
          />
          <StatTile
            label="Unattempted / Left"
            value={String(result.unattempted)}
            icon="help_outline"
            sub="No negative mark penalty"
          />
        </div>

        {/* Section-wise Performance Breakdown */}
        <div className="bg-surface rounded-3xl p-6 sm:p-7 border border-border shadow-soft flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-primary">Section-wise Performance Analysis</h2>
              <p className="text-xs text-text-muted mt-0.5">General Aptitude &bull; Core Computer Science</p>
            </div>
          </div>

          <div className="space-y-6">
            {result.sections.map((s) => {
              const attempted = s.correct + s.incorrect;
              const passPct = s.total_questions > 0 ? (s.correct / s.total_questions) * 100 : 0;
              const failPct = s.total_questions > 0 ? (s.incorrect / s.total_questions) * 100 : 0;
              const acc = attempted > 0 ? Math.round((s.correct / attempted) * 100) : 0;
              return (
                <div key={s.section} className="p-4 rounded-2xl bg-surface-container-low border border-border/60">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-sm font-bold text-text-primary">{s.section_title}</span>
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {s.marks_scored} / {s.max_marks} marks
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${passPct}%` }} />
                    <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${failPct}%` }} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-text-muted">
                    <span className="font-semibold text-text-primary">Accuracy: {acc}%</span>
                    <span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{s.correct}</strong> correct &bull;{' '}
                      <strong className="text-red-500">{s.incorrect}</strong> incorrect &bull;{' '}
                      {s.unattempted} left
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Call to Review Solutions */}
        <div className="bg-surface rounded-3xl p-8 border border-border shadow-soft flex flex-col justify-center items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">rate_review</span>
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Comprehensive Question Review</h2>
          <p className="text-xs sm:text-sm text-text-muted mb-6 max-w-md leading-relaxed">
            Examine every single question with official GATE answer keys, options analysis, and verified step-by-step explanations.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate(`/pyq/review/${result.attempt_id}`, { state: { result } })}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-xs shadow-glow-sm hover:shadow-glow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              Inspect Answer Keys &amp; Explanations
            </button>
            <button
              type="button"
              onClick={() => navigate('/pyq')}
              className="px-6 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-text-primary font-bold text-xs border border-border transition-all cursor-pointer"
            >
              Back to Official Papers
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}

function StatTile({ label, value, icon, sub }: { label: string; value: string; icon: string; sub?: string }) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border shadow-soft flex flex-col justify-between">
      <div className="flex items-center justify-between text-text-muted mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-extrabold text-text-primary font-mono">{value}</div>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
