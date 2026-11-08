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

const MODE_CONFIGS: Record<DrillMode, { title: string; subtitle: string; icon: string; tag: string }> = {
  mixed: {
    title: 'Full Mixed Drill',
    subtitle: 'Simulates genuine GATE exam question distribution across all syllabus subjects.',
    icon: 'shuffle',
    tag: 'Recommended',
  },
  subject: {
    title: 'Subject Focus',
    subtitle: 'Concentrate on one core discipline like Operating Systems or Algorithms.',
    icon: 'library_books',
    tag: 'Targeted',
  },
  chapter: {
    title: 'Chapter Deep Dive',
    subtitle: 'Hone in on specific modules such as Process Synchronization or Graph Algorithms.',
    icon: 'topic',
    tag: 'Specific',
  },
  topic: {
    title: 'Micro-Topic Mastery',
    subtitle: 'Master fine-grained topics like Dijkstra Algorithm, Banker’s Algorithm, or Paging.',
    icon: 'my_location',
    tag: 'Precision',
  },
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

  const totalQuestionsInBank = taxonomy.subjects.reduce((sum, item) => sum + item.question_count, 0);

  return (
    <Layout activePage="quiz" title="Practice Setup">
      <div className="max-w-container-max mx-auto px-4 md:px-gutter pb-16 flex flex-col gap-8">
        
        {/* Resq.io Inspired Ambient Beam Hero Header */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Adaptive Practice Engine
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight gradient-text">
                Custom GATE CS Quiz Builder
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
                Construct custom practice sessions from real GATE Computer Science papers (2012–2026).
                Filter by subject, taxonomy chapter, difficulty tier, and question type with official marking schemes.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3.5 text-center">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Bank Qs</div>
                <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{totalQuestionsInBank || '1,280+'}</div>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3.5 text-center">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Subjects</div>
                <div className="text-xl sm:text-2xl font-bold text-indigo-300 mt-0.5">{taxonomy.subjects.length || '10'}</div>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3.5 text-center col-span-2 sm:col-span-1">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Simulation</div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5">TCS iON</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded-2xl p-4 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Quiz Configuration */}
          <div className="lg:col-span-8 bg-surface rounded-3xl shadow-soft border border-border p-6 sm:p-8 flex flex-col gap-6">
            
            {/* Mode Selection Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">1. Choose Drill Mode</h2>
                  <p className="text-xs text-text-muted mt-0.5">Select how wide or narrow your practice session should be</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(['mixed', 'subject', 'chapter', 'topic'] as DrillMode[]).map((m) => {
                  const cfg = MODE_CONFIGS[m];
                  const isActive = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPracticeMode(m)}
                      className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer ${
                        isActive
                          ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-glow-sm'
                          : 'border-border bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'bg-surface-container text-text-muted group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                          <span className="material-symbols-outlined text-lg">{cfg.icon}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isActive
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'bg-surface-container text-text-muted'
                        }`}>
                          {cfg.tag}
                        </span>
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                          {cfg.title}
                        </h3>
                        <p className="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
                          {cfg.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Selectors */}
            {mode !== 'mixed' && (
              <div className="pt-2 border-t border-border/60">
                <h2 className="text-lg font-bold text-text-primary mb-1">2. Target Selection</h2>
                <p className="text-xs text-text-muted mb-4">Pick the exact syllabus section to test</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SelectField
                    label="Subject *"
                    value={subject}
                    onChange={(value) => { setSubject(value); setChapter(''); setTopic(''); }}
                    options={taxonomy.subjects.map((item) => item.name)}
                    icon="school"
                  />
                  {(mode === 'chapter' || mode === 'topic') && (
                    <SelectField
                      label="Chapter *"
                      value={chapter}
                      onChange={(value) => { setChapter(value); setTopic(''); }}
                      options={chapters.map((item) => item.name)}
                      disabled={!subject}
                      placeholder={subject ? 'Choose chapter...' : 'Select subject first'}
                      icon="auto_stories"
                    />
                  )}
                  {mode === 'topic' && (
                    <SelectField
                      label="Topic *"
                      value={topic}
                      onChange={setTopic}
                      options={topics.map((item) => item.name)}
                      disabled={!chapter}
                      placeholder={chapter ? 'Choose topic...' : 'Select chapter first'}
                      icon="pin_drop"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Difficulty & Question Type Filters */}
            <div className="pt-2 border-t border-border/60">
              <h2 className="text-lg font-bold text-text-primary mb-1">
                {mode === 'mixed' ? '2. Filters & Question Format' : '3. Filters & Question Format'}
              </h2>
              <p className="text-xs text-text-muted mb-4">Optionally filter by official GATE difficulty or question type</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Difficulty Level"
                  value={difficulty}
                  onChange={setDifficulty}
                  options={taxonomy.difficulty.map((item) => item.name)}
                  placeholder="All Difficulties (Mixed)"
                  icon="bar_chart"
                />
                <SelectField
                  label="Question Type"
                  value={questionType}
                  onChange={setQuestionType}
                  options={taxonomy.question_types.map((item) => item.name)}
                  placeholder="All Types (MCQ, MSQ, NAT)"
                  icon="checklist"
                />
              </div>
            </div>

            {/* Question Count Slider */}
            <div className="pt-2 border-t border-border/60 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">
                    {mode === 'mixed' ? '3. Number of Questions' : '4. Number of Questions'}
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">Choose your drill length</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-primary font-mono">{questionCount}</span>
                  <span className="text-xs font-semibold text-text-muted uppercase">Qs</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                {[5, 10, 15, 25, 30, 50].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      questionCount === count
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface-container-low text-text-muted hover:text-text-primary border border-border'
                    }`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>

              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-2.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />

              <div className="flex justify-between text-xs text-text-muted font-medium px-1">
                <span>Quick Sprint (1 Q)</span>
                <span>Standard Test (25 Qs)</span>
                <span>Deep Drill (50 Qs)</span>
              </div>
            </div>

            {/* Launch Action Footer */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                <span>
                  <strong className="text-text-primary font-semibold">{selectedAvailableCount}</strong> questions available in this criteria
                </span>
              </div>

              <button
                type="button"
                onClick={startPractice}
                disabled={!canStart}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-sm shadow-glow-sm hover:shadow-glow-md active:scale-98 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {starting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Preparing Practice Test...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">rocket_launch</span>
                    <span>Start Practice Session</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Aside: Question Bank Intelligence */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Question Bank Coverage */}
            <div className="bg-surface rounded-3xl shadow-soft border border-border p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">insights</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Question Bank Summary</h3>
                  <p className="text-xs text-text-muted">Directly verified from authentic papers</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <StatRow label="Official Subjects" value={taxonomy.subjects.length} icon="menu_book" />
                <StatRow label="Syllabus Chapters" value={taxonomy.chapters.length} icon="folder_open" />
                <StatRow label="Target Topics" value={taxonomy.topics.length} icon="grain" />
                <StatRow label="Marking Scheme" value="Negative Marking (-0.33 / -0.66)" icon="balance" isText />
              </div>
            </div>

            {/* Top Weightage Subjects */}
            <div className="bg-surface rounded-3xl shadow-soft border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-text-primary">Subject Distribution</h3>
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">High-Yield</span>
              </div>

              <div className="space-y-3.5">
                {taxonomy.subjects.slice(0, 6).map((item) => {
                  const pct = totalQuestionsInBank > 0 ? Math.round((item.question_count / totalQuestionsInBank) * 100) : 0;
                  return (
                    <div
                      key={item.name}
                      onClick={() => { setPracticeMode('subject'); setSubject(item.name); }}
                      className="group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                          {item.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-text-muted">
                          {item.question_count} Qs
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct * 2, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exam Simulation Tip */}
            <div className="rounded-3xl p-5 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 text-xs text-text-muted flex gap-3">
              <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">tips_and_updates</span>
              <div>
                <p className="font-bold text-text-primary mb-1">GATE Exam Simulator Rules</p>
                <p className="leading-relaxed">
                  Real GATE rules apply during tests: 1-mark MCQs deduct 0.33, 2-mark MCQs deduct 0.66.
                  MSQ (Multiple Select) and NAT (Numerical) questions carry zero negative penalty.
                </p>
              </div>
            </div>

          </aside>

        </div>
      </div>
    </Layout>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  icon?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
        {icon && <span className="material-symbols-outlined text-sm text-text-muted">{icon}</span>}
        {label}
      </label>
      <div className="relative">
        <select
          className="w-full bg-surface-container-lowest border border-border text-text-primary rounded-xl px-3.5 py-3 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
          <span className="material-symbols-outlined text-base">expand_more</span>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, icon, isText = false }: { label: string; value: string | number; icon: string; isText?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-border/50 pt-2.5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className="material-symbols-outlined text-sm">{icon}</span>
        <span>{label}</span>
      </div>
      <span className={`text-xs font-bold ${isText ? 'text-primary' : 'font-mono text-text-primary'}`}>
        {value}
      </span>
    </div>
  );
}
