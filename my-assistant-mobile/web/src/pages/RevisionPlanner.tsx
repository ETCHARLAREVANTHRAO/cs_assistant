import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Layout from '../components/Layout';
import {
  plannerCompleteTask,
  plannerCreateTask,
  plannerDeleteTask,
  plannerGetSummary,
  plannerSetGoal,
  plannerUpdateTask,
  type StudyPlannerSummary,
  type StudyPlanTask,
} from '../services/api';

const SUBJECTS = [
  'Engineering Mathematics',
  'Programming and Data Structures',
  'Algorithms',
  'Theory of Computation',
  'Compiler Design',
  'Operating Systems',
  'Databases',
  'Computer Networks',
  'Computer Organization and Architecture',
  'Digital Logic',
  'General Aptitude',
];

const EMPTY_FORM = {
  title: '',
  subject: '',
  topic: '',
  planned_date: new Date().toISOString().slice(0, 10),
  start_time: '09:00',
  duration_minutes: 60,
  priority: 'medium',
  notes: '',
  reminder_enabled: true,
};

export default function RevisionPlanner() {
  const [summary, setSummary] = useState<StudyPlannerSummary | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [weeklyGoal, setWeeklyGoal] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    const data = await plannerGetSummary();
    setSummary(data);
    setWeeklyGoal(data.weekly_hours_goal);
  }

  useEffect(() => {
    refresh()
      .catch(() => setError('Could not load your planner. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const todayTasks = useMemo(
    () => (summary?.tasks ?? []).filter((task) => task.planned_date === summary?.today_key),
    [summary],
  );

  const upcomingTasks = useMemo(
    () => (summary?.tasks ?? []).filter((task) => task.planned_date !== summary?.today_key).slice(0, 8),
    [summary],
  );

  const goalPercent = summary
    ? Math.min(100, Math.round((summary.weekly_completed_minutes / Math.max(1, summary.weekly_hours_goal * 60)) * 100))
    : 0;

  async function addTask(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Add a title for this study session.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await plannerCreateTask(form);
      setForm({ ...EMPTY_FORM, planned_date: form.planned_date, start_time: form.start_time });
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not save this study session.');
    } finally {
      setSaving(false);
    }
  }

  async function completeTask(taskId: string) {
    setError('');
    try {
      await plannerCompleteTask(taskId);
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not mark this session complete.');
    }
  }

  async function reopenTask(task: StudyPlanTask) {
    setError('');
    try {
      await plannerUpdateTask(task.task_id, { completed: false });
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not reopen this session.');
    }
  }

  async function deleteTask(taskId: string) {
    setError('');
    try {
      await plannerDeleteTask(taskId);
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not delete this session.');
    }
  }

  async function saveGoal() {
    setSaving(true);
    setError('');
    try {
      const data = await plannerSetGoal(weeklyGoal);
      setSummary(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not update weekly goal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout activePage="revision-planner" title="Study Planner" searchPlaceholder="Search sessions...">
      <div className="p-gutter max-w-container-max w-full mx-auto pb-32">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-stack-lg">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-text-primary">Study Planner</h2>
            <p className="font-body-md text-body-md text-text-muted mt-2">Plan sessions, finish goals, and keep revision visible.</p>
          </div>
          {summary && (
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <Metric icon="local_fire_department" label="Streak" value={`${summary.current_streak}d`} />
              <Metric icon="flag" label="Goal" value={`${goalPercent}%`} />
              <Metric icon="check_circle" label="Today" value={`${todayTasks.filter((task) => task.completed).length}/${todayTasks.length}`} />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-error/30 bg-error-container/30 p-4 font-body-md text-body-md text-on-error-container">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 rounded-lg bg-surface border border-border p-5 text-text-muted font-label-md text-label-md">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading planner...
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
            <section className="xl:col-span-8 space-y-stack-lg">
              <form onSubmit={addTask} className="bg-surface rounded-lg p-5 shadow-soft border border-border space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-headline-sm text-headline-sm text-text-primary">Add Study Session</h3>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="Process synchronization" />
                  <SelectInput label="Subject" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} options={SUBJECTS} />
                  <TextInput label="Topic" value={form.topic} onChange={(value) => setForm({ ...form, topic: value })} placeholder="Semaphores" />
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput type="date" label="Date" value={form.planned_date} onChange={(value) => setForm({ ...form, planned_date: value })} />
                    <TextInput type="time" label="Time" value={form.start_time} onChange={(value) => setForm({ ...form, start_time: value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput type="number" label="Minutes" value={String(form.duration_minutes)} onChange={(value) => setForm({ ...form, duration_minutes: Number(value) })} />
                    <SelectInput label="Priority" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} options={['high', 'medium', 'low']} />
                  </div>
                  <label className="flex items-center gap-3 rounded-lg border border-border bg-surface-container-lowest px-4 py-3 font-label-md text-label-md text-text-primary">
                    <input
                      type="checkbox"
                      checked={form.reminder_enabled}
                      onChange={(event) => setForm({ ...form, reminder_enabled: event.target.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                    Revision reminder
                  </label>
                </div>
                <TextInput label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} placeholder="Focus on PYQ mistakes" />
              </form>

              <TaskSection title="Today" tasks={todayTasks} onComplete={completeTask} onReopen={reopenTask} onDelete={deleteTask} />
              <TaskSection title="Upcoming" tasks={upcomingTasks} onComplete={completeTask} onReopen={reopenTask} onDelete={deleteTask} />
            </section>

            <aside className="xl:col-span-4 space-y-stack-md">
              <section className="bg-surface rounded-lg p-5 shadow-soft border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-headline-sm text-headline-sm text-text-primary">Weekly Goal</h3>
                  <button onClick={saveGoal} disabled={saving} className="text-primary font-label-md text-label-md disabled:opacity-50">
                    Save
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={weeklyGoal}
                    onChange={(event) => setWeeklyGoal(Number(event.target.value))}
                    className="w-24 rounded-lg border border-border bg-surface-container-lowest px-3 py-2 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="font-body-md text-body-md text-text-muted">hours per week</span>
                </div>
                <div className="flex justify-between font-label-sm text-label-sm mb-2">
                  <span className="text-text-muted">{minutesToHours(summary?.weekly_completed_minutes ?? 0)} done</span>
                  <span className="text-primary font-bold">{goalPercent}%</span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${goalPercent}%` }} />
                </div>
                <p className="mt-3 font-label-sm text-label-sm text-text-muted">
                  {minutesToHours(summary?.weekly_planned_minutes ?? 0)} planned this week
                </p>
              </section>

              <section className="bg-surface rounded-lg p-5 shadow-soft border border-border">
                <h3 className="font-headline-sm text-headline-sm text-text-primary mb-4">Revision Reminders</h3>
                <div className="space-y-3">
                  {(summary?.revision_reminders ?? []).length === 0 ? (
                    <p className="font-body-md text-body-md text-text-muted">No active reminders.</p>
                  ) : (
                    summary?.revision_reminders.map((task) => <ReminderRow key={task.task_id} task={task} />)
                  )}
                </div>
              </section>

              <section className="bg-surface rounded-lg p-5 shadow-soft border border-border">
                <h3 className="font-headline-sm text-headline-sm text-text-primary mb-4">Streak</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Metric icon="bolt" label="Current" value={`${summary?.current_streak ?? 0}d`} />
                  <Metric icon="workspace_premium" label="Best" value={`${summary?.longest_streak ?? 0}d`} />
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
}

function TaskSection({
  title,
  tasks,
  onComplete,
  onReopen,
  onDelete,
}: {
  title: string;
  tasks: StudyPlanTask[];
  onComplete: (taskId: string) => void;
  onReopen: (task: StudyPlanTask) => void;
  onDelete: (taskId: string) => void;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-stack-md">
        <h3 className="font-headline-sm text-headline-sm text-text-primary">{title}</h3>
        <span className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded-full font-label-sm text-label-sm">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface p-5 text-text-muted font-body-md text-body-md">
            No sessions here yet.
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.task_id} className={task.completed ? 'bg-surface-container-low rounded-lg p-5 border border-border opacity-75' : 'bg-surface rounded-lg p-5 shadow-soft border border-border'}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="min-w-[72px]">
                  <p className="font-label-md text-label-md text-text-primary">{task.start_time || 'Anytime'}</p>
                  <p className="font-label-sm text-label-sm text-text-muted">{formatDate(task.planned_date)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {task.subject && <Badge label={task.subject} />}
                    <Badge label={`${task.duration_minutes} min`} muted />
                    <Badge label={task.priority} muted />
                  </div>
                  <h4 className={task.completed ? 'font-headline-sm text-headline-sm text-text-primary line-through' : 'font-headline-sm text-headline-sm text-text-primary'}>
                    {task.title}
                  </h4>
                  {(task.topic || task.notes) && (
                    <p className="font-body-md text-body-md text-text-muted mt-1 break-words">
                      {[task.topic, task.notes].filter(Boolean).join(' - ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  {task.completed ? (
                    <button title="Reopen" onClick={() => onReopen(task)} className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined">undo</span>
                    </button>
                  ) : (
                    <button title="Complete" onClick={() => onComplete(task.task_id)} className="p-2 rounded-lg text-success hover:bg-success/10 transition-colors">
                      <span className="material-symbols-outlined">check_circle</span>
                    </button>
                  )}
                  <button title="Delete" onClick={() => onDelete(task.task_id)} className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error-container/20 transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function TextInput({ label, value, onChange, placeholder = '', type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-label-md text-label-md text-text-primary">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-surface-container-lowest px-4 py-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-label-md text-label-md text-text-primary">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-surface-container-lowest px-4 py-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Select</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3 min-w-0">
      <div className="flex items-center gap-2 text-text-muted">
        <span className="material-symbols-outlined text-sm">{icon}</span>
        <span className="font-label-sm text-label-sm truncate">{label}</span>
      </div>
      <p className="font-headline-sm text-headline-sm text-primary mt-1">{value}</p>
    </div>
  );
}

function ReminderRow({ task }: { task: StudyPlanTask }) {
  return (
    <div className="flex items-start gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <span className="material-symbols-outlined text-secondary mt-0.5">notifications_active</span>
      <div className="min-w-0">
        <p className="font-label-md text-label-md text-text-primary truncate">{task.title}</p>
        <p className="font-label-sm text-label-sm text-text-muted">{formatDate(task.planned_date)} {task.start_time}</p>
      </div>
    </div>
  );
}

function Badge({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <span className={muted ? 'rounded-md bg-surface-variant px-2 py-1 font-label-sm text-label-sm text-on-surface-variant' : 'rounded-md bg-primary/10 px-2 py-1 font-label-sm text-label-sm text-primary'}>
      {label}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function minutesToHours(minutes: number) {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}


