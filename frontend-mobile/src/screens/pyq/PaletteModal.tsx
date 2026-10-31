import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { PYQQuestion } from '../../services/api';
import { pyqColors } from './colors';
import { QuestionUIState, questionStatus } from './types';

interface Props {
  visible: boolean;
  onClose: () => void;
  questions: PYQQuestion[];
  states: Record<string, QuestionUIState>;
  currentQuestionId: string;
  onJump: (questionId: string) => void;
}

function styleFor(status: string) {
  switch (status) {
    case 'answered':
      return { backgroundColor: pyqColors.answered, color: '#fff' };
    case 'not_answered':
      return { backgroundColor: pyqColors.notAnswered, color: '#fff' };
    case 'marked':
      return { backgroundColor: pyqColors.marked, color: '#fff' };
    case 'answered_marked':
      return { backgroundColor: pyqColors.marked, color: '#fff' };
    default:
      return { backgroundColor: pyqColors.notVisited, color: pyqColors.notVisitedText };
  }
}

export default function PaletteModal({ visible, onClose, questions, states, currentQuestionId, onJump }: Props) {
  const bySection: Record<string, PYQQuestion[]> = {};
  const order: string[] = [];
  for (const q of questions) {
    if (!bySection[q.section]) { bySection[q.section] = []; order.push(q.section); }
    bySection[q.section].push(q);
  }

  const counts = { answered: 0, not_answered: 0, not_visited: 0, marked: 0, answered_marked: 0 };
  questions.forEach(q => { counts[questionStatus(states[q.question_id])]++; });

  // Question numbers are continuous across the whole paper (Q1..Q65), not per-section.
  const numberOf: Record<string, number> = {};
  questions.forEach((q, i) => { numberOf[q.question_id] = i + 1; });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Choose a Question</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.close}>Close</Text></TouchableOpacity>
          </View>

          <View style={styles.legendRow}>
            <LegendItem color={pyqColors.answered} label={`Answered (${counts.answered})`} />
            <LegendItem color={pyqColors.notAnswered} label={`Not Answered (${counts.not_answered})`} />
            <LegendItem color={pyqColors.notVisited} textColor={pyqColors.notVisitedText} label={`Not Visited (${counts.not_visited})`} />
            <LegendItem color={pyqColors.marked} label={`Marked (${counts.marked + counts.answered_marked})`} />
          </View>

          <ScrollView style={styles.body}>
            {order.map(section => (
              <View key={section} style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>{section}</Text>
                <View style={styles.grid}>
                  {bySection[section].map(q => {
                    const status = questionStatus(states[q.question_id]);
                    const s = styleFor(status);
                    const isCurrent = q.question_id === currentQuestionId;
                    return (
                      <TouchableOpacity
                        key={q.question_id}
                        style={[styles.cell, { backgroundColor: s.backgroundColor }, isCurrent && styles.cellCurrent]}
                        onPress={() => { onJump(q.question_id); onClose(); }}
                      >
                        <Text style={[styles.cellText, { color: s.color }]}>{numberOf[q.question_id]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function LegendItem({ color, textColor, label }: { color: string; textColor?: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]}>
        <View />
      </View>
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: pyqColors.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '75%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: pyqColors.border },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: pyqColors.text },
  close: { color: pyqColors.primary, fontWeight: '600' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 10, gap: 12, backgroundColor: pyqColors.sidebar },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '46%' },
  legendSwatch: { width: 16, height: 16, borderRadius: 4 },
  legendText: { fontSize: 11, color: pyqColors.textMuted },
  body: { padding: 16 },
  sectionBlock: { marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: pyqColors.primary, marginBottom: 8, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: 40, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: pyqColors.border },
  cellCurrent: { borderWidth: 2, borderColor: pyqColors.primary },
  cellText: { fontWeight: '700', fontSize: 13 },
});
