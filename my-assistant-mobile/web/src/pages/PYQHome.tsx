import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  pyqListPapers,
  pyqListAttempts,
  type PYQPaperSummary,
  type PYQAttemptSummary,
} from '../services/api';

export default function PYQHome() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<PYQPaperSummary[]>([]);
  const [attempts, setAttempts] = useState<PYQAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([pyqListPapers(), pyqListAttempts()])
      .then(([p, a]) => {
        setPapers(p);
        setAttempts(a);
      })
      .catch(() => setError('Could not load practice tests. Please refresh to try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout activePage="pyq" title="GATE Previous Year Papers">
      <div className="max-w-container-max mx-auto px-4 md:px-gutter pb-margin-desktop flex flex-col gap-stack-lg">
        <p className="font-body-md text-body-md text-text-muted max-w-2xl">
          Full-length mock tests reconstructed from real GATE CS previous year papers &mdash; the same
          question palette, timer, sectioning, and negative marking as the official exam.
        </p>

        {error && (
          <div className="bg-error-container/30 border border-error/30 text-on-error-container rounded-lg p-4 font-body-md text-body-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-text-muted font-label-md text-label-md">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading papers...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {papers.map((paper) => (
              <div
                key={paper.paper_id}
                className="bg-surface rounded-xl shadow-soft border border-border p-6 flex flex-col gap-4 transition-all hover:shadow-hover"
              >
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2">{paper.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Pill label={`${paper.total_questions} Questions`} />
                    <Pill label={`${paper.total_marks} Marks`} />
                    <Pill label={`${paper.duration_minutes} min`} />
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-label-sm font-label-sm text-text-muted">
                  {paper.sections.map((s) => (
                    <div key={s.section} className="flex justify-between">
                      <span>{s.section_title}</span>
                      <span className="font-code">{s.question_count} Qs &middot; {s.total_marks} marks</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate(`/pyq/${paper.paper_id}/instructions`)}
                  className="mt-2 bg-primary hover:bg-on-primary-fixed-variant text-white font-label-md text-label-md py-2.5 px-6 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 self-start"
                >
                  Start Test
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {attempts.length > 0 && (
          <div>
            <h3 className="font-headline-sm text-headline-sm text-text-primary mb-4">Past Attempts</h3>
            <div className="bg-surface rounded-xl shadow-soft border border-border divide-y divide-border overflow-hidden">
              {attempts.map((a) => (
                <button
                  key={a.attempt_id}
                  onClick={() => navigate(`/pyq/result/${a.attempt_id}`)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-container-lowest transition-colors text-left"
                >
                  <div>
                    <p className="font-label-md text-label-md text-text-primary">{a.paper_title}</p>
                    <p className="font-label-sm text-label-sm text-text-muted mt-0.5">
                      {new Date(a.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    {a.total_marks} / {a.max_marks}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="bg-primary-fixed text-primary px-3 py-1 rounded-full font-label-sm text-label-sm font-medium">
      {label}
    </span>
  );
}
