import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { PYQQuestion } from '../../services/api';
import { pyqColors as c } from './colors';
import { QuestionUIState, questionStatus } from './types';

interface Props {
  visible: boolean;
  paperTitle: string;
  questions: PYQQuestion[];
  states: Record<string, QuestionUIState>;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function SubmitConfirm({ visible, paperTitle, questions, states, submitting, onCancel, onConfirm }: Props) {
  const bySection: Record<string, { title: string; total: number; answered: number; notAnswered: number; marked: number; notVisited: number }> = {};
  const order: string[] = [];
  let notVisitedTotal = 0;
  let notAnsweredTotal = 0;

  questions.forEach(q => {
    if (!bySection[q.section]) {
      bySection[q.section] = { title: q.section_title, total: 0, answered: 0, notAnswered: 0, marked: 0, notVisited: 0 };
      order.push(q.section);
    }
    const st = bySection[q.section];
    st.total++;
    const status = questionStatus(states[q.question_id]);
    if (status === 'answered' || status === 'answered_marked') st.answered++;
    else if (status === 'not_answered') { st.notAnswered++; notAnsweredTotal++; }
    else if (status === 'marked') st.marked++;
    else { st.notVisited++; notVisitedTotal++; }
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}><Text style={styles.headerText}>Submit Exam</Text></View>
          <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.question}>Are you sure you want to submit <Text style={styles.bold}>{paperTitle}</Text>?</Text>
            <Text style={styles.note}>Once submitted, you cannot change any of your answers.</Text>

            <View style={styles.table}>
              <View style={[styles.tr, styles.thRow]}>
                <Text style={[styles.th, { flex: 2 }]}>Section</Text>
                <Text style={[styles.th, styles.cell]}>Ans</Text>
                <Text style={[styles.th, styles.cell]}>Not Ans</Text>
                <Text style={[styles.th, styles.cell]}>Marked</Text>
                <Text style={[styles.th, styles.cell]}>Not Visited</Text>
              </View>
              {order.map((section, i) => {
                const s = bySection[section];
                return (
                  <View key={section} style={[styles.tr, i !== order.length - 1 && styles.trBorder]}>
                    <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>{s.title}</Text>
                    <Text style={[styles.td, styles.cell, { color: c.answered, fontWeight: '700' }]}>{s.answered}</Text>
                    <Text style={[styles.td, styles.cell, { color: c.notAnswered, fontWeight: '700' }]}>{s.notAnswered}</Text>
                    <Text style={[styles.td, styles.cell, { color: c.marked, fontWeight: '700' }]}>{s.marked}</Text>
                    <Text style={[styles.td, styles.cell]}>{s.notVisited}</Text>
                  </View>
                );
              })}
            </View>

            {(notVisitedTotal + notAnsweredTotal) > 0 && (
              <View style={styles.warning}>
                <Text style={styles.warningText}>
                  ⚠ You have {notVisitedTotal} question(s) not visited and {notAnsweredTotal} not answered.
                  These will be scored as zero.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Go Back to Exam</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Yes, Submit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: c.bg, borderRadius: 12, maxHeight: '85%', overflow: 'hidden' },
  header: { backgroundColor: c.header, paddingVertical: 12, paddingHorizontal: 16 },
  headerText: { color: c.headerText, fontWeight: '800', fontSize: 15 },
  body: { flexGrow: 0 },
  question: { fontSize: 14, color: c.text, marginBottom: 4, lineHeight: 20 },
  bold: { fontWeight: '700', color: c.primary },
  note: { fontSize: 12, color: c.textMuted, marginBottom: 14 },
  table: { borderWidth: 1, borderColor: c.border, borderRadius: 6, overflow: 'hidden' },
  tr: { flexDirection: 'row', padding: 8, alignItems: 'center' },
  thRow: { backgroundColor: c.bgMuted },
  trBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  th: { fontSize: 10, fontWeight: '700', color: c.textMuted, textAlign: 'center' },
  td: { fontSize: 12, textAlign: 'center', color: c.text },
  cell: { flex: 1 },
  warning: { backgroundColor: c.amberBg, borderWidth: 1, borderColor: c.amberBorder, borderRadius: 6, padding: 10, marginTop: 14 },
  warningText: { fontSize: 12, color: c.amberText, lineHeight: 17 },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: c.border },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 6, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: c.text, fontWeight: '600', fontSize: 13 },
  confirmBtn: { flex: 1, backgroundColor: c.primary, borderRadius: 6, paddingVertical: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
