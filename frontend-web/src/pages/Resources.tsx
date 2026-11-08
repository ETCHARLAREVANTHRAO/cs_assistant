import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  pyqAssetUrl,
  resourcesGetSummary,
  resourcesUpdateErrorNotebook,
  type ErrorNotebookItem,
  type ResourcePYQSolution,
  type ResourceBookRecommendation,
  type ResourcesSummaryResponse,
} from '../services/api';

type TabKey = 'errors' | 'pyqs' | 'formulas' | 'cheats' | 'tricks' | 'books';

const isImagePath = (value: string | null | undefined): value is string => !!value && value.startsWith('/pyq-assets/');

export default function Resources() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ResourcesSummaryResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('errors');
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [expanded, setExpanded] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    resourcesGetSummary()
      .then(setSummary)
      .catch(() => setError('Could not load resources. Please refresh to try again.'))
      .finally(() => setLoading(false));
  }, []);

  const subjects = useMemo(() => {
    const names = new Set<string>();
    summary?.formula_sheets.forEach((item) => names.add(item.subject));
    summary?.cheat_sheets.forEach((item) => names.add(item.subject));
    summary?.short_tricks.forEach((item) => names.add(item.subject));
    summary?.pyq_solutions.forEach((item) => item.subject && names.add(item.subject));
    summary?.error_notebook.forEach((item) => item.subject && names.add(item.subject));
    return Array.from(names).sort();
  }, [summary]);

  const lowerQuery = query.trim().toLowerCase();
  const matches = (values: Array<string | null | undefined>) =>
    !lowerQuery || values.some((value) => (value ?? '').toLowerCase().includes(lowerQuery));
  const subjectMatches = (value: string | null | undefined) => !subject || value === subject;

  const errorItems = useMemo(
    () => (summary?.error_notebook ?? []).filter((item) => subjectMatches(item.subject) && matches([item.question, item.topic, item.chapter, item.paper_title])),
    [summary, subject, lowerQuery],
  );

  const pyqItems = useMemo(
    () => (summary?.pyq_solutions ?? []).filter((item) => subjectMatches(item.subject) && matches([item.question, item.topic, item.chapter, item.paper_title])),
    [summary, subject, lowerQuery],
  );

  const formulaItems = useMemo(
    () => (summary?.formula_sheets ?? []).filter((item) => subjectMatches(item.subject) && matches([item.subject, item.chapter, item.formulas.join(' ')])),
    [summary, subject, lowerQuery],
  );

  const cheatItems = useMemo(
    () => (summary?.cheat_sheets ?? []).filter((item) => subjectMatches(item.subject) && matches([item.subject, item.chapter, item.points.join(' ')])),
    [summary, subject, lowerQuery],
  );

  const trickItems = useMemo(
    () => (summary?.short_tricks ?? []).filter((item) => subjectMatches(item.subject) && matches([item.subject, item.title, item.trick, item.example])),
    [summary, subject, lowerQuery],
  );

  const bookItems = useMemo(
    () => (summary?.book_recommendations ?? []).filter((item: ResourceBookRecommendation) => subjectMatches(item.subject) && matches([item.subject, item.title, item.author, item.use_for])),
    [summary, subject, lowerQuery],
  );

  async function toggleResolved(item: ErrorNotebookItem) {
    setSavingId(item.notebook_id);
    setError('');
    try {
      const data = await resourcesUpdateErrorNotebook(item.notebook_id, { resolved: !item.resolved });
      setSummary(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not update this notebook item.');
    } finally {
      setSavingId('');
    }
  }

  async function saveNote(item: ErrorNotebookItem, note: string) {
    setSavingId(item.notebook_id);
    setError('');
    try {
      const data = await resourcesUpdateErrorNotebook(item.notebook_id, { note });
      setSummary(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not save this note.');
    } finally {
      setSavingId('');
    }
  }

  return (
    <Layout activePage="resources" title="GATE CS Resource Hub" searchPlaceholder="Search formulas, cheats, tricks...">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Resq Beam Header Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-indigo-200">
                <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                <span>Curated High-Yield Revision Bank</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text tracking-tight">
                Formulas, Cheat Sheets, Short Tricks &amp; Error Notebook
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Everything you need for last-minute revision: standard definitions, tricky recurrence shortcuts, and your personal exam mistakes automatically recorded for targeted review.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            {summary && (
              <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[90px]">
                  <p className="text-xl font-bold text-white">{summary.pyq_solutions.length}</p>
                  <p className="text-[10px] text-indigo-300">PYQ Solns</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[90px]">
                  <p className="text-xl font-bold text-rose-400">
                    {summary.error_notebook.filter((item) => !item.resolved).length}
                  </p>
                  <p className="text-[10px] text-slate-300">Open Errors</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[90px]">
                  <p className="text-xl font-bold text-cyan-400">
                    {summary.formula_sheets.length + summary.cheat_sheets.length}
                  </p>
                  <p className="text-[10px] text-slate-300">Sheets</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Workstation Grid: Aside Tabs + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Aside Navigator */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-4 space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                  search
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter resources..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Subjects</option>
                {subjects.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <div className="pt-2 space-y-1">
                <TabButton
                  active={activeTab === 'errors'}
                  icon="assignment_late"
                  label="Error Notebook"
                  count={errorItems.length}
                  onClick={() => setActiveTab('errors')}
                />
                <TabButton
                  active={activeTab === 'pyqs'}
                  icon="school"
                  label="PYQ Solutions"
                  count={pyqItems.length}
                  onClick={() => setActiveTab('pyqs')}
                />
                <TabButton
                  active={activeTab === 'formulas'}
                  icon="functions"
                  label="Formula Sheets"
                  count={formulaItems.length}
                  onClick={() => setActiveTab('formulas')}
                />
                <TabButton
                  active={activeTab === 'cheats'}
                  icon="article"
                  label="Cheat Sheets"
                  count={cheatItems.length}
                  onClick={() => setActiveTab('cheats')}
                />
                <TabButton
                  active={activeTab === 'tricks'}
                  icon="tips_and_updates"
                  label="Short Tricks"
                  count={trickItems.length}
                  onClick={() => setActiveTab('tricks')}
                />
                <TabButton
                  active={activeTab === 'books'}
                  icon="menu_book"
                  label="Standard Books"
                  count={bookItems.length}
                  onClick={() => setActiveTab('books')}
                />
              </div>
            </div>
          </aside>

          {/* Main Resource Cards */}
          <section className="lg:col-span-9 space-y-4">
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-indigo-500 animate-spin">progress_activity</span>
                <p className="text-xs text-slate-400">Loading study resources...</p>
              </div>
            ) : (
              <>
                {activeTab === 'errors' && (
                  <div className="space-y-3">
                    {errorItems.length === 0 ? (
                      <EmptyState text="No unresolved errors recorded! Take a PYQ test to capture questions you answered incorrectly." />
                    ) : (
                      errorItems.map((item) => (
                        <ErrorCard
                          key={item.notebook_id}
                          item={item}
                          expanded={expanded === item.notebook_id}
                          saving={savingId === item.notebook_id}
                          onExpand={() => setExpanded(expanded === item.notebook_id ? '' : item.notebook_id)}
                          onToggle={() => toggleResolved(item)}
                          onSaveNote={(note) => saveNote(item, note)}
                          onReview={() => navigate(`/pyq/review/${item.attempt_id}`)}
                        />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'pyqs' && (
                  <div className="space-y-3">
                    {pyqItems.length === 0 ? (
                      <EmptyState text="No matching PYQ solutions found." />
                    ) : (
                      pyqItems.map((item) => (
                        <PYQSolutionCard
                          key={`${item.paper_id}-${item.question_id}`}
                          item={item}
                          expanded={expanded === `${item.paper_id}-${item.question_id}`}
                          onExpand={() => setExpanded(expanded === `${item.paper_id}-${item.question_id}` ? '' : `${item.paper_id}-${item.question_id}`)}
                        />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'formulas' && (
                  <ListSheets
                    items={formulaItems.map((item) => ({
                      title: item.chapter,
                      subject: item.subject,
                      rows: item.formulas,
                      icon: 'functions',
                    }))}
                  />
                )}

                {activeTab === 'cheats' && (
                  <ListSheets
                    items={cheatItems.map((item) => ({
                      title: item.chapter,
                      subject: item.subject,
                      rows: item.points,
                      icon: 'article',
                    }))}
                  />
                )}

                {activeTab === 'tricks' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trickItems.map((item) => (
                      <div
                        key={`${item.subject}-${item.title}`}
                        className="rounded-2xl p-5 bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                            {item.subject}
                          </span>
                          <span className="material-symbols-outlined text-[18px] text-amber-500">tips_and_updates</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.trick}</p>
                        {item.example && (
                          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 p-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                            <span className="font-sans font-bold text-slate-700 dark:text-slate-300 block mb-1">Example:</span>
                            {item.example}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'books' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookItems.map((item: ResourceBookRecommendation) => (
                      <div
                        key={`${item.subject}-${item.title}`}
                        className="rounded-2xl p-5 bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                              {item.subject}
                            </span>
                            <span className="material-symbols-outlined text-[18px] text-indigo-500">menu_book</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Author: {item.author}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800/60">
                            {item.use_for}
                          </p>
                        </div>
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold">
                          <a
                            href={`https://openlibrary.org/search?q=${encodeURIComponent(item.title + ' ' + item.author)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <span>Open Library</span>
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          </a>
                          <a
                            href={`https://www.google.com/search?tbm=bks&q=${encodeURIComponent(item.title + ' ' + item.author)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          >
                            Google Books
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}

function ErrorCard({
  item,
  expanded,
  saving,
  onExpand,
  onToggle,
  onSaveNote,
  onReview,
}: {
  item: ErrorNotebookItem;
  expanded: boolean;
  saving: boolean;
  onExpand: () => void;
  onToggle: () => void;
  onSaveNote: (note: string) => void;
  onReview: () => void;
}) {
  const [note, setNote] = useState(item.note);
  useEffect(() => setNote(item.note), [item.note]);

  return (
    <div className="rounded-2xl p-5 bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
      <QuestionHeader title={item.question} subject={item.subject} chapter={item.chapter} topic={item.topic} status={item.status} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={`Your Answer: ${formatAnswer(item.given_answer)}`} tone="error" />
        <Badge label={`Correct Answer: ${formatAnswer(item.correct_answer)}`} tone="success" />
        <Badge label={`${item.marks_awarded} marks`} />
        {item.difficulty && <Badge label={item.difficulty} />}
      </div>
      {expanded && <SolutionBlock item={item} />}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add personal correction note (e.g. remember 0-indexed frame count)..."
          className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => onSaveNote(note)}
            disabled={saving}
            className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            title="Save note"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
          </button>
          <button
            onClick={onToggle}
            disabled={saving}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold ${
              item.resolved
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                : 'bg-emerald-500 text-white shadow-sm'
            }`}
          >
            {item.resolved ? 'Reopen' : 'Mark Resolved'}
          </button>
          <button
            onClick={onReview}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            title="Open full exam review"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </button>
          <button
            onClick={onExpand}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            title="Toggle solution"
          >
            <span className="material-symbols-outlined text-[18px]">
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PYQSolutionCard({
  item,
  expanded,
  onExpand,
}: {
  item: ResourcePYQSolution;
  expanded: boolean;
  onExpand: () => void;
}) {
  return (
    <div className="rounded-2xl p-5 bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
      <QuestionHeader title={item.question} subject={item.subject} chapter={item.chapter} topic={item.topic} status={item.difficulty ?? item.question_type} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={item.paper_title} />
        <Badge label={`${item.marks} marks`} />
        <Badge label={`Key: ${formatAnswer(item.correct_answer)}`} tone="success" />
      </div>
      {expanded && <SolutionBlock item={item} />}
      <button
        onClick={onExpand}
        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-1"
      >
        <span className="material-symbols-outlined text-[16px]">{expanded ? 'expand_less' : 'expand_more'}</span>
        <span>{expanded ? 'Hide full derivation' : 'View step-by-step solution'}</span>
      </button>
    </div>
  );
}

function SolutionBlock({ item }: { item: ErrorNotebookItem | ResourcePYQSolution }) {
  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 p-4 space-y-3 text-xs">
      {isImagePath(item.image_url) && (
        <img src={pyqAssetUrl(item.image_url)} alt="Question Figure" className="max-w-full rounded-xl border border-slate-200 dark:border-slate-700" />
      )}
      {item.options && (
        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(item.options).map(([key, value]) => (
            <div key={key} className="flex gap-2.5 rounded-xl bg-white dark:bg-[#0f111e] px-3 py-2 border border-slate-200/60 dark:border-slate-800/60">
              <span className="font-bold text-slate-400">{key}</span>
              <span className="text-slate-800 dark:text-slate-200">
                {isImagePath(value) ? <img src={pyqAssetUrl(value)} alt="" className="max-h-16" /> : value}
              </span>
            </div>
          ))}
        </div>
      )}
      {item.explanation && (
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{item.explanation}</p>
      )}
      {item.solution_steps && item.solution_steps.length > 0 && (
        <ol className="space-y-1 list-decimal pl-4 text-slate-700 dark:text-slate-300">
          {item.solution_steps.map((step, idx) => (
            <li key={idx} className="leading-relaxed">{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ListSheets({ items }: { items: Array<{ title: string; subject: string; rows: string[]; icon: string }> }) {
  if (items.length === 0) return <EmptyState text="No matching resource sheets found." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={`${item.subject}-${item.title}`} className="rounded-2xl p-5 bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              {item.subject}
            </span>
            <span className="material-symbols-outlined text-[18px] text-indigo-500">{item.icon}</span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</h3>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            {item.rows.map((row, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span className="leading-relaxed">{row}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function QuestionHeader({
  title,
  subject,
  chapter,
  topic,
  status,
}: {
  title: string;
  subject: string | null;
  chapter: string | null;
  topic: string | null;
  status: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {subject && <Badge label={subject} tone="primary" />}
          {chapter && <Badge label={chapter} />}
          {topic && <Badge label={topic} />}
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed">
          {title}
        </p>
      </div>
      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start shrink-0">
        {status.replace('_', ' ')}
      </span>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
        active
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
        <span>{label}</span>
      </div>
      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );
}

function Badge({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'primary' | 'success' | 'error' }) {
  const cls =
    tone === 'primary'
      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50'
      : tone === 'success'
      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
      : tone === 'error'
      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  return <span className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{label}</span>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400 space-y-2">
      <span className="material-symbols-outlined text-3xl text-slate-400">inventory_2</span>
      <p>{text}</p>
    </div>
  );
}

function formatAnswer(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.join(', ');
  if (value == null || value === '') return 'None';
  return String(value);
}
