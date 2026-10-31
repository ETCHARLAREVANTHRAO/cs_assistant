import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  pyqAssetUrl,
  resourcesGetSummary,
  resourcesUpdateErrorNotebook,
  type ErrorNotebookItem,
  type ResourcePYQSolution,
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
  const matches = (values: Array<string | null | undefined>) => !lowerQuery || values.some((value) => (value ?? '').toLowerCase().includes(lowerQuery));
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
    () => (summary?.book_recommendations ?? []).filter((item) => subjectMatches(item.subject) && matches([item.subject, item.title, item.author, item.use_for])),
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
    <Layout activePage="resources" title="Resources" searchPlaceholder="Search resources...">
      <div className="p-gutter max-w-container-max w-full mx-auto pb-32">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-stack-lg">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-text-primary">Resources</h2>
            <p className="font-body-md text-body-md text-text-muted mt-2">PYQ solutions, formulas, cheat sheets, short tricks, and mistakes in one place.</p>
          </div>
          {summary && (
            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
              <Metric icon="assignment" label="PYQs" value={summary.pyq_solutions.length} />
              <Metric icon="error" label="Errors" value={summary.error_notebook.filter((item) => !item.resolved).length} />
              <Metric icon="functions" label="Sheets" value={summary.formula_sheets.length + summary.cheat_sheets.length} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-surface rounded-lg border border-border shadow-soft p-4 space-y-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">search</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  className="w-full rounded-lg border border-border bg-surface-container-lowest pl-10 pr-3 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All subjects</option>
                {subjects.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <div className="grid grid-cols-1 gap-2">
                <TabButton active={activeTab === 'errors'} icon="error" label="Error Notebook" count={errorItems.length} onClick={() => setActiveTab('errors')} />
                <TabButton active={activeTab === 'pyqs'} icon="school" label="PYQ Solutions" count={pyqItems.length} onClick={() => setActiveTab('pyqs')} />
                <TabButton active={activeTab === 'formulas'} icon="functions" label="Formulas" count={formulaItems.length} onClick={() => setActiveTab('formulas')} />
                <TabButton active={activeTab === 'cheats'} icon="article_shortcut" label="Cheat Sheets" count={cheatItems.length} onClick={() => setActiveTab('cheats')} />
                <TabButton active={activeTab === 'tricks'} icon="tips_and_updates" label="Short Tricks" count={trickItems.length} onClick={() => setActiveTab('tricks')} />
                <TabButton active={activeTab === 'books'} icon="menu_book" label="Standard Books" count={bookItems.length} onClick={() => setActiveTab('books')} />
              </div>
            </div>
          </aside>

          <section className="lg:col-span-9 space-y-4">
            {error && <div className="rounded-lg border border-error/30 bg-error-container/30 p-4 text-on-error-container font-body-md text-body-md">{error}</div>}
            {loading ? (
              <div className="flex items-center gap-3 rounded-lg bg-surface border border-border p-5 text-text-muted font-label-md text-label-md">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading resources...
              </div>
            ) : (
              <>
                {activeTab === 'errors' && (
                  <div className="space-y-3">
                    {errorItems.length === 0 ? <EmptyState text="No incorrect questions found yet." /> : errorItems.map((item) => (
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
                    ))}
                  </div>
                )}
                {activeTab === 'pyqs' && (
                  <div className="space-y-3">
                    {pyqItems.map((item) => <PYQSolutionCard key={`${item.paper_id}-${item.question_id}`} item={item} expanded={expanded === `${item.paper_id}-${item.question_id}`} onExpand={() => setExpanded(expanded === `${item.paper_id}-${item.question_id}` ? '' : `${item.paper_id}-${item.question_id}`)} />)}
                  </div>
                )}
                {activeTab === 'formulas' && <ListSheets items={formulaItems.map((item) => ({ title: item.chapter, subject: item.subject, rows: item.formulas, icon: 'functions' }))} />}
                {activeTab === 'cheats' && <ListSheets items={cheatItems.map((item) => ({ title: item.chapter, subject: item.subject, rows: item.points, icon: 'article_shortcut' }))} />}
                {activeTab === 'tricks' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trickItems.map((item) => (
                      <div key={`${item.subject}-${item.title}`} className="bg-surface rounded-lg border border-border shadow-soft p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-secondary">tips_and_updates</span>
                          <span className="font-label-sm text-label-sm text-text-muted">{item.subject}</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2">{item.title}</h3>
                        <p className="font-body-md text-body-md text-on-surface">{item.trick}</p>
                        {item.example && <p className="mt-3 rounded-lg bg-surface-container-lowest p-3 font-body-md text-body-md text-text-muted">{item.example}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'books' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookItems.map((item) => (
                      <div key={`${item.subject}-${item.title}`} className="bg-surface rounded-lg border border-border shadow-soft p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-primary/10 text-primary">{item.subject}</span>
                            <span className="material-symbols-outlined text-text-muted text-sm">auto_stories</span>
                          </div>
                          <h3 className="font-headline-sm text-headline-sm text-text-primary mb-1">{item.title}</h3>
                          <p className="font-label-md text-label-md text-text-muted mb-3">by {item.author}</p>
                          <p className="font-body-md text-body-md text-on-surface bg-surface-container-lowest rounded-lg p-3">{item.use_for}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                          <a
                            href={`https://openlibrary.org/search?q=${encodeURIComponent(item.title + ' ' + item.author)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary font-label-md text-label-md hover:underline"
                          >
                            <span>Open Library Preview</span>
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                          </a>
                          <a
                            href={`https://www.google.com/search?tbm=bks&q=${encodeURIComponent(item.title + ' ' + item.author)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-text-muted font-label-sm text-label-sm hover:text-text-primary"
                          >
                            <span>Google Books</span>
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

function ErrorCard({ item, expanded, saving, onExpand, onToggle, onSaveNote, onReview }: { item: ErrorNotebookItem; expanded: boolean; saving: boolean; onExpand: () => void; onToggle: () => void; onSaveNote: (note: string) => void; onReview: () => void }) {
  const [note, setNote] = useState(item.note);
  useEffect(() => setNote(item.note), [item.note]);
  return (
    <div className="bg-surface rounded-lg border border-border shadow-soft p-5">
      <QuestionHeader title={item.question} subject={item.subject} chapter={item.chapter} topic={item.topic} status={item.status} />
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Badge label={`Your: ${formatAnswer(item.given_answer)}`} tone="error" />
        <Badge label={`Correct: ${formatAnswer(item.correct_answer)}`} tone="success" />
        <Badge label={`${item.marks_awarded} marks`} />
        {item.difficulty && <Badge label={item.difficulty} />}
      </div>
      {expanded && <SolutionBlock item={item} />}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mt-4 pt-4 border-t border-border">
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Personal note" className="flex-1 rounded-lg border border-border bg-surface-container-lowest px-3 py-2 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary" />
        <div className="flex items-center gap-2">
          <button onClick={() => onSaveNote(note)} disabled={saving} className="p-2 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-50" title="Save note"><span className="material-symbols-outlined">save</span></button>
          <button onClick={onToggle} disabled={saving} className={item.resolved ? 'px-3 py-2 rounded-lg border border-border text-text-muted font-label-md text-label-md' : 'px-3 py-2 rounded-lg bg-success text-white font-label-md text-label-md'}>{item.resolved ? 'Reopen' : 'Resolved'}</button>
          <button onClick={onReview} className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-surface-container" title="Open review"><span className="material-symbols-outlined">open_in_new</span></button>
          <button onClick={onExpand} className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-surface-container" title="Expand"><span className="material-symbols-outlined">{expanded ? 'expand_less' : 'expand_more'}</span></button>
        </div>
      </div>
    </div>
  );
}

function PYQSolutionCard({ item, expanded, onExpand }: { item: ResourcePYQSolution; expanded: boolean; onExpand: () => void }) {
  return (
    <div className="bg-surface rounded-lg border border-border shadow-soft p-5">
      <QuestionHeader title={item.question} subject={item.subject} chapter={item.chapter} topic={item.topic} status={item.difficulty ?? item.question_type} />
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Badge label={item.paper_title} />
        <Badge label={`${item.marks} marks`} />
        <Badge label={`Answer: ${formatAnswer(item.correct_answer)}`} tone="success" />
      </div>
      {expanded && <SolutionBlock item={item} />}
      <button onClick={onExpand} className="mt-4 inline-flex items-center gap-2 text-primary font-label-md text-label-md">
        <span className="material-symbols-outlined text-sm">{expanded ? 'expand_less' : 'expand_more'}</span>
        {expanded ? 'Hide solution' : 'Show solution'}
      </button>
    </div>
  );
}

function SolutionBlock({ item }: { item: ErrorNotebookItem | ResourcePYQSolution }) {
  return (
    <div className="mt-4 rounded-lg bg-surface-container-lowest border border-border p-4 space-y-4">
      {isImagePath(item.image_url) && <img src={pyqAssetUrl(item.image_url)} alt="" className="max-w-full rounded-lg border border-border" />}
      {item.options && (
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(item.options).map(([key, value]) => (
            <div key={key} className="flex gap-3 rounded-lg bg-surface px-3 py-2 font-body-md text-body-md">
              <span className="font-bold text-text-muted">{key}</span>
              <span className="break-words">{isImagePath(value) ? <img src={pyqAssetUrl(value)} alt="" className="max-h-16" /> : value}</span>
            </div>
          ))}
        </div>
      )}
      {item.explanation && <p className="font-body-md text-body-md text-on-surface whitespace-pre-line">{item.explanation}</p>}
      {item.solution_steps && item.solution_steps.length > 0 && (
        <ol className="space-y-2">
          {item.solution_steps.map((step, index) => <li key={index} className="font-body-md text-body-md text-on-surface">{index + 1}. {step}</li>)}
        </ol>
      )}
    </div>
  );
}

function ListSheets({ items }: { items: Array<{ title: string; subject: string; rows: string[]; icon: string }> }) {
  if (items.length === 0) return <EmptyState text="No matching resources." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={`${item.subject}-${item.title}`} className="bg-surface rounded-lg border border-border shadow-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary">{item.icon}</span>
            <span className="font-label-sm text-label-sm text-text-muted">{item.subject}</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-text-primary mb-3">{item.title}</h3>
          <ul className="space-y-2">
            {item.rows.map((row) => <li key={row} className="font-body-md text-body-md text-on-surface flex gap-2"><span className="text-primary">-</span><span>{row}</span></li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function QuestionHeader({ title, subject, chapter, topic, status }: { title: string; subject: string | null; chapter: string | null; topic: string | null; status: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {subject && <Badge label={subject} tone="primary" />}
          {chapter && <Badge label={chapter} />}
          {topic && <Badge label={topic} />}
        </div>
        <p className="font-body-lg text-body-lg text-on-surface whitespace-pre-line break-words">{title}</p>
      </div>
      <span className="shrink-0 rounded-md bg-surface-variant px-2 py-1 font-label-sm text-label-sm text-on-surface-variant">{status.replace('_', ' ')}</span>
    </div>
  );
}

function TabButton({ active, icon, label, count, onClick }: { active: boolean; icon: string; label: string; count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className={active ? 'flex items-center justify-between gap-3 rounded-lg bg-primary text-white px-3 py-2.5 font-label-md text-label-md' : 'flex items-center justify-between gap-3 rounded-lg text-on-surface-variant hover:bg-surface-container px-3 py-2.5 font-label-md text-label-md'}>
      <span className="flex items-center gap-2 min-w-0"><span className="material-symbols-outlined text-sm">{icon}</span><span className="truncate">{label}</span></span>
      <span className={active ? 'text-white/80' : 'text-text-muted'}>{count}</span>
    </button>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3 min-w-0 shadow-soft">
      <div className="flex items-center gap-2 text-text-muted"><span className="material-symbols-outlined text-sm">{icon}</span><span className="font-label-sm text-label-sm truncate">{label}</span></div>
      <p className="font-headline-sm text-headline-sm text-primary mt-1">{value}</p>
    </div>
  );
}

function Badge({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'primary' | 'success' | 'error' }) {
  const cls = tone === 'primary' ? 'bg-primary/10 text-primary' : tone === 'success' ? 'bg-success/10 text-success' : tone === 'error' ? 'bg-error/10 text-error' : 'bg-surface-variant text-on-surface-variant';
  return <span className={`rounded-md px-2 py-1 font-label-sm text-label-sm ${cls}`}>{label}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-text-muted font-body-md text-body-md">{text}</div>;
}

function formatAnswer(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.join(', ');
  if (value == null || value === '') return 'Blank';
  return String(value);
}

