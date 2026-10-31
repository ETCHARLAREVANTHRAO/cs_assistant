import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  pyqSubmitAttempt,
  pyqAssetUrl,
  type PYQAttemptStartResponse,
  type PYQAnswer,
  type PYQQuestion,
} from '../services/api';

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked' | 'answered_marked';

interface UIState {
  visited: boolean;
  marked: boolean;
  answer: PYQAnswer;
}

function statusOf(state: UIState | undefined): QuestionStatus {
  if (!state || !state.visited) return 'not_visited';
  const hasAnswer = state.answer != null && (Array.isArray(state.answer) ? state.answer.length > 0 : state.answer !== '');
  if (state.marked) return hasAnswer ? 'answered_marked' : 'marked';
  return hasAnswer ? 'answered' : 'not_answered';
}

function paletteClasses(status: QuestionStatus, current: boolean): string {
  const ring = current ? ' ring-2 ring-offset-2 ring-offset-surface ring-inverse-surface' : '';
  switch (status) {
    case 'answered':
      return 'bg-success text-on-primary shadow-sm hover:opacity-90' + ring;
    case 'not_answered':
      return 'bg-error-container text-on-error-container hover:bg-error-container/80' + ring;
    case 'marked':
      return 'bg-secondary text-on-secondary shadow-sm hover:opacity-90' + ring;
    case 'answered_marked':
      return 'bg-secondary text-on-secondary shadow-sm hover:opacity-90 relative' + ring;
    default:
      return 'bg-surface border border-outline-variant text-on-surface hover:bg-surface-container' + ring;
  }
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

const isImagePath = (v: string | null | undefined): v is string => !!v && v.startsWith('/pyq-assets/');

export default function PYQSession() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const attempt = (location.state as { attempt?: PYQAttemptStartResponse } | null)?.attempt;

  if (!attempt || attempt.attempt_id !== attemptId) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm px-6">
          <p className="font-headline-sm text-headline-sm text-text-primary mb-2">Session not found</p>
          <p className="font-body-md text-body-md text-text-muted mb-6">
            This exam session isn't available &mdash; it may have expired or the page was reloaded mid-test.
          </p>
          <button
            onClick={() => navigate('/pyq')}
            className="px-6 py-2.5 rounded-lg bg-primary text-white font-label-md text-label-md"
          >
            Back to PYQ
          </button>
        </div>
      </div>
    );
  }

  return <PYQSessionInner attempt={attempt} />;
}

function PYQSessionInner({ attempt }: { attempt: PYQAttemptStartResponse }) {
  const navigate = useNavigate();
  const questions = attempt.paper.questions;

  const sectionOrder = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    questions.forEach((q) => {
      if (!seen.has(q.section)) { seen.add(q.section); order.push(q.section); }
    });
    return order;
  }, [questions]);
  const sectionTitleByCode = useMemo(() => {
    const map: Record<string, string> = {};
    questions.forEach((q) => { map[q.section] = q.section_title; });
    return map;
  }, [questions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, PYQAnswer>>({});
  const [visited, setVisited] = useState<Set<string>>(() => new Set([questions[0]?.question_id]));
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<PYQAnswer>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const timeSpentRef = useRef<Record<string, number>>({});
  const questionStartedAtRef = useRef(Date.now());
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const autoSubmittedRef = useRef(false);
  const submittingRef = useRef(false);

  const currentQ: PYQQuestion = questions[currentIndex];

  function recordCurrentQuestionTime() {
    const qid = currentQ?.question_id;
    if (!qid) return;
    const elapsed = Math.max(0, Math.round((Date.now() - questionStartedAtRef.current) / 1000));
    timeSpentRef.current[qid] = (timeSpentRef.current[qid] ?? 0) + elapsed;
    questionStartedAtRef.current = Date.now();
  }

  useEffect(() => {
    const existing = answersRef.current[currentQ.question_id];
    setDraft(existing !== undefined ? existing : (currentQ.question_type === 'MSQ' ? [] : null));
  }, [currentIndex, currentQ.question_id, currentQ.question_type]);

  const deadline = useMemo(
    () => new Date(attempt.started_at).getTime() + attempt.duration_minutes * 60000,
    [attempt.started_at, attempt.duration_minutes],
  );
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.round((deadline - Date.now()) / 1000)));

  useEffect(() => {
    const tick = () => {
      const secs = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        handleSubmit();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  const states: Record<string, UIState> = {};
  questions.forEach((q) => {
    states[q.question_id] = { visited: visited.has(q.question_id), marked: marked.has(q.question_id), answer: answers[q.question_id] ?? null };
  });

  function goTo(index: number) {
    recordCurrentQuestionTime();
    setCurrentIndex(index);
    setVisited((prev) => new Set(prev).add(questions[index].question_id));
  }

  function commitDraft(markReview: boolean) {
    const qid = currentQ.question_id;
    setAnswers((prev) => ({ ...prev, [qid]: draftRef.current }));
    if (markReview) setMarked((prev) => new Set(prev).add(qid));
  }

  function saveAndNext() {
    commitDraft(false);
    if (currentIndex < questions.length - 1) goTo(currentIndex + 1);
  }
  function markForReview() {
    commitDraft(true);
    if (currentIndex < questions.length - 1) goTo(currentIndex + 1);
  }
  function clearResponse() {
    const cleared = currentQ.question_type === 'MSQ' ? [] : null;
    setDraft(cleared);
    setAnswers((prev) => ({ ...prev, [currentQ.question_id]: cleared }));
  }

  function toggleOption(key: string) {
    if (currentQ.question_type === 'MCQ') {
      setDraft(key);
    } else if (currentQ.question_type === 'MSQ') {
      setDraft((prev) => {
        const arr = Array.isArray(prev) ? [...prev] : [];
        const idx = arr.indexOf(key);
        if (idx >= 0) arr.splice(idx, 1); else arr.push(key);
        return arr;
      });
    }
  }

  async function handleSubmit() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      recordCurrentQuestionTime();
      const finalAnswers = { ...answersRef.current, [currentQ.question_id]: draftRef.current };
      const result = await pyqSubmitAttempt(attempt.attempt_id, finalAnswers, timeSpentRef.current);
      navigate(`/pyq/result/${result.attempt_id}`, { replace: true, state: { result } });
    } catch {
      setSubmitError('Could not submit your exam. Please check your connection and try again.');
      submittingRef.current = false;
      setSubmitting(false);
      autoSubmittedRef.current = false;
    }
  }

  const timeCritical = remaining <= 300;

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 bg-inverse-surface text-inverse-on-surface flex items-center justify-between px-6 border-b-4 border-tertiary-fixed-dim shrink-0">
        <h1 className="font-headline-sm text-headline-sm truncate">{attempt.paper.title}</h1>
        <nav className="hidden md:flex bg-white/10 p-1 rounded-lg">
          {sectionOrder.map((section) => {
            const active = currentQ.section === section;
            return (
              <button
                key={section}
                onClick={() => goTo(questions.findIndex((q) => q.section === section))}
                className={
                  active
                    ? 'px-4 py-1.5 rounded bg-surface shadow-sm font-label-md text-label-md text-primary font-semibold'
                    : 'px-4 py-1.5 rounded font-label-md text-label-md text-inverse-on-surface/70 hover:text-inverse-on-surface transition-colors'
                }
              >
                {sectionTitleByCode[section]}
              </button>
            );
          })}
        </nav>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="font-label-sm text-label-sm text-inverse-on-surface/60 uppercase tracking-wider">Time Left</span>
            <span className={`font-code text-headline-sm font-bold tracking-wider ${timeCritical ? 'text-error' : 'text-inverse-on-surface'}`}>
              {formatTime(remaining)}
            </span>
          </div>
          <button
            onClick={() => setSubmitModalOpen(true)}
            className="h-10 px-6 rounded-lg bg-error hover:opacity-90 text-on-error font-label-md text-label-md font-bold transition-opacity shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            Submit Test
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <section className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex items-center justify-between px-6 py-2 border-b border-border bg-surface shrink-0">
            <span className="font-label-md text-label-md text-on-surface-variant">Question Type: {currentQ.question_type}</span>
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm border border-outline-variant">
                +{currentQ.marks} Marks
              </span>
              {currentQ.negative_marking > 0 && (
                <span className="px-2 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm border border-error-container">
                  -{currentQ.negative_marking} Marks
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-gutter pb-32">
            <div className="max-w-[900px] mx-auto">
              <div className="flex items-center gap-3 mb-stack-md border-b border-border pb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-container text-white font-headline-sm text-headline-sm">
                  {currentIndex + 1}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">Question No. {currentIndex + 1}</span>
              </div>

              {currentQ.question_type === 'MSQ' && (
                <div className="bg-secondary-fixed/40 border border-secondary/30 rounded-lg px-4 py-2 mb-4 font-label-md text-label-sm text-on-secondary-fixed-variant">
                  This question has one or more correct options. Select ALL that apply.
                </div>
              )}

              {isImagePath(currentQ.image_url) && (
                <img src={pyqAssetUrl(currentQ.image_url)} alt="" className="max-w-full rounded-lg border border-border mb-4" />
              )}

              <p className="font-body-lg text-body-lg text-on-surface whitespace-pre-line mb-stack-lg">{currentQ.question}</p>

              {currentQ.question_type !== 'NAT' && currentQ.options && (
                <div className="space-y-stack-sm">
                  {Object.entries(currentQ.options).map(([key, value]) => {
                    const selected = currentQ.question_type === 'MSQ'
                      ? Array.isArray(draft) && draft.includes(key)
                      : draft === key;
                    return (
                      <label
                        key={key}
                        className="flex items-start gap-4 p-4 rounded-lg bg-surface border border-outline-variant hover:border-primary cursor-pointer transition-colors group shadow-sm"
                      >
                        <div className="flex items-center h-6">
                          <input
                            type={currentQ.question_type === 'MSQ' ? 'checkbox' : 'radio'}
                            checked={selected}
                            onChange={() => toggleOption(key)}
                            name="option"
                            className="w-5 h-5 text-primary border-outline focus:ring-primary bg-surface"
                          />
                        </div>
                        <div className="flex-1 font-body-lg text-body-lg text-on-surface pt-0.5">
                          <span className="font-bold mr-2 text-on-surface-variant group-hover:text-primary">{key}.</span>
                          {isImagePath(value)
                            ? <img src={pyqAssetUrl(value)} alt="" className="inline-block max-h-16 align-middle" />
                            : value}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {currentQ.question_type === 'NAT' && (
                <div className="max-w-xs">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={typeof draft === 'string' ? draft : ''}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a number"
                    className="w-full border-2 border-primary rounded-lg px-4 py-3 font-body-lg text-body-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="font-label-sm text-label-sm text-text-muted mt-2">Answer may be an integer or a decimal (e.g. 12 or 3.5).</p>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-border p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 flex justify-between items-center">
            <div className="flex gap-4">
              <button onClick={clearResponse} className="px-6 py-2.5 rounded-lg bg-surface border border-outline text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors">
                Clear Response
              </button>
              <button onClick={markForReview} className="px-6 py-2.5 rounded-lg bg-secondary/10 text-secondary font-label-md text-label-md font-semibold hover:bg-secondary/20 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">bookmark</span>
                Mark for Review &amp; Next
              </button>
            </div>
            <button onClick={saveAndNext} className="px-8 py-2.5 rounded-lg bg-primary text-white font-label-md text-label-md font-bold hover:bg-on-primary-fixed-variant transition-colors shadow-sm">
              Save &amp; Next
            </button>
          </div>
        </section>

        <aside className="w-[320px] bg-surface border-l border-border flex flex-col shrink-0 z-20 shadow-sm">
          <div className="p-4 border-b border-border bg-surface-container-lowest grid grid-cols-2 gap-y-3 gap-x-2">
            <LegendChip className="bg-success text-on-primary" n={questions.filter((q) => statusOf(states[q.question_id]) === 'answered').length} label="Answered" />
            <LegendChip className="bg-error-container text-on-error-container" n={questions.filter((q) => statusOf(states[q.question_id]) === 'not_answered').length} label="Not Answered" />
            <LegendChip className="bg-surface border border-outline-variant text-on-surface" n={questions.filter((q) => statusOf(states[q.question_id]) === 'not_visited').length} label="Not Visited" />
            <LegendChip className="bg-secondary text-on-secondary" n={questions.filter((q) => { const s = statusOf(states[q.question_id]); return s === 'marked' || s === 'answered_marked'; }).length} label="Marked" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-surface">
            {sectionOrder.map((section) => (
              <div key={section} className="mb-6">
                <h3 className="font-label-md text-label-md font-bold text-on-surface mb-3">{sectionTitleByCode[section]}</h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, i) => {
                    if (q.section !== section) return null;
                    const status = statusOf(states[q.question_id]);
                    return (
                      <button
                        key={q.question_id}
                        onClick={() => goTo(i)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-label-md text-label-md transition-colors ${paletteClasses(status, i === currentIndex)}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </main>

      {submitModalOpen && (
        <SubmitModal
          questions={questions}
          states={states}
          sectionOrder={sectionOrder}
          sectionTitleByCode={sectionTitleByCode}
          submitting={submitting}
          error={submitError}
          onCancel={() => setSubmitModalOpen(false)}
          onConfirm={handleSubmit}
        />
      )}
    </div>
  );
}

function LegendChip({ className, n, label }: { className: string; n: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shadow-sm ${className}`}>{n}</div>
      <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
    </div>
  );
}

function SubmitModal({
  questions, states, sectionOrder, sectionTitleByCode, submitting, error, onCancel, onConfirm,
}: {
  questions: PYQQuestion[];
  states: Record<string, UIState>;
  sectionOrder: string[];
  sectionTitleByCode: Record<string, string>;
  submitting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const bySection: Record<string, { answered: number; notAnswered: number; marked: number; notVisited: number }> = {};
  let notVisitedTotal = 0;
  let notAnsweredTotal = 0;
  questions.forEach((q) => {
    if (!bySection[q.section]) bySection[q.section] = { answered: 0, notAnswered: 0, marked: 0, notVisited: 0 };
    const st = bySection[q.section];
    const status = statusOf(states[q.question_id]);
    if (status === 'answered' || status === 'answered_marked') st.answered++;
    else if (status === 'not_answered') { st.notAnswered++; notAnsweredTotal++; }
    else if (status === 'marked') st.marked++;
    else { st.notVisited++; notVisitedTotal++; }
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="bg-inverse-surface text-inverse-on-surface px-6 py-4">
          <h2 className="font-headline-sm text-headline-sm">Submit Exam</h2>
        </div>
        <div className="p-6 overflow-y-auto">
          <p className="font-body-md text-body-md text-on-surface mb-1">
            Are you sure you want to submit? Once submitted, you cannot change any of your answers.
          </p>
          {error && <p className="font-label-md text-label-md text-error mt-2">{error}</p>}

          <div className="mt-5 border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 bg-surface-container-lowest px-4 py-2 font-label-sm text-label-sm text-text-muted uppercase tracking-wide">
              <span className="col-span-2">Section</span>
              <span className="text-center">Ans</span>
              <span className="text-center">Not Ans</span>
              <span className="text-center">Marked</span>
            </div>
            {sectionOrder.map((section, i) => {
              const s = bySection[section];
              return (
                <div key={section} className={`grid grid-cols-5 px-4 py-2.5 font-body-md text-body-md ${i !== sectionOrder.length - 1 ? 'border-b border-border' : ''}`}>
                  <span className="col-span-2 text-on-surface">{sectionTitleByCode[section]}</span>
                  <span className="text-center text-success font-bold">{s.answered}</span>
                  <span className="text-center text-error font-bold">{s.notAnswered}</span>
                  <span className="text-center text-secondary font-bold">{s.marked}</span>
                </div>
              );
            })}
          </div>

          {(notVisitedTotal + notAnsweredTotal) > 0 && (
            <div className="mt-4 bg-error-container/20 border border-error/20 rounded-lg p-3 font-label-md text-label-sm text-on-error-container">
              You have {notVisitedTotal} question(s) not visited and {notAnsweredTotal} not answered. These will be scored as zero.
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t border-border">
          <button onClick={onCancel} disabled={submitting} className="flex-1 py-3 rounded-lg border border-border text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors">
            Go Back to Exam
          </button>
          <button onClick={onConfirm} disabled={submitting} className="flex-1 py-3 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-2">
            {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Yes, Submit
          </button>
        </div>
      </div>
    </div>
  );
}
