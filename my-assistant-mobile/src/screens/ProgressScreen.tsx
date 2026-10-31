import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, ScrollShell, theme } from '../components/MobileScaffold';
import { pyqApi, AnalyticsResponse, StatBucket } from '../services/api';

export default function ProgressScreen() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    pyqApi.getAnalytics().then(setData).catch(() => setError('Could not load analytics.')).finally(() => setLoading(false));
  }, []);

  return (
    <ScrollShell title="Progress" subtitle="Weak topics, accuracy, time management, and study plan.">
      {loading ? <ActivityIndicator color={theme.primary} /> : error ? <Text style={local.error}>{error}</Text> : !data || data.total_attempts === 0 ? (
        <EmptyState title="No analytics yet" subtitle="Complete a PYQ or practice session to unlock progress insights." />
      ) : (
        <>
          <View style={local.metrics}>
            <Metric label="Attempts" value={String(data.total_attempts)} />
            <Metric label="Accuracy" value={`${data.overall_accuracy}%`} />
            <Metric label="Percentile" value={data.percentile_prediction ? `${data.percentile_prediction}%` : 'N/A'} />
          </View>
          {data.rank_prediction ? <Card><Text style={local.cardTitle}>Rank Prediction</Text><Text style={local.text}>{data.rank_prediction}</Text></Card> : null}
          <BucketSection title="Weak Topics" buckets={data.weak_topics} />
          <BucketSection title="Strong Topics" buckets={data.strong_topics} />
          <BucketSection title="Subjects" buckets={data.subjects ?? data.sections} />
          <BucketSection title="Difficulty" buckets={data.difficulty} />
          {data.personalized_study_plan?.length ? (
            <Card>
              <Text style={local.cardTitle}>Personalized Study Plan</Text>
              {data.personalized_study_plan.map((item, index) => <Text key={`${item}-${index}`} style={local.text}>- {item}</Text>)}
            </Card>
          ) : null}
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

function BucketSection({ title, buckets }: { title: string; buckets: StatBucket[] }) {
  if (!buckets.length) return null;
  return (
    <Card>
      <Text style={local.cardTitle}>{title}</Text>
      {buckets.slice(0, 8).map((bucket) => (
        <View key={bucket.key} style={local.bucket}>
          <View style={{ flex: 1 }}>
            <Text style={local.bucketKey} numberOfLines={1}>{bucket.key}</Text>
            <View style={local.track}><View style={[local.fill, { width: `${Math.max(4, bucket.accuracy)}%` }]} /></View>
            <Text style={local.meta}>{bucket.correct} correct, {bucket.incorrect} incorrect</Text>
          </View>
          <Text style={local.accuracy}>{bucket.accuracy}%</Text>
        </View>
      ))}
    </Card>
  );
}

const local = StyleSheet.create({
  error: { color: theme.danger },
  metrics: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metric: { flex: 1, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 10, padding: 12 },
  metricLabel: { color: theme.muted, fontSize: 11, fontWeight: '800' },
  metricValue: { color: theme.text, fontSize: 17, fontWeight: '900', marginTop: 5 },
  cardTitle: { color: theme.text, fontWeight: '900', fontSize: 16, marginBottom: 10 },
  text: { color: theme.muted, fontSize: 13, lineHeight: 20, marginBottom: 5 },
  bucket: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  bucketKey: { color: theme.text, fontWeight: '800', fontSize: 13, marginBottom: 6 },
  track: { height: 7, backgroundColor: theme.surface2, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 7, backgroundColor: theme.primary, borderRadius: 4 },
  meta: { color: theme.muted, fontSize: 11, marginTop: 4 },
  accuracy: { color: theme.primary, fontWeight: '900', width: 48, textAlign: 'right' },
});
