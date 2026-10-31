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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  if (error) {
    return (
      <Layout activePage="pyq" title="Result">
        <div className="max-w-xl mx-auto text-center py-20">
          <p className="font-body-md text-body-md text-error">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!result) {
    return (
      <Layout activePage="pyq" title="Result">
        <div className="flex items-center gap-3 text-text-muted font-label-md text-label-md px-4 md:px-gutter">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading result...
        </div>
      </Layout>
    );
  }

  const attemptedTotal = result.correct + result.incorrect;
  const accuracy = attemptedTotal > 0 ? Math.round((result.correct / attemptedTotal) * 100) : 0;
  const totalQuestions = result.correct + result.incorrect + result.unattempted;

  return (
    <Layout activePage="pyq" title={`${result.paper_title} — Result`}>
      <div className="max-w-container-max mx-auto space-y-8 px-4 md:px-gutter lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-primary rounded-xl shadow-sm p-8 text-white relative overflow-hidden flex flex-col justify-center min-h-[220px]">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
            <div className="relative z-10">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed-dim">Total Score</span>
              <div className="flex items-baseline gap-2 mt-2">
                <h2 className="font-headline-lg text-[56px] font-bold leading-none">{result.total_marks}</h2>
                <span className="font-body-lg text-body-lg text-primary-fixed-dim">/ {result.max_marks}</span>
              </div>
              <p className="font-body-md text-body-md mt-4 text-primary-fixed-dim">
                Time taken: {formatDuration(result.time_taken_seconds)} of {result.duration_minutes} min
              </p>
            </div>
          </div>
          <div className="grid grid-rows-3 gap-4">
            <StatTile label="Attempted" value={`${attemptedTotal} / ${totalQuestions}`} icon="fact_check" />
            <StatTile label="Accuracy" value={`${accuracy}%`} icon="my_location" sub={`${result.correct} correct · ${result.incorrect} incorrect`} />
            <StatTile label="Unattempted" value={String(result.unattempted)} icon="help_outline" />
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
          <h3 className="font-headline-sm text-headline-sm text-text-primary mb-6">Section-wise Performance</h3>
          <div className="space-y-6">
            {result.sections.map((s) => {
              const attempted = s.correct + s.incorrect;
              const passPct = s.total_questions > 0 ? (s.correct / s.total_questions) * 100 : 0;
              const failPct = s.total_questions > 0 ? (s.incorrect / s.total_questions) * 100 : 0;
              const acc = attempted > 0 ? Math.round((s.correct / attempted) * 100) : 0;
              return (
                <div key={s.section}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-label-md text-label-md text-text-primary">{s.section_title}</span>
                    <span className="font-code text-code text-text-muted">{s.marks_scored} / {s.max_marks}</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden flex">
                    <div className="bg-success h-full" style={{ width: `${passPct}%` }} />
                    <div className="bg-error h-full" style={{ width: `${failPct}%` }} />
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-text-muted font-label-sm">
                    <span>Acc: {acc}%</span>
                    <span>{s.correct} correct · {s.incorrect} incorrect · {s.unattempted} unattempted</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border border-border p-6 flex flex-col justify-center items-center text-center">
          <span className="material-symbols-outlined text-4xl text-secondary mb-4">rate_review</span>
          <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2">Review Your Answers</h3>
          <p className="font-body-md text-body-md text-text-muted mb-6 max-w-md">
            Go through every question with the correct answer and full step-by-step explanation.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/pyq/review/${result.attempt_id}`, { state: { result } })}
              className="bg-primary text-white font-label-md text-label-md px-6 py-3 rounded-lg shadow-sm hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">play_arrow</span>
              Start Review
            </button>
            <button
              onClick={() => navigate('/pyq')}
              className="bg-secondary/10 text-secondary font-label-md text-label-md px-6 py-3 rounded-lg hover:bg-secondary/20 transition-colors"
            >
              Back to PYQ
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatTile({ label, value, icon, sub }: { label: string; value: string; icon: string; sub?: string }) {
  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border p-5 flex flex-col justify-center">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-text-muted">{label}</span>
        <span className="material-symbols-outlined text-outline">{icon}</span>
      </div>
      <div className="mt-2 font-headline-md text-headline-md font-bold text-text-primary">{value}</div>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}
