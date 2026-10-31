import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pyqGetPaper, pyqStartAttempt, type PYQPaperDetail } from '../services/api';

type Step = 'general' | 'paper';

const LEGEND = [
  { className: 'bg-surface border border-outline-variant text-on-surface', label: 'Not visited' },
  { className: 'bg-error-container text-on-error-container', label: 'Not answered' },
  { className: 'bg-success text-on-primary', label: 'Answered' },
  { className: 'bg-secondary text-on-secondary', label: 'Answered & Marked for Review — also evaluated' },
];

export default function PYQInstructions() {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('general');
  const [paper, setPaper] = useState<PYQPaperDetail | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!paperId) return;
    pyqGetPaper(paperId).then(setPaper).catch(() => setError('Could not load this paper. Please go back and try again.'));
  }, [paperId]);

  async function begin() {
    if (!paperId) return;
    setStarting(true);
    setError('');
    try {
      const attempt = await pyqStartAttempt(paperId);
      navigate(`/pyq/attempt/${attempt.attempt_id}`, { replace: true, state: { attempt } });
    } catch {
      setError('Could not start the test. Please check your connection and try again.');
      setStarting(false);
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 bg-inverse-surface text-inverse-on-surface flex items-center justify-between px-6 border-b-4 border-tertiary-fixed-dim shrink-0">
        <h1 className="font-headline-sm text-headline-sm truncate">{paper?.title ?? 'GATE Mock Test'}</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {step === 'general' ? (
            <>
              <h2 className="font-headline-md text-headline-md text-text-primary text-center mb-2">General Instructions</h2>
              <p className="font-label-md text-label-md text-text-muted text-center mb-8">Please read the following carefully.</p>

              <div className="flex flex-col gap-4 font-body-md text-body-md text-on-surface">
                <p>
                  1. The duration of the examination is <strong>{paper?.duration_minutes ?? 180} minutes</strong>.
                  The countdown timer at the top of the exam screen shows the time remaining.
                </p>
                <p>2. When the timer reaches zero, the exam ends automatically and your answers are auto-submitted.</p>
                <p>3. The Question Palette on the right shows the status of every question using one of the symbols below.</p>
                <p>4. Marking scheme: negative marking applies only to MCQs; MSQ and NAT questions carry no negative marks.</p>
              </div>

              <div className="mt-6 bg-surface rounded-xl border border-border overflow-hidden">
                {LEGEND.map((item, i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 ${i !== LEGEND.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className={`w-9 h-8 rounded-md flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0 ${item.className}`}>
                      {i + 1}
                    </div>
                    <span className="font-body-md text-body-md text-on-surface">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => navigate('/pyq')}
                  className="px-6 py-2.5 rounded-lg border border-border text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('paper')}
                  className="px-8 py-2.5 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors"
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-headline-md text-headline-md text-text-primary text-center mb-2">Paper-Specific Instructions</h2>
              {paper && (
                <p className="font-body-md text-body-md text-text-muted text-center mb-8">
                  This paper has <strong>{paper.total_questions} questions</strong> for a total of{' '}
                  <strong>{paper.total_marks} marks</strong>, across {paper.sections.length} compulsory sections.
                </p>
              )}

              {paper && (
                <div className="bg-surface rounded-xl border border-border overflow-hidden mb-6">
                  <div className="grid grid-cols-3 bg-surface-container-lowest px-5 py-3 font-label-sm text-label-sm text-text-muted uppercase tracking-wide">
                    <span>Section</span>
                    <span className="text-center">Questions</span>
                    <span className="text-center">Marks</span>
                  </div>
                  {paper.sections.map((s, i) => (
                    <div
                      key={s.section}
                      className={`grid grid-cols-3 px-5 py-3 font-body-md text-body-md ${i !== paper.sections.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <span className="text-on-surface">{s.section_title}</span>
                      <span className="text-center">{s.question_count}</span>
                      <span className="text-center">{s.total_marks}</span>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-error font-label-md text-label-md mb-4">{error}</p>}

              <label className="flex items-start gap-3 bg-surface rounded-xl border border-border p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded text-primary border-outline focus:ring-primary"
                />
                <span className="font-body-md text-body-md text-on-surface">
                  I have read and understood the instructions. I am aware this is a timed mock test and once
                  submitted my answers cannot be changed.
                </span>
              </label>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep('general')}
                  className="px-6 py-2.5 rounded-lg border border-border text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={begin}
                  disabled={!agreed || starting}
                  className="px-8 py-2.5 rounded-lg bg-secondary text-white font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
                >
                  {starting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  I am ready to begin
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
