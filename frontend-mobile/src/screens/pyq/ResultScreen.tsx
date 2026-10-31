import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { PYQResult } from '../../services/api';
import { pyqColors as c } from './colors';

interface Props {
  result: PYQResult;
  onRetake: () => void;
  onViewSolutions: () => void;
  onBackHome: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} min ${s} sec`;
}

export default function ResultScreen({ result, onRetake, onViewSolutions, onBackHome }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>{result.paper_title} — Result</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Total Score</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{result.total_marks}</Text>
            <Text style={styles.scoreMax}> / {result.max_marks}</Text>
          </View>
          <Text style={styles.timeTaken}>
            Time taken: {formatDuration(result.time_taken_seconds)} of {result.duration_minutes} min
          </Text>

          <View style={styles.statsRow}>
            <StatTile value={result.correct} label="Correct" color={c.correct} />
            <StatTile value={result.incorrect} label="Incorrect" color={c.incorrect} />
            <StatTile value={result.unattempted} label="Unattempted" color={c.textMuted} />
          </View>
        </View>

        <Text style={styles.sectionHeading}>Section-wise Breakdown</Text>
        <View style={styles.table}>
          <View style={[styles.tr, styles.thRow]}>
            <Text style={[styles.th, { flex: 2 }]}>Section</Text>
            <Text style={[styles.th, styles.cell]}>Correct</Text>
            <Text style={[styles.th, styles.cell]}>Incorrect</Text>
            <Text style={[styles.th, { flex: 1.4, textAlign: 'right' }]}>Marks</Text>
          </View>
          {result.sections.map((s, i) => (
            <View key={s.section} style={[styles.tr, i !== result.sections.length - 1 && styles.trBorder]}>
              <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>{s.section_title}</Text>
              <Text style={[styles.td, styles.cell, { color: c.correct, fontWeight: '700' }]}>{s.correct}</Text>
              <Text style={[styles.td, styles.cell, { color: c.incorrect, fontWeight: '700' }]}>{s.incorrect}</Text>
              <Text style={[styles.td, { flex: 1.4, textAlign: 'right', fontWeight: '700' }]}>{s.marks_scored} / {s.max_marks}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.linkBtn} onPress={onBackHome}>
          <Text style={styles.linkBtnText}>← Practice Tests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineBtn} onPress={onRetake}>
          <Text style={styles.outlineBtnText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onViewSolutions}>
          <Text style={styles.primaryBtnText}>View Solutions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatTile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bgMuted },
  header: { backgroundColor: c.header, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: '#e6b335' },
  headerTitle: { color: c.headerText, fontWeight: '700', fontSize: 14 },
  body: { flex: 1 },
  scoreCard: { backgroundColor: c.bg, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: c.border, marginBottom: 20 },
  scoreLabel: { fontSize: 11, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  scoreValue: { fontSize: 42, fontWeight: '800', color: c.primary, fontVariant: ['tabular-nums'] },
  scoreMax: { fontSize: 18, fontWeight: '600', color: c.textMuted },
  timeTaken: { fontSize: 12, color: c.textMuted, marginTop: 6, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, backgroundColor: c.bgMuted, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: c.textMuted, fontWeight: '600', marginTop: 4 },
  sectionHeading: { fontSize: 15, fontWeight: '700', color: c.text, marginBottom: 10 },
  table: { backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, borderRadius: 8, overflow: 'hidden' },
  tr: { flexDirection: 'row', padding: 10, alignItems: 'center' },
  thRow: { backgroundColor: c.sidebar },
  trBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  th: { fontSize: 10, fontWeight: '700', color: c.primary, textAlign: 'center' },
  td: { fontSize: 12, color: c.text },
  cell: { flex: 1, textAlign: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bg },
  linkBtn: { marginRight: 'auto' },
  linkBtnText: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
  outlineBtn: { borderWidth: 1, borderColor: c.border, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 10 },
  outlineBtnText: { color: c.text, fontWeight: '600', fontSize: 12 },
  primaryBtn: { backgroundColor: c.primary, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
