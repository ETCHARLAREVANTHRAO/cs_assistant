import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { pyqApi, PYQPaperSummary, PYQAttemptSummary, DailyPracticeResponse } from '../../services/api';
import { pyqColors as c } from './colors';

interface Props {
  onSelectPaper: (paper: PYQPaperSummary) => void;
  onViewAttempt: (attemptId: string) => void;
  onStartDaily: (daily: DailyPracticeResponse) => void;
  onOpenPracticeSetup: () => void;
  onOpenTopics: () => void;
  onOpenAnalytics: () => void;
}

export default function HomeScreen({ onSelectPaper, onViewAttempt, onStartDaily, onOpenPracticeSetup, onOpenTopics, onOpenAnalytics }: Props) {
  const [papers, setPapers] = useState<PYQPaperSummary[]>([]);
  const [attempts, setAttempts] = useState<PYQAttemptSummary[]>([]);
  const [daily, setDaily] = useState<DailyPracticeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [p, a, d] = await Promise.all([pyqApi.listPapers(), pyqApi.listAttempts(), pyqApi.getDaily()]);
      setPapers(p);
      setAttempts(a);
      setDaily(d);
    } catch {
      setError('Could not load practice tests. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      {daily && (
        <TouchableOpacity style={styles.dailyCard} onPress={() => onStartDaily(daily)}>
          <View style={styles.dailyStreak}>
            <Text style={styles.dailyStreakEmoji}>🔥</Text>
            <Text style={styles.dailyStreakText}>{daily.streak.current_streak}-day streak</Text>
          </View>
          <Text style={styles.dailyTitle}>
            {daily.already_submitted ? "Today's practice done ✓" : 'Daily Practice'}
          </Text>
          <Text style={styles.dailySubtitle}>
            {daily.already_submitted
              ? 'Come back tomorrow for a new set.'
              : `${daily.paper.total_questions} questions · ~${daily.duration_minutes} min · tap to start`}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.quickRow}>
        <QuickAction label="Practice by Topic" onPress={onOpenPracticeSetup} />
        <QuickAction label="Frequent Topics" onPress={onOpenTopics} />
        <QuickAction label="My Analytics" onPress={onOpenAnalytics} />
      </View>

      <Text style={styles.heading}>GATE Previous Year Papers</Text>
      <Text style={styles.subheading}>Full-length mock tests with the real exam interface, timer, and negative marking.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {papers.map(paper => (
        <TouchableOpacity key={paper.paper_id} style={styles.card} onPress={() => onSelectPaper(paper)}>
          <Text style={styles.cardTitle}>{paper.title}</Text>
          <View style={styles.cardMetaRow}>
            <MetaPill label={`${paper.total_questions} Qs`} />
            <MetaPill label={`${paper.total_marks} marks`} />
            <MetaPill label={`${paper.duration_minutes} min`} />
          </View>
          <Text style={styles.cardCta}>Start Test →</Text>
        </TouchableOpacity>
      ))}

      {attempts.length > 0 && (
        <>
          <Text style={[styles.heading, { marginTop: 24, fontSize: 16 }]}>Past Attempts</Text>
          {attempts.map(a => (
            <TouchableOpacity key={a.attempt_id} style={styles.attemptRow} onPress={() => onViewAttempt(a.attempt_id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.attemptTitle}>{a.paper_title}</Text>
                <Text style={styles.attemptDate}>{new Date(a.submitted_at).toLocaleString()}</Text>
              </View>
              <Text style={styles.attemptScore}>{a.total_marks} / {a.max_marks}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}><Text style={styles.pillText}>{label}</Text></View>
  );
}

function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
      <Text style={styles.quickBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bgMuted },
  center: { flex: 1, backgroundColor: c.bgMuted, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 20, fontWeight: '800', color: c.text },
  subheading: { fontSize: 13, color: c.textMuted, marginTop: 4, marginBottom: 16 },
  error: { color: c.notAnswered, marginBottom: 12 },
  card: { backgroundColor: c.bg, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.text, marginBottom: 8 },
  cardMetaRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pill: { backgroundColor: c.sidebar, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: '600', color: c.primary },
  cardCta: { color: c.primary, fontWeight: '700', fontSize: 13 },
  dailyCard: { backgroundColor: c.amberBg, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.amberBorder },
  dailyStreak: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dailyStreakEmoji: { fontSize: 14 },
  dailyStreakText: { fontSize: 12, fontWeight: '700', color: c.amberText },
  dailyTitle: { fontSize: 15, fontWeight: '800', color: c.text, marginBottom: 4 },
  dailySubtitle: { fontSize: 12, color: c.textMuted },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickBtn: { flex: 1, backgroundColor: c.sidebar, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center' },
  quickBtnText: { fontSize: 11, fontWeight: '700', color: c.primary, textAlign: 'center' },
  attemptRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: c.border },
  attemptTitle: { fontSize: 13, fontWeight: '600', color: c.text },
  attemptDate: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  attemptScore: { fontSize: 14, fontWeight: '800', color: c.primary },
});
