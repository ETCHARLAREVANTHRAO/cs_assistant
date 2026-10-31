import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card, EmptyState, Pill, PrimaryButton, ScrollShell, theme } from '../components/MobileScaffold';
import { plannerApi, StudyPlannerSummary, StudyPlanTask } from '../services/api';

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function PlannerScreen() {
  const [summary, setSummary] = useState<StudyPlannerSummary | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [minutes, setMinutes] = useState('60');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    const data = await plannerApi.summary();
    setSummary(data);
  }

  useEffect(() => {
    refresh().catch(() => setError('Could not load planner.')).finally(() => setLoading(false));
  }, []);

  const todayTasks = useMemo(() => (summary?.tasks ?? []).filter((t) => t.planned_date === summary?.today_key), [summary]);
  const upcoming = useMemo(() => (summary?.tasks ?? []).filter((t) => t.planned_date !== summary?.today_key).slice(0, 8), [summary]);

  async function addTask() {
    if (!title.trim()) {
      setError('Add a title for the study session.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await plannerApi.createTask({
        title,
        subject,
        topic,
        planned_date: todayKey(),
        start_time: '09:00',
        duration_minutes: Number(minutes) || 60,
        priority: 'medium',
        notes: '',
        reminder_enabled: true,
      });
      setTitle('');
      setTopic('');
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not save session.');
    } finally {
      setSaving(false);
    }
  }

  async function complete(taskId: string) {
    await plannerApi.completeTask(taskId);
    await refresh();
  }

  async function remove(taskId: string) {
    await plannerApi.deleteTask(taskId);
    await refresh();
  }

  return (
    <ScrollShell title="Study Planner" subtitle="Plan today, complete sessions, and keep revision visible.">
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <>
          {summary ? (
            <View style={local.metrics}>
              <Metric label="Streak" value={`${summary.current_streak}d`} />
              <Metric label="Today" value={`${todayTasks.filter((t) => t.completed).length}/${todayTasks.length}`} />
              <Metric label="Weekly" value={`${Math.round(summary.weekly_completed_minutes / Math.max(1, summary.weekly_hours_goal * 60) * 100)}%`} />
            </View>
          ) : null}

          <Card>
            <Text style={local.cardTitle}>Add Study Session</Text>
            <TextInput style={local.input} placeholder="Title" placeholderTextColor={theme.muted} value={title} onChangeText={setTitle} />
            <TextInput style={local.input} placeholder="Subject" placeholderTextColor={theme.muted} value={subject} onChangeText={setSubject} />
            <TextInput style={local.input} placeholder="Topic" placeholderTextColor={theme.muted} value={topic} onChangeText={setTopic} />
            <TextInput style={local.input} placeholder="Minutes" placeholderTextColor={theme.muted} value={minutes} onChangeText={setMinutes} keyboardType="number-pad" />
            {error ? <Text style={local.error}>{error}</Text> : null}
            <PrimaryButton label={saving ? 'Saving...' : 'Add Session'} icon="add" onPress={addTask} disabled={saving} />
          </Card>

          <TaskSection title="Today" tasks={todayTasks} onComplete={complete} onDelete={remove} />
          <TaskSection title="Upcoming" tasks={upcoming} onComplete={complete} onDelete={remove} />
        </>
      )}
    </ScrollShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={local.metric}>
      <Text style={local.metricLabel}>{label}</Text>
      <Text style={local.metricValue}>{value}</Text>
    </View>
  );
}

function TaskSection({ title, tasks, onComplete, onDelete }: { title: string; tasks: StudyPlanTask[]; onComplete: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <View>
      <Text style={local.sectionTitle}>{title}</Text>
      {tasks.length === 0 ? <EmptyState title="No sessions here yet" /> : tasks.map((task) => (
        <Card key={task.task_id}>
          <View style={local.taskTop}>
            <View style={{ flex: 1 }}>
              <Text style={[local.taskTitle, task.completed && local.completed]}>{task.title}</Text>
              <Text style={local.taskMeta}>{task.subject || 'General'} - {task.topic || 'Mixed'} - {task.duration_minutes} min</Text>
            </View>
            <Pill label={task.completed ? 'Done' : task.priority} tone={task.completed ? 'success' : 'amber'} />
          </View>
          <View style={local.actions}>
            {!task.completed ? <TouchableOpacity onPress={() => onComplete(task.task_id)}><Text style={local.action}>Complete</Text></TouchableOpacity> : null}
            <TouchableOpacity onPress={() => onDelete(task.task_id)}><Text style={[local.action, { color: theme.danger }]}>Delete</Text></TouchableOpacity>
          </View>
        </Card>
      ))}
    </View>
  );
}

const local = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metric: { flex: 1, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 10, padding: 12 },
  metricLabel: { color: theme.muted, fontSize: 11, fontWeight: '800' },
  metricValue: { color: theme.text, fontSize: 18, fontWeight: '900', marginTop: 5 },
  cardTitle: { color: theme.text, fontSize: 16, fontWeight: '900', marginBottom: 10 },
  input: { backgroundColor: theme.surface2, borderColor: theme.border, borderWidth: 1, borderRadius: 9, color: theme.text, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 9 },
  error: { color: theme.danger, marginBottom: 9 },
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: '900', marginVertical: 10 },
  taskTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  taskTitle: { color: theme.text, fontWeight: '900', fontSize: 15 },
  completed: { textDecorationLine: 'line-through', color: theme.muted },
  taskMeta: { color: theme.muted, fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 18, marginTop: 12 },
  action: { color: theme.primary, fontWeight: '900' },
});
