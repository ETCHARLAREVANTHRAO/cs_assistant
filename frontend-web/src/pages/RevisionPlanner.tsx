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

  async function reopenTask(taskId: string) {
    setError('');
    try {
      await plannerUpdateTask(taskId, { completed: false });
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not update this session.');
    }
  }

  async function deleteTask(taskId: string) {
    if (!window.confirm('Delete this study session?')) return;
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
    <Layout activePage="revision-planner" title="Revision Planner" searchPlaceholder="Search sessions...">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Resq Beam Header Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-indigo-200">
                <span className="material-symbols-outlined text-[14px]">event_repeat</span>
                <span>Spaced Repetition &amp; Daily Revision Calendar</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text tracking-tight">
                GATE CS Study &amp; Revision Planner
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Organize your study blocks, track daily revision streaks, and distribute high-weightage chapters evenly ahead of the exam.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            {summary && (
              <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[90px]">
                  <p className="text-xl font-bold text-amber-400 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
                    <span>{summary.current_streak}d</span>
                  </p>
                  <p className="text-[10px] text-slate-300">Streak</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[90px]">
                  <p className="text-xl font-bold text-cyan-400">{goalPercent}%</p>
                  <p className="text-[10px] text-slate-300">Goal Target</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[90px]">
                  <p className="text-xl font-bold text-emerald-400">
                    {todayTasks.filter((t) => t.completed).length}/{todayTasks.length}
                  </p>
                  <p className="text-[10px] text-slate-300">Today Done</p>
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

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-indigo-500 animate-spin">progress_activity</span>
            <p className="text-xs text-slate-400">Loading your revision calendar...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form & Tasks */}
            <section className="lg:col-span-8 space-y-6">
              {/* Add Session Form */}
              <form onSubmit={addTask} className="rounded-2xl bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500 text-[20px]">add_task</span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Schedule Study / Revision Block</h3>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Schedule</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <TextInput label="Session Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. Memory Management & Paging" />
                  <SelectInput label="GATE Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} options={SUBJECTS} />
                  <TextInput label="Chapter / Topic" value={form.topic} onChange={(v) => setForm({ ...form, topic: v })} placeholder="e.g. Page Replacement Algorithms" />

                  <div className="grid grid-cols-2 gap-2">
                    <TextInput type="date" label="Date" value={form.planned_date} onChange={(v) => setForm({ ...form, planned_date: v })} />
                    <TextInput type="time" label="Time" value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <TextInput type="number" label="Duration (Mins)" value={String(form.duration_minutes)} onChange={(v) => setForm({ ...form, duration_minutes: Number(v) })} />
                    <SelectInput label="Priority" value={form.priority} onChange={(v) => setForm({ ...form, priority: v })} options={['high', 'medium', 'low']} />
                  </div>

                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer self-end">
                    <input
                      type="checkbox"
                      checked={form.reminder_enabled}
                      onChange={(e) => setForm({ ...form, reminder_enabled: e.target.checked })}
                      className="h-4 w-4 rounded accent-indigo-600"
                    />
                    <span>Enable Revision Alert</span>
                  </label>
                </div>

                <TextInput label="Revision Notes / Checklist" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="e.g. Solve 10 PYQs on FIFO and LRU page replacement..." />
              </form>

              {/* Today's Tasks */}
              <TaskSection
                title="Today's Revision Blocks"
                badge={todayTasks.length > 0 ? `${todayTasks.filter((t) => t.completed).length}/${todayTasks.length} Done` : undefined}
                tasks={todayTasks}
                onComplete={completeTask}
                onReopen={reopenTask}
                onDelete={deleteTask}
              />

              {/* Upcoming Tasks */}
              <TaskSection
                title="Upcoming Schedule"
                tasks={upcomingTasks}
                onComplete={completeTask}
                onReopen={reopenTask}
                onDelete={deleteTask}
              />
            </section>

            {/* Right Column: Goal & Weekly Analytics */}
            <aside className="lg:col-span-4 space-y-5">
              <section className="rounded-2xl bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Weekly Target</h3>
                  <button
                    onClick={saveGoal}
                    disabled={saving}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                  >
                    Save Target
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                    className="w-24 px-3 py-2 text-sm font-bold text-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">hours / week</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round((summary?.weekly_completed_minutes ?? 0) / 60)}h / {weeklyGoal}h ({goalPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                      style={{ width: `${goalPercent}%` }}
                    />
                  </div>
                </div>
              </section>

              {/* Study Tips Box */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/50 dark:border-indigo-900/50 space-y-2.5">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                  <span className="material-symbols-outlined text-[17px]">tips_and_updates</span>
                  <span>Spaced Repetition Tip</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Review concepts 1 day, 3 days, and 7 days after first study to lock knowledge into permanent long-term memory for the GATE exam.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
}

function TaskSection({
  title,
  badge,
  tasks,
  onComplete,
  onReopen,
  onDelete,
}: {
  title: string;
  badge?: string;
  tasks: StudyPlanTask[];
  onComplete: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
        {badge && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            {badge}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
          No revision blocks scheduled.
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.task_id}
              className={`rounded-2xl p-4 bg-white dark:bg-[#0f111e] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                task.completed
                  ? 'border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={() => (task.completed ? onReopen(task.task_id) : onComplete(task.task_id))}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500'
                  }`}
                >
                  {task.completed && <span className="material-symbols-outlined text-[14px]">check</span>}
                </button>
                <div className="min-w-0">
                  <p className={`text-xs font-bold text-slate-800 dark:text-slate-100 truncate ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {task.subject && (
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {task.subject}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {task.planned_date} • {task.start_time} ({task.duration_minutes}m)
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        task.priority === 'high'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDelete(task.task_id)}
                className="self-end sm:self-auto p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Delete session"
              >
                <span className="material-symbols-outlined text-[17px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 capitalize"
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
