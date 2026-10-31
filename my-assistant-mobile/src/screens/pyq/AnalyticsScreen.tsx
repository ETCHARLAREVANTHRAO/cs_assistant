import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { pyqApi, AnalyticsResponse, StatBucket } from '../../services/api';
import { pyqColors as c } from './colors';

interface Props {
  onBack: () => void;
}

function accuracyColor(accuracy: number): string {
  if (accuracy >= 70) return c.correct;
  if (accuracy >= 40) return c.amberText;
  return c.incorrect;
}

export default function AnalyticsScreen({ onBack }: Props) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    pyqApi.getAnalytics()
      .then(setData)
      .catch(() => setError('Could not load analytics. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.backLink}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>My Analytics</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={c.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
      ) : !data || data.total_attempts === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No attempts yet. Take a mock test or daily practice to see your stats here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View style={styles.statRow}>
            <StatTile label="Attempts" value={String(data.total_attempts)} />
            <StatTile label="Accuracy" value={`${data.overall_accuracy}%`} color={accuracyColor(data.overall_accuracy)} />
            <StatTile label="Marks" value={`${data.total_marks}/${data.total_max_marks}`} />
          </View>
          <View style={styles.statRow}>
            <StatTile label="Correct" value={String(data.correct)} color={c.correct} />
            <StatTile label="Incorrect" value={String(data.incorrect)} color={c.incorrect} />
            <StatTile label="Unattempted" value={String(data.unattempted)} color={c.notVisitedText} />
          </View>

          {data.weak_topics.length > 0 && (
            <Section title="Weak Topics — focus here">
              {data.weak_topics.map(t => <BucketRow key={t.key} b={t} />)}
            </Section>
          )}

          {data.strong_topics.length > 0 && (
            <Section title="Strong Topics">
              {data.strong_topics.map(t => <BucketRow key={t.key} b={t} />)}
            </Section>
          )}

          <Section title="Accuracy by Subject">
            {data.sections.map(t => <BucketRow key={t.key} b={t} />)}
          </Section>

          <Section title="Accuracy by Difficulty">
            {data.difficulty.map(t => <BucketRow key={t.key} b={t} />)}
          </Section>

          <Section title="All Topics">
            {data.topics.map(t => <BucketRow key={t.key} b={t} />)}
          </Section>
        </ScrollView>
      )}
    </View>
  );
}

function StatTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BucketRow({ b }: { b: StatBucket }) {
  const color = accuracyColor(b.accuracy);
  return (
    <View style={styles.bucketRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.bucketKey} numberOfLines={1}>{b.key}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.max(4, b.accuracy)}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.bucketMeta}>{b.correct} correct · {b.incorrect} incorrect · {b.unattempted} unattempted</Text>
      </View>
      <Text style={[styles.bucketAccuracy, { color }]}>{b.accuracy}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: { backgroundColor: c.header, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 3, borderBottomColor: '#e6b335' },
  backLink: { color: '#fff', fontSize: 12, fontWeight: '600' },
  headerTitle: { color: c.headerText, fontWeight: '700', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  error: { color: c.notAnswered },
  emptyText: { color: c.textMuted, textAlign: 'center', fontSize: 13, lineHeight: 20 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tile: { flex: 1, backgroundColor: c.bgMuted, borderRadius: 10, borderWidth: 1, borderColor: c.border, padding: 12, alignItems: 'center' },
  tileValue: { fontSize: 18, fontWeight: '800', color: c.text },
  tileLabel: { fontSize: 11, color: c.textMuted, marginTop: 4 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: c.text, marginBottom: 10 },
  bucketRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.bgMuted, borderRadius: 8, borderWidth: 1, borderColor: c.border, padding: 10, marginBottom: 6 },
  bucketKey: { fontSize: 12, fontWeight: '600', color: c.text, marginBottom: 6 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: 6, borderRadius: 3 },
  bucketMeta: { fontSize: 10, color: c.textMuted },
  bucketAccuracy: { fontSize: 14, fontWeight: '800', minWidth: 44, textAlign: 'right' },
});
