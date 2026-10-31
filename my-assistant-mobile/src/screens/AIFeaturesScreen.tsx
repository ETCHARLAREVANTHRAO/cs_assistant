import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card, PrimaryButton, ScrollShell, theme } from '../components/MobileScaffold';
import { aiApi } from '../services/api';

type Tool = 'tutor' | 'quiz' | 'mentor' | 'revision';

const tools: Array<{ key: Tool; label: string }> = [
  { key: 'tutor', label: 'Tutor' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'mentor', label: 'Mentor' },
  { key: 'revision', label: 'Revision' },
];

export default function AIFeaturesScreen() {
  const [tool, setTool] = useState<Tool>('tutor');
  const [topic, setTopic] = useState('Operating Systems deadlocks');
  const [level, setLevel] = useState('beginner');
  const [count, setCount] = useState('5');
  const [difficulty, setDifficulty] = useState('medium');
  const [concern, setConcern] = useState('I am weak in DBMS and OS. How should I improve?');
  const [days, setDays] = useState('7');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setLoading(true);
    setAnswer('');
    setError('');
    try {
      const res =
        tool === 'tutor' ? await aiApi.tutor({ topic, level }) :
        tool === 'quiz' ? await aiApi.quiz({ topic, count: Number(count) || 5, difficulty }) :
        tool === 'mentor' ? await aiApi.mentor({ concern }) :
        await aiApi.revisionPlan({ target: topic, days: Number(days) || 7 });
      setAnswer(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'AI request failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollShell title="AI Tools" subtitle="Tutor, quiz generator, exam mentor, and revision plans.">
      <View style={local.tabs}>
        {tools.map((item) => (
          <TouchableOpacity key={item.key} style={[local.tab, tool === item.key && local.tabActive]} onPress={() => setTool(item.key)}>
            <Text style={[local.tabText, tool === item.key && { color: '#fff' }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Card>
        {(tool === 'tutor' || tool === 'quiz' || tool === 'revision') && <Field label="Topic / Target" value={topic} onChange={setTopic} />}
        {tool === 'tutor' && <Field label="Level" value={level} onChange={setLevel} />}
        {tool === 'quiz' && (
          <View style={local.row}>
            <Field label="Count" value={count} onChange={setCount} />
            <Field label="Difficulty" value={difficulty} onChange={setDifficulty} />
          </View>
        )}
        {tool === 'mentor' && <Field label="Concern" value={concern} onChange={setConcern} multiline />}
        {tool === 'revision' && <Field label="Days" value={days} onChange={setDays} />}
        {error ? <Text style={local.error}>{error}</Text> : null}
        <PrimaryButton label={loading ? 'Generating...' : 'Generate'} icon="sparkles-outline" onPress={run} disabled={loading} />
      </Card>

      {loading ? <ActivityIndicator color={theme.primary} style={{ marginVertical: 18 }} /> : null}
      {answer ? <Card><Text style={local.answer}>{answer}</Text></Card> : null}
    </ScrollShell>
  );
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={local.label}>{label}</Text>
      <TextInput
        style={[local.input, multiline && { minHeight: 110, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={theme.muted}
        multiline={multiline}
      />
    </View>
  );
}

const local = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { flex: 1, alignItems: 'center', borderRadius: 9, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, paddingVertical: 10 },
  tabActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  tabText: { color: theme.muted, fontWeight: '900', fontSize: 12 },
  row: { flexDirection: 'row', gap: 8 },
  label: { color: theme.text, fontWeight: '800', marginBottom: 6, fontSize: 12 },
  input: { backgroundColor: theme.surface2, color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  error: { color: theme.danger, marginBottom: 10 },
  answer: { color: theme.muted, fontSize: 14, lineHeight: 21 },
});
