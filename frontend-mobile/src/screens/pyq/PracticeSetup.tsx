import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { pyqApi, PracticeFilter, TopicFrequency } from '../../services/api';
import { pyqColors as c } from './colors';

interface Props {
  onBack: () => void;
  onStart: (filter: PracticeFilter) => void;
  starting: boolean;
  initialTopic?: string;
}

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const COUNTS = [10, 15, 25, 50];

export default function PracticeSetup({ onBack, onStart, starting, initialTopic }: Props) {
  const [topics, setTopics] = useState<TopicFrequency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initialTopic ? [initialTopic] : []);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [count, setCount] = useState(15);

  useEffect(() => {
    pyqApi.getTopics().then(setTopics).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filteredTopics = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? topics.filter(t => t.topic.toLowerCase().includes(q)) : topics;
    return list.slice(0, 60);
  }, [topics, search]);

  function toggleTopic(topic: string) {
    setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  }

  function toggleDifficulty(d: string) {
    setSelectedDifficulty(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.backLink}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Practice by Topic</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={styles.sectionLabel}>Difficulty (optional)</Text>
        <View style={styles.chipRow}>
          {DIFFICULTIES.map(d => (
            <Chip key={d} label={d} active={selectedDifficulty.includes(d)} onPress={() => toggleDifficulty(d)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Number of questions</Text>
        <View style={styles.chipRow}>
          {COUNTS.map(n => (
            <Chip key={n} label={String(n)} active={count === n} onPress={() => setCount(n)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Topics {selectedTopics.length > 0 ? `(${selectedTopics.length} selected)` : '(leave empty for a mixed set)'}</Text>
        <TextInput
          style={styles.search}
          placeholder="Search topics…"
          placeholderTextColor={c.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {loading ? (
          <ActivityIndicator color={c.primary} style={{ marginTop: 16 }} />
        ) : (
          <View style={styles.chipRow}>
            {filteredTopics.map(t => (
              <Chip
                key={t.topic}
                label={`${t.topic} (${t.question_count})`}
                active={selectedTopics.includes(t.topic)}
                onPress={() => toggleTopic(t.topic)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startBtn, starting && styles.startBtnDisabled]}
          disabled={starting}
          onPress={() => onStart({ topics: selectedTopics, difficulty: selectedDifficulty, count })}
        >
          {starting ? <ActivityIndicator color="#fff" /> : <Text style={styles.startBtnText}>Start Practice</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: { backgroundColor: c.header, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 3, borderBottomColor: '#e6b335' },
  backLink: { color: '#fff', fontSize: 12, fontWeight: '600' },
  headerTitle: { color: c.headerText, fontWeight: '700', fontSize: 14 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: c.text, marginTop: 18, marginBottom: 10, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgMuted },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: c.text },
  chipTextActive: { color: '#fff' },
  search: { borderWidth: 1, borderColor: c.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: c.text, marginBottom: 12 },
  footer: { borderTopWidth: 1, borderTopColor: c.border, padding: 12 },
  startBtn: { backgroundColor: c.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
