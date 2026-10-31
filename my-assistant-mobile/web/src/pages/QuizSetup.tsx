import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  pyqGetPracticeTaxonomy,
  pyqStartPractice,
  type PracticeTaxonomyResponse,
} from '../services/api';

type DrillMode = 'mixed' | 'subject' | 'chapter' | 'topic';

const EMPTY_TAXONOMY: PracticeTaxonomyResponse = {
  subjects: [],
  chapters: [],
  topics: [],
  difficulty: [],
  question_types: [],
};

export default function QuizSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [taxonomy, setTaxonomy] = useState<PracticeTaxonomyResponse>(EMPTY_TAXONOMY);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<DrillMode>('mixed');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [questionCount, setQuestionCount] = useState(15);

  useEffect(() => {
    pyqGetPracticeTaxonomy()
      .then((data) => {
        setTaxonomy(data);
        const subjectParam = searchParams.get('subject');
        if (subjectParam && data.subjects.some((item) => item.name === subjectParam)) {
          setMode('subject');
          setSubject(subjectParam);
        }
      })
      .catch(() => setError('Could not load practice options. Please refresh to try again.'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const chapters = useMemo(
    () => taxonomy.chapters.filter((item) => !subject || item.subject === subject),
    [taxonomy.chapters, subject],
  );

  const topics = useMemo(
    () => taxonomy.topics.filter((item) => (!subject || item.subject === subject) && (!chapter || item.chapter === chapter)),
    [taxonomy.topics, subject, chapter],
  );

  const selectedAvailableCount = useMemo(() => {
    let count = taxonomy.subjects.reduce((sum, item) => sum + item.question_count, 0);
    if (mode === 'subject' && subject) count = taxonomy.subjects.find((item) => item.name === subject)?.question_count ?? 0;
    if (mode === 'chapter' && chapter) count = chapters.find((item) => item.name === chapter)?.question_count ?? 0;
    if (mode === 'topic' && topic) count = topics.find((item) => item.name === topic)?.question_count ?? 0;
    if (difficulty) count = Math.min(count, taxonomy.difficulty.find((item) => item.name === difficulty)?.question_count ?? 0);
    if (questionType) count = Math.min(count, taxonomy.question_types.find((item) => item.name === questionType)?.question_count ?? 0);
    return count;
  }, [chapter, chapters, difficulty, mode, questionType, subject, taxonomy, topic, topics]);

  function setPracticeMode(nextMode: DrillMode) {
    setMode(nextMode);
    setSubject('');
    setChapter('');
    setTopic('');
  }

  async function startPractice() {
    setError('');
    setStarting(true);
    try {
      const attempt = await pyqStartPractice({
        subjects: subject ? [subject] : [],
        chapters: chapter ? [chapter] : [],
        topics: topic ? [topic] : [],
        difficulty: difficulty ? [difficulty] : [],
        question_types: questionType ? [questionType] : [],
        count: questionCount,
      });
      navigate(`/pyq/attempt/${attempt.attempt_id}`, { state: { attempt } });
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not start practice. Please change filters and try again.');
      setStarting(false);
    }
  }

  const requiresSubject = mode === 'subject' || mode === 'chapter' || mode === 'topic';
  const requiresChapter = mode === 'chapter' || mode === 'topic';
  const canStart = !loading && !starting && (!requiresSubject || subject) && (!requiresChapter || chapter) && (mode !== 'topic' || topic);

  return (
    <Layout activePage="quiz" title="Practice Setup">
      <div className="p-gutter overflow-y-auto w-full max-w-container-max mx-auto pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-surface rounded-lg shadow-soft border border-border p-6 flex flex-col gap-stack-lg">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2">Configure PYQ Practice</h3>
              <p className="font-body-md text-body-md text-text-muted">
                Build a drill directly from the current PYQ JSON bank.
              </p>
            </div>

            {error && (
              <div className="bg-error-container/30 border border-error/30 text-on-error-container rounded-lg p-4 font-body-md text-body-md">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center gap-3 text-text-muted font-label-md text-label-md">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading practice options...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ModeButton active={mode === 'mixed'} icon="shuffle" label="Mixed" onClick={() => setPracticeMode('mixed')} />
                  <ModeButton active={mode === 'subject'} icon="library_books" label="Subject" onClick={() => setPracticeMode('subject')} />
                  <ModeButton active={mode === 'chapter'} icon="topic" label="Chapter" onClick={() => setPracticeMode('chapter')} />
                  <ModeButton active={mode === 'topic'} icon="my_location" label="Topic" onClick={() => setPracticeMode('topic')} />
                </div>

                {mode !== 'mixed' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField label="Subject" value={subject} onChange={(value) => { setSubject(value); setChapter(''); setTopic(''); }} options={taxonomy.subjects.map((item) => item.name)} />
                    {(mode === 'chapter' || mode === 'topic') && (
                      <SelectField label="Chapter" value={chapter} onChange={(value) => { setChapter(value); setTopic(''); }} options={chapters.map((item) => item.name)} disabled={!subject} />
                    )}
                    {mode === 'topic' && (
                      <SelectField label="Topic" value={topic} onChange={setTopic} options={topics.map((item) => item.name)} disabled={!chapter} />
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField label="Difficulty" value={difficulty} onChange={setDifficulty} options={taxonomy.difficulty.map((item) => item.name)} placeholder="Any difficulty" />
                  <SelectField label="Question Type" value={questionType} onChange={setQuestionType} options={taxonomy.question_types.map((item) => item.name)} placeholder="Any type" />
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <label className="font-label-md text-label-md text-text-primary" htmlFor="question-count">
                      Number of Questions
                    </label>
                    <span className="font-code text-code text-primary bg-primary-fixed px-2 py-1 rounded-md font-medium">
                      {questionCount}
                    </span>
                  </div>
                  <input
                    className="w-full h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
                    id="question-count"
                    max={50}
                    min={1}
                    step={1}
                    type="range"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                  />
                  <div className="flex justify-between text-text-muted font-label-sm text-label-sm px-1">
                    <span>1</span>
                    <span>50</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
                  <div className="font-label-md text-label-md text-text-muted">
                    {selectedAvailableCount} matching questions available
                  </div>
                  <button
                    onClick={startPractice}
                    disabled={!canStart}
                    className="bg-primary hover:bg-on-primary-fixed-variant text-white font-label-md text-label-md py-3 px-8 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {starting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    <span>Start Practice</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <aside className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface rounded-lg shadow-soft border border-border p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">insights</span>
                <h3 className="font-headline-sm text-headline-sm text-text-primary">Question Bank</h3>
              </div>
              <StatRow label="Subjects" value={taxonomy.subjects.length} />
              <StatRow label="Chapters" value={taxonomy.chapters.length} />
              <StatRow label="Topics" value={taxonomy.topics.length} />
            </div>

            <div className="bg-surface rounded-lg shadow-soft border border-border p-5">
              <h3 className="font-headline-sm text-headline-sm text-text-primary mb-4">Top Subjects</h3>
              <div className="space-y-3">
                {taxonomy.subjects.slice(0, 6).map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3">
                    <span className="font-label-md text-label-md text-on-surface truncate">{item.name}</span>
                    <span className="font-code text-code text-text-muted">{item.question_count}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

function ModeButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? 'flex items-center justify-center gap-2 rounded-lg bg-primary text-white border border-primary px-4 py-3 font-label-md text-label-md shadow-sm'
          : 'flex items-center justify-center gap-2 rounded-lg bg-surface border border-border text-on-surface-variant px-4 py-3 font-label-md text-label-md hover:border-primary/40 hover:text-primary transition-colors'
      }
    >
      <span className="material-symbols-outlined text-sm">{icon}</span>
      {label}
    </button>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-label-md text-label-md text-text-primary">{label}</label>
      <div className="relative">
        <select
          className="w-full bg-surface-container-lowest border border-border text-on-background rounded-lg px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body-md transition-all disabled:opacity-50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
          <span className="material-symbols-outlined">expand_more</span>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-3 first:border-t-0 first:pt-0">
      <span className="font-label-md text-label-md text-text-muted">{label}</span>
      <span className="font-headline-sm text-headline-sm text-primary">{value}</span>
    </div>
  );
}
