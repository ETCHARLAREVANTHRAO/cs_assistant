import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { pyqApi, PYQPaperDetail } from '../../services/api';
import { pyqColors as c } from './colors';

interface Props {
  paperId: string;
  onBack: () => void;
  onBegin: () => void;
  starting: boolean;
}

export default function PaperInstructions({ paperId, onBack, onBegin, starting }: Props) {
  const [paper, setPaper] = useState<PYQPaperDetail | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    pyqApi.getPaper(paperId).then(setPaper).catch(() => setError('Could not load paper details.'));
  }, [paperId]);

  if (!paper) {
    return (
      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={c.primary} size="large" />}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>{paper.title}</Text>
      </View>
      <View style={styles.subheader}><Text style={styles.subheaderText}>Other Important Instructions</Text></View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.h2}>Paper-specific instructions</Text>
        <Text style={styles.p}>
          This question paper has <Text style={styles.bold}>{paper.total_questions} questions</Text> for a total
          of <Text style={styles.bold}>{paper.total_marks} marks</Text>. It consists of {paper.sections.length} sections.
          All sections are compulsory.
        </Text>

        <View style={styles.table}>
          <View style={[styles.tr, styles.thRow]}>
            <Text style={[styles.th, { flex: 2 }]}>Section</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Questions</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Marks</Text>
          </View>
          {paper.sections.map((s, i) => (
            <View key={s.section} style={[styles.tr, i !== paper.sections.length - 1 && styles.trBorder]}>
              <Text style={[styles.td, { flex: 2 }]}>{s.section_title}</Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>{s.question_count}</Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>{s.total_marks}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.p}>Questions within each section appear in the same fixed order as the official paper.</Text>
      </ScrollView>

      <View style={styles.agreeRow}>
        <TouchableOpacity style={styles.checkbox} onPress={() => setAgreed(v => !v)}>
          {agreed && <View style={styles.checkboxDot} />}
        </TouchableOpacity>
        <Text style={styles.agreeText}>
          I have read and understood the instructions. I am aware this is a timed mock test and once submitted
          my answers cannot be changed.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backBtnText}>Back</Text></TouchableOpacity>
        <TouchableOpacity
          style={[styles.beginBtn, (!agreed || starting) && styles.beginBtnDisabled]}
          disabled={!agreed || starting}
          onPress={onBegin}
        >
          {starting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.beginBtnText}>I am ready to begin</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' },
  error: { color: c.notAnswered },
  header: { backgroundColor: c.header, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: '#e6b335' },
  headerTitle: { color: c.headerText, fontWeight: '700', fontSize: 14 },
  subheader: { backgroundColor: c.sidebar, paddingHorizontal: 16, paddingVertical: 8 },
  subheaderText: { color: c.primary, fontWeight: '700' },
  body: { flex: 1 },
  h2: { fontSize: 18, fontWeight: '800', textAlign: 'center', color: c.text, marginBottom: 16 },
  bold: { fontWeight: '700', color: c.text },
  p: { fontSize: 13, color: c.text, lineHeight: 20, marginBottom: 14 },
  table: { borderWidth: 1, borderColor: c.border, borderRadius: 6, overflow: 'hidden', marginBottom: 14 },
  tr: { flexDirection: 'row', padding: 10 },
  thRow: { backgroundColor: c.sidebar },
  trBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  th: { fontSize: 12, fontWeight: '700', color: c.text },
  td: { fontSize: 13, color: c.text },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.border },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: c.textMuted, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxDot: { width: 12, height: 12, borderRadius: 2, backgroundColor: c.primary },
  agreeText: { flex: 1, fontSize: 12, color: c.textMuted, lineHeight: 17 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: c.border },
  backBtn: { borderWidth: 1, borderColor: c.border, borderRadius: 6, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: c.text, fontWeight: '600' },
  beginBtn: { backgroundColor: c.secondary, borderRadius: 6, paddingHorizontal: 24, paddingVertical: 10, minWidth: 160, alignItems: 'center' },
  beginBtnDisabled: { opacity: 0.5 },
  beginBtnText: { color: '#fff', fontWeight: '700' },
});
