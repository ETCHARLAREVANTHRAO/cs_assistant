import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card, EmptyState, Pill, ScrollShell, theme } from '../components/MobileScaffold';
import { ErrorNotebookItem, ResourcePYQSolution, resourcesApi, ResourcesSummaryResponse } from '../services/api';

type Tab = 'errors' | 'pyqs' | 'formulas' | 'cheats' | 'tricks';

const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'errors', label: 'Errors' },
  { key: 'pyqs', label: 'PYQs' },
  { key: 'formulas', label: 'Formulas' },
  { key: 'cheats', label: 'Cheats' },
  { key: 'tricks', label: 'Tricks' },
];

export default function ResourcesScreen() {
  const [summary, setSummary] = useState<ResourcesSummaryResponse | null>(null);
  const [tab, setTab] = useState<Tab>('errors');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    resourcesApi.summary().then(setSummary).catch(() => setError('Could not load resources.')).finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();
  const match = (values: Array<string | null | undefined>) => !q || values.some((v) => (v ?? '').toLowerCase().includes(q));
  const filtered = useMemo(() => {
    if (!summary) return null;
    return {
      errors: summary.error_notebook.filter((i) => match([i.question, i.topic, i.chapter, i.paper_title])),
      pyqs: summary.pyq_solutions.filter((i) => match([i.question, i.topic, i.chapter, i.paper_title])),
      formulas: summary.formula_sheets.filter((i) => match([i.subject, i.chapter, i.formulas.join(' ')])),
      cheats: summary.cheat_sheets.filter((i) => match([i.subject, i.chapter, i.points.join(' ')])),
      tricks: summary.short_tricks.filter((i) => match([i.subject, i.title, i.trick, i.example])),
    };
  }, [summary, q]);

  async function toggleResolved(item: ErrorNotebookItem) {
    const next = await resourcesApi.updateErrorNotebook(item.notebook_id, { resolved: !item.resolved });
    setSummary(next);
  }

  return (
    <ScrollShell title="Resources" subtitle="Mistakes, PYQ solutions, formulas, cheat sheets, and short tricks.">
      <TextInput style={local.search} value={query} onChangeText={setQuery} placeholder="Search resources" placeholderTextColor={theme.muted} />
      <View style={local.tabs}>
        {tabs.map((item) => (
          <TouchableOpacity key={item.key} style={[local.tab, tab === item.key && local.tabActive]} onPress={() => setTab(item.key)}>
            <Text style={[local.tabText, tab === item.key && { color: '#fff' }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color={theme.primary} /> : error ? <Text style={local.error}>{error}</Text> : !filtered ? null : (
        <>
          {tab === 'errors' && (filtered.errors.length ? filtered.errors.map((item) => <ErrorCard key={item.notebook_id} item={item} onToggle={() => toggleResolved(item)} />) : <EmptyState title="No errors found" />)}
          {tab === 'pyqs' && (filtered.pyqs.length ? filtered.pyqs.slice(0, 40).map((item) => <PYQCard key={`${item.paper_id}-${item.question_id}`} item={item} />) : <EmptyState title="No PYQ solutions found" />)}
          {tab === 'formulas' && filtered.formulas.map((item) => <ListCard key={`${item.subject}-${item.chapter}`} title={item.chapter} subtitle={item.subject} rows={item.formulas} />)}
          {tab === 'cheats' && filtered.cheats.map((item) => <ListCard key={`${item.subject}-${item.chapter}`} title={item.chapter} subtitle={item.subject} rows={item.points} />)}
          {tab === 'tricks' && filtered.tricks.map((item) => <ListCard key={`${item.subject}-${item.title}`} title={item.title} subtitle={item.subject} rows={[item.trick, item.example].filter(Boolean)} />)}
        </>
      )}
    </ScrollShell>
  );
}

function ErrorCard({ item, onToggle }: { item: ErrorNotebookItem; onToggle: () => void }) {
  return (
    <Card>
      <View style={local.cardTop}>
        <Pill label={item.resolved ? 'Resolved' : item.status.replace('_', ' ')} tone={item.resolved ? 'success' : 'danger'} />
        <TouchableOpacity onPress={onToggle}><Text style={local.action}>{item.resolved ? 'Reopen' : 'Resolve'}</Text></TouchableOpacity>
      </View>
      <QuestionBody item={item} />
      <Text style={local.meta}>Your: {formatAnswer(item.given_answer)} | Correct: {formatAnswer(item.correct_answer)}</Text>
    </Card>
  );
}

function PYQCard({ item }: { item: ResourcePYQSolution }) {
  return (
    <Card>
      <Pill label={item.paper_title} tone="primary" />
      <QuestionBody item={item} />
      <Text style={local.meta}>Answer: {formatAnswer(item.correct_answer)}</Text>
    </Card>
  );
}

function QuestionBody({ item }: { item: ResourcePYQSolution }) {
  return (
    <>
      <Text style={local.question}>{item.question}</Text>
      {item.explanation ? <Text style={local.explanation}>{item.explanation}</Text> : null}
      {item.solution_steps?.slice(0, 4).map((step, index) => <Text key={`${step}-${index}`} style={local.step}>{index + 1}. {step}</Text>)}
    </>
  );
}

function ListCard({ title, subtitle, rows }: { title: string; subtitle: string; rows: string[] }) {
  return (
    <Card>
      <Pill label={subtitle} tone="primary" />
      <Text style={local.cardTitle}>{title}</Text>
      {rows.map((row, index) => <Text key={`${row}-${index}`} style={local.step}>- {row}</Text>)}
    </Card>
  );
}

function formatAnswer(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.join(', ');
  return value || 'Blank';
}

const local = StyleSheet.create({
  search: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 10, color: theme.text, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: { flex: 1, alignItems: 'center', backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 9, paddingVertical: 9 },
  tabActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  tabText: { color: theme.muted, fontWeight: '900', fontSize: 11 },
  error: { color: theme.danger },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  action: { color: theme.primary, fontWeight: '900' },
  question: { color: theme.text, fontSize: 14, lineHeight: 21, fontWeight: '800', marginTop: 10 },
  explanation: { color: theme.muted, fontSize: 13, lineHeight: 20, marginTop: 10 },
  step: { color: theme.muted, fontSize: 13, lineHeight: 20, marginTop: 5 },
  meta: { color: theme.primary, fontSize: 12, fontWeight: '900', marginTop: 10 },
  cardTitle: { color: theme.text, fontWeight: '900', fontSize: 16, marginTop: 10, marginBottom: 5 },
});
