import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { pyqApi, TopicFrequency } from '../../services/api';
import { pyqColors as c } from './colors';

interface Props {
  onBack: () => void;
  onPracticeTopic: (topic: string) => void;
}

export default function TopicsScreen({ onBack, onPracticeTopic }: Props) {
  const [topics, setTopics] = useState<TopicFrequency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    pyqApi.getTopics()
      .then(setTopics)
      .catch(() => setError('Could not load topics. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const maxCount = topics[0]?.question_count ?? 1;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.backLink}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Most Frequently Asked Topics</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={c.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.subheading}>Ranked by how often each topic appears across all PYQ papers. Tap a topic to practice it.</Text>
          {topics.map((t, i) => (
            <TouchableOpacity key={t.topic} style={styles.row} onPress={() => onPracticeTopic(t.topic)}>
              <View style={styles.rankBadge}><Text style={styles.rankText}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topicName}>{t.topic}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.max(6, (t.question_count / maxCount) * 100)}%` }]} />
                </View>
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countText}>{t.question_count} Qs</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: { backgroundColor: c.header, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 3, borderBottomColor: '#e6b335' },
  backLink: { color: '#fff', fontSize: 12, fontWeight: '600' },
  headerTitle: { color: c.headerText, fontWeight: '700', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: c.notAnswered },
  subheading: { fontSize: 12, color: c.textMuted, marginBottom: 16, lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.bgMuted, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: c.border },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.sidebar, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 11, fontWeight: '800', color: c.primary },
  topicName: { fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 6 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: c.primary },
  countPill: { backgroundColor: c.sidebar, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { fontSize: 11, fontWeight: '700', color: c.primary },
});
