import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  pyqGetResult, pyqAssetUrl,
  type PYQResult as PYQResultData, type PYQQuestionResult,
} from '../services/api';

const isImagePath = (v: string | null | undefined): v is string => !!v && v.startsWith('/pyq-assets/');

function statusColor(status: string): string {
  if (status === 'correct') return 'bg-success';
  if (status === 'incorrect') return 'bg-error';
  return 'bg-surface-container-high border border-outline-variant';
}
function statusTextColor(status: string): string {
  if (status === 'correct') return 'text-success';
  if (status === 'incorrect') return 'text-error';
  return 'text-on-surface-variant';
}

function isGiven(q: PYQQuestionResult, key: string): boolean {
  return Array.isArray(q.given_answer) ? q.given_answer.includes(key) : q.given_answer === key;
}
function isCorrectOption(q: PYQQuestionResult, key: string): boolean {
  return Array.isArray(q.correct_answer) ? q.correct_answer.includes(key) : q.correct_answer === key;
}

export default function PYQReview() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateResult = (location.state as { result?: PYQResultData } | null)?.result;

  const [result, setResult] = useState<PYQResultData | null>(stateResult ?? null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (stateResult || !attemptId) return;
    pyqGetResult(attemptId).then(setResult).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  if (!result) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const questions = result.questions;
  const q = questions[index];

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 bg-inverse-surface text-inverse-on-surface flex items-center justify-between px-6 border-b-4 border-tertiary-fixed-dim shrink-0">
        <button
          onClick={() => navigate(`/pyq/result/${result.attempt_id}`, { state: { result } })}
          className="font-label-md text-label-md text-inverse-on-surface/80 hover:text-inverse-on-surface flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Result
        </button>
        <h1 className="font-headline-sm text-headline-sm truncate">{result.paper_title}</h1>
        <span className="w-16" />
      </header>

      <div className="flex items-center justify-between px-6 py-2 border-b border-border bg-surface shrink-0">
        <span className="font-label-md text-label-md text-on-surface-variant">
          {q.question_type} &middot; +{q.marks} Marks{q.negative_marking > 0 ? ` / -${q.negative_marking}` : ''}
        </span>
        <span className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-bold text-white ${statusColor(q.status)}`}>
          {q.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-gutter">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-3 mb-stack-md border-b border-border pb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-container text-white font-headline-sm text-headline-sm">
              {index + 1}
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">Question No. {index + 1}</span>
          </div>

          {isImagePath(q.image_url) && (
            <img src={pyqAssetUrl(q.image_url)} alt="" className="max-w-full rounded-lg border border-border mb-4" />
          )}
          <p className="font-body-lg text-body-lg text-on-surface whitespace-pre-line mb-stack-lg">{q.question}</p>

          {q.question_type !== 'NAT' && q.options && (
            <div className="space-y-stack-sm mb-8">
              {Object.entries(q.options).map(([key, value]) => {
                const given = isGiven(q, key);
                const correct = isCorrectOption(q, key);
                const border = correct ? 'border-success bg-success/10' : given ? 'border-error bg-error/10' : 'border-outline-variant bg-surface';
                return (
                  <div key={key} className={`flex items-center gap-4 p-4 rounded-lg border-2 ${border}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${correct ? 'bg-success' : given ? 'bg-error' : 'border border-outline-variant'}`}>
                      {correct && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                      {!correct && given && <span className="material-symbols-outlined text-white text-[16px]">close</span>}
                    </div>
                    <div className="flex-1 font-body-lg text-body-lg text-on-surface">
                      <span className="font-bold mr-2 text-on-surface-variant">{key}.</span>
                      {isImagePath(value) ? <img src={pyqAssetUrl(value)} alt="" className="inline-block max-h-16 align-middle" /> : value}
                    </div>
                    {correct && <span className="font-label-sm text-label-sm font-bold text-success uppercase">Correct Answer</span>}
                    {!correct && given && <span className="font-label-sm text-label-sm font-bold text-error uppercase">Your Answer</span>}
                  </div>
                );
              })}
            </div>
          )}

          {q.question_type === 'NAT' && (
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
              <div className="bg-surface-container-lowest rounded-lg p-4">
                <p className="font-label-sm text-label-sm text-text-muted uppercase mb-1">Your Answer</p>
                <p className={`font-headline-sm text-headline-sm font-bold ${statusTextColor(q.status)}`}>
                  {q.given_answer != null && q.given_answer !== '' ? String(q.given_answer) : '—'}
                </p>
              </div>
              <div className="bg-surface-container-lowest rounded-lg p-4">
                <p className="font-label-sm text-label-sm text-text-muted uppercase mb-1">Correct Answer</p>
                <p className="font-headline-sm text-headline-sm font-bold text-success">{String(q.correct_answer)}</p>
              </div>
            </div>
          )}

          {q.explanation && (
            <div className="bg-primary-fixed/20 border border-primary/20 rounded-xl p-5">
              <h4 className="font-label-md text-label-md font-bold text-primary mb-2">Explanation</h4>
              <p className="font-body-md text-body-md text-on-surface mb-4">{q.explanation}</p>
              {q.solution_steps && q.solution_steps.length > 0 && (
                <>
                  <h5 className="font-label-sm text-label-sm font-bold text-primary uppercase mb-2">Step-by-step solution</h5>
                  <ol className="space-y-1.5">
                    {q.solution_steps.map((step, i) => (
                      <li key={i} className="font-body-md text-body-md text-on-surface">{i + 1}. {step}</li>
                    ))}
                  </ol>
                </>
              )}
              {(q.topic || q.difficulty) && (
                <div className="flex gap-6 mt-4 pt-4 border-t border-primary/20 font-label-sm text-label-sm text-text-muted">
                  {q.topic && <span>Topic: {q.topic}</span>}
                  {q.difficulty && <span>Difficulty: {q.difficulty}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-surface p-4 flex justify-between gap-4 shrink-0">
        <button
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
          className="px-6 py-2.5 rounded-lg border border-border text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors disabled:opacity-40"
        >
          ← Previous
        </button>
        <div className="hidden md:flex gap-1 overflow-x-auto max-w-[50%]">
          {questions.map((qr, i) => (
            <button
              key={qr.question_id}
              onClick={() => setIndex(i)}
              className={`w-8 h-8 shrink-0 rounded flex items-center justify-center font-label-sm text-label-sm font-bold text-white ${statusColor(qr.status)} ${i === index ? 'ring-2 ring-inverse-surface ring-offset-1' : ''}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          disabled={index === questions.length - 1}
          onClick={() => setIndex((i) => i + 1)}
          className="px-6 py-2.5 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
