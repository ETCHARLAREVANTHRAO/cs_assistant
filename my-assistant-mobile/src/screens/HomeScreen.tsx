import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScrollShell, Card, Pill, theme } from '../components/MobileScaffold';
import { pyqApi, AnalyticsResponse } from '../services/api';

const featureRows: Array<{ title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; route: string }> = [
  { title: 'Learning', subtitle: 'Syllabus, notes, formulas, videos', icon: 'book-outline', route: 'Learning' },
  { title: 'Doubts', subtitle: 'AI doubt solver with upload support', icon: 'help-buoy-outline', route: 'Doubts' },
  { title: 'Planner', subtitle: 'Daily sessions, reminders, goals', icon: 'calendar-outline', route: 'Planner' },
  { title: 'Resources', subtitle: 'Formulas, PYQ solutions, mistakes', icon: 'folder-open-outline', route: 'Resources' },
  { title: 'Progress', subtitle: 'Weak topics and analytics', icon: 'analytics-outline', route: 'Progress' },
  { title: 'AI Tools', subtitle: 'Tutor, quiz, mentor, revision plan', icon: 'sparkles-outline', route: 'AIFeatures' },
  { title: 'Local Model', subtitle: 'Run GGUF on this phone', icon: 'hardware-chip-outline', route: 'LocalModel' },
  { title: 'Community', subtitle: 'Discussions and faculty requests', icon: 'people-outline', route: 'Community' },
  { title: 'Exam Info', subtitle: 'Pattern, cutoffs, PSU, admissions', icon: 'school-outline', route: 'ExamInfo' },
  { title: 'Exam Assistant', subtitle: 'Focused exam-topic chat', icon: 'chatbubbles-outline', route: 'ExamAssistant' },
  { title: 'Motivation', subtitle: 'Daily quote, challenge, Pomodoro', icon: 'flame-outline', route: 'Motivation' },
  { title: 'Revision', subtitle: 'Crash plans and repeated concepts', icon: 'repeat-outline', route: 'Revision' },
  { title: 'Weather', subtitle: 'Quick weather check', icon: 'partly-sunny-outline', route: 'Weather' },
  { title: 'Downloads', subtitle: 'Offline export hub', icon: 'download-outline', route: 'Downloads' },
  { title: 'Settings', subtitle: 'Mobile app configuration', icon: 'settings-outline', route: 'Settings' },
];

export default function HomeScreen({ navigation }: { navigation: any }) {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    pyqApi.getAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  const weakTopic = analytics?.weak_topics?.[0]?.key ?? 'Mixed Practice';

  return (
    <ScrollShell title="My Assistant" subtitle="Your GATE CS command center on mobile.">
      <Card style={local.hero}>
        <View style={{ flex: 1 }}>
          <Pill label="Today" tone="primary" />
          <Text style={local.heroTitle}>Keep the next study action obvious.</Text>
          <Text style={local.heroText}>Start a PYQ, fix a weak topic, or ask the tutor when you get stuck.</Text>
        </View>
        <TouchableOpacity style={local.heroButton} onPress={() => navigation.navigate('PYQTab')}>
          <Ionicons name="play" size={18} color="#fff" />
        </TouchableOpacity>
      </Card>

      <View style={local.metrics}>
        <Metric label="Attempts" value={String(analytics?.total_attempts ?? 0)} />
        <Metric label="Accuracy" value={analytics ? `${analytics.overall_accuracy}%` : '--'} />
        <Metric label="Focus" value={weakTopic} small />
      </View>

      <Text style={local.sectionTitle}>Study Tools</Text>
      <View style={local.grid}>
        {featureRows.map((item) => (
          <TouchableOpacity key={item.route} style={local.feature} onPress={() => navigation.navigate(item.route)}>
            <View style={local.iconBox}>
              <Ionicons name={item.icon} size={20} color={theme.primary} />
            </View>
            <Text style={local.featureTitle}>{item.title}</Text>
            <Text style={local.featureText}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollShell>
  );
}

function Metric({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <View style={local.metric}>
      <Text style={local.metricLabel}>{label}</Text>
      <Text style={[local.metricValue, small && { fontSize: 13 }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const local = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface },
  heroTitle: { color: theme.text, fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 10 },
  heroText: { color: theme.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  heroButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary },
  metrics: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  metric: { flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12 },
  metricLabel: { color: theme.muted, fontSize: 11, fontWeight: '700' },
  metricValue: { color: theme.text, fontSize: 18, fontWeight: '900', marginTop: 5 },
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: '900', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  feature: { width: '48.5%', minHeight: 138, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 13 },
  iconBox: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primaryFixed, marginBottom: 10 },
  featureTitle: { color: theme.text, fontSize: 14, fontWeight: '900' },
  featureText: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
});
