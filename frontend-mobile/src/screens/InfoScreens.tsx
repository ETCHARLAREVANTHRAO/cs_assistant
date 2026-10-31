import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card, EmptyState, PrimaryButton, ScrollShell, theme } from '../components/MobileScaffold';
import { notificationApi, NotificationPreferences, productApi } from '../services/api';

function renderAny(value: any): string[] {
  if (value == null) return [];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(renderAny);
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => {
      const rendered = renderAny(item);
      if (!rendered.length) return [];
      if (rendered.length === 1) return [`${humanize(key)}: ${rendered[0]}`];
      return [humanize(key), ...rendered.map((line) => `- ${line}`)];
    });
  }
  return [];
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function DataScreen({ title, subtitle, loader }: { title: string; subtitle: string; loader: () => Promise<any> }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loader().then(setData).catch(() => setError(`Could not load ${title.toLowerCase()}.`)).finally(() => setLoading(false));
  }, [loader, title]);

  const rows = useMemo(() => renderAny(data).slice(0, 80), [data]);

  return (
    <ScrollShell title={title} subtitle={subtitle}>
      {loading ? <ActivityIndicator color={theme.primary} /> : error ? <Text style={local.error}>{error}</Text> : rows.length ? (
        <Card>{rows.map((row, index) => <Text key={`${row}-${index}`} style={row.startsWith('-') ? local.row : local.heading}>{row}</Text>)}</Card>
      ) : <EmptyState title="Nothing to show yet" />}
    </ScrollShell>
  );
}

export function ExamInfoScreen() {
  return <DataScreen title="Exam Info" subtitle="Pattern, cutoffs, college predictor, PSU info, and admissions guidance." loader={productApi.examInfo} />;
}

export function MotivationScreen() {
  return <DataScreen title="Motivation" subtitle="Daily quote, challenge, Pomodoro, badges, and consistency rewards." loader={productApi.motivation} />;
}

export function RevisionScreen() {
  return <DataScreen title="Revision" subtitle="7-day plan, crash course, last-minute notes, and repeated PYQs." loader={productApi.revision} />;
}

export function DownloadsScreen() {
  return (
    <ScrollShell title="Downloads" subtitle="Offline resources and exports.">
      <EmptyState title="Downloads hub ready" subtitle="Use Documents and Resources for now; packaged offline exports can be added here when content is finalized." />
    </ScrollShell>
  );
}

export function SettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    notificationApi.getPreferences().then(setPrefs).catch(() => setStatus('Could not load notification preferences.'));
  }, []);

  async function update(key: keyof NotificationPreferences, value: boolean) {
    setStatus('Saving...');
    try {
      const next = await notificationApi.updatePreferences({ [key]: value });
      setPrefs(next);
      setStatus('Saved.');
    } catch {
      setStatus('Could not save preference.');
    }
  }

  return (
    <ScrollShell title="Settings" subtitle="Mobile preferences and account configuration.">
      <Card>
        <Text style={local.heading}>Backend</Text>
        <Text style={local.row}>The mobile app uses EXPO_PUBLIC_API_URL when configured, otherwise it falls back to the Render backend.</Text>
      </Card>
      <Card>
        <Text style={local.heading}>Notifications</Text>
        {!prefs ? <ActivityIndicator color={theme.primary} /> : (
          <>
            <PrefRow label="Revision reminders" value={prefs.revision_reminders} onChange={(value) => update('revision_reminders', value)} />
            <PrefRow label="Quiz alerts" value={prefs.quiz_alerts} onChange={(value) => update('quiz_alerts', value)} />
            <PrefRow label="Exam updates" value={prefs.exam_updates} onChange={(value) => update('exam_updates', value)} />
            <PrefRow label="System updates" value={prefs.system_updates} onChange={(value) => update('system_updates', value)} />
            <PrefRow label="Daily challenge" value={prefs.daily_challenge} onChange={(value) => update('daily_challenge', value)} />
            {status ? <Text style={local.row}>{status}</Text> : null}
          </>
        )}
      </Card>
    </ScrollShell>
  );
}

function PrefRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={local.prefRow}>
      <Text style={local.prefLabel}>{label}</Text>
      <TouchableOpacity style={[local.switch, value && local.switchOn]} onPress={() => onChange(!value)}>
        <View style={[local.knob, value && local.knobOn]} />
      </TouchableOpacity>
    </View>
  );
}

export function CommunityScreen() {
  const [posts, setPosts] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    const data = await productApi.community();
    setPosts(data);
  }

  useEffect(() => {
    refresh().catch(() => setError('Could not load community.')).finally(() => setLoading(false));
  }, []);

  async function post() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    setError('');
    try {
      await productApi.createCommunityPost({ title, content, category: 'discussion' });
      setTitle('');
      setContent('');
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not create post.');
    } finally {
      setSaving(false);
    }
  }

  const rows = renderAny(posts).slice(0, 40);

  return (
    <ScrollShell title="Community" subtitle="Discussions, doubt threads, faculty requests, and study groups.">
      <Card>
        <Text style={local.heading}>Start Discussion</Text>
        <TextInput style={local.input} value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={theme.muted} />
        <TextInput style={[local.input, { minHeight: 90, textAlignVertical: 'top' }]} value={content} onChangeText={setContent} placeholder="Write your question or idea" placeholderTextColor={theme.muted} multiline />
        {error ? <Text style={local.error}>{error}</Text> : null}
        <PrimaryButton label={saving ? 'Posting...' : 'Post'} icon="send-outline" onPress={post} disabled={saving || !title.trim() || !content.trim()} />
      </Card>
      {loading ? <ActivityIndicator color={theme.primary} /> : rows.length ? <Card>{rows.map((row, index) => <Text key={`${row}-${index}`} style={local.row}>{row}</Text>)}</Card> : <EmptyState title="No posts yet" />}
    </ScrollShell>
  );
}

const local = StyleSheet.create({
  heading: { color: theme.text, fontWeight: '900', fontSize: 15, marginBottom: 8 },
  row: { color: theme.muted, fontSize: 13, lineHeight: 20, marginBottom: 6 },
  error: { color: theme.danger, marginBottom: 10 },
  input: { backgroundColor: theme.surface2, borderColor: theme.border, borderWidth: 1, borderRadius: 9, color: theme.text, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  prefRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.border },
  prefLabel: { color: theme.text, fontSize: 13, fontWeight: '800' },
  switch: { width: 46, height: 26, borderRadius: 13, backgroundColor: theme.surface3, padding: 3 },
  switchOn: { backgroundColor: theme.primary },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  knobOn: { transform: [{ translateX: 20 }] },
});
