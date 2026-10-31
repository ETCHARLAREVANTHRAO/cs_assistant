import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pyqApi, pyqAssetUrl, PYQResult, PYQQuestionResult } from '../../services/api';
import { pyqColors as c } from './colors';

interface Props {
  result: PYQResult;
  onBack: () => void;
}

const isImagePath = (v: string | null | undefined): v is string => !!v && v.startsWith('/pyq-assets/');

function statusColor(status: string): string {
  if (status === 'correct') return c.correct;
  if (status === 'incorrect') return c.incorrect;
  return c.notVisited;
}

function isGiven(q: PYQQuestionResult, key: string): boolean {
  return Array.isArray(q.given_answer) ? q.given_answer.includes(key) : q.given_answer === key;
}

function isCorrectOption(q: PYQQuestionResult, key: string): boolean {
  return Array.isArray(q.correct_answer) ? q.correct_answer.includes(key) : q.correct_answer === key;
}

export default function SolutionReview({ result, onBack }: Props) {
  const questions = result.questions;
  const [index, setIndex] = useState(0);
  const [gridVisible, setGridVisible] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const q = questions[index];

  async function askAiToExplain() {
    setExplaining(true);
    setAiExplanation(null);
    try {
      const explanation = await pyqApi.explainQuestion({
        question: q.question,
        options: q.options,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        given_answer: q.given_answer,
        topic: q.topic,
        explanation: q.explanation,
      });
      setAiExplanation(explanation);
    } catch {
      Alert.alert('Could not get an explanation', 'Please check your connection and try again.');
    } finally {
      setExplaining(false);
    }
  }

  function goToIndex(i: number) {
    setIndex(i);
    setAiExplanation(null);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.backLink}>← Result</Text></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{result.paper_title}</Text>
        <TouchableOpacity onPress={() => setGridVisible(true)}>
          <Ionicons name="grid-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.infoLabel}>{q.question_type} · +{q.marks}{q.negative_marking > 0 ? ` / -${q.negative_marking}` : ''}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor(q.status) }]}>
          <Text style={styles.statusPillText}>{q.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.qNumber}>Question No. {index + 1}</Text>

        {isImagePath(q.image_url) && (
          <Image source={{ uri: pyqAssetUrl(q.image_url) }} style={styles.figureImage} resizeMode="contain" />
        )}
        <Text style={styles.qText}>{q.question}</Text>

        {q.question_type !== 'NAT' && q.options && Object.entries(q.options).map(([key, value]) => {
          const given = isGiven(q, key);
          const isCorrect = isCorrectOption(q, key);
          const style = isCorrect ? styles.optionCorrect : given ? styles.optionIncorrect : styles.optionNeutral;
          return (
            <View key={key} style={[styles.optionRow, style]}>
              <View style={[styles.optionMark, isCorrect ? styles.optionMarkCorrect : given ? styles.optionMarkIncorrect : styles.optionMarkNeutral]}>
                {isCorrect && <Ionicons name="checkmark" size={13} color="#fff" />}
                {!isCorrect && given && <Ionicons name="close" size={13} color="#fff" />}
              </View>
              {isImagePath(value)
                ? <Image source={{ uri: pyqAssetUrl(value) }} style={styles.optionImage} resizeMode="contain" />
                : <Text style={styles.optionText}>{value}</Text>}
              {isCorrect && <Text style={styles.tagCorrect}>Correct Answer</Text>}
              {!isCorrect && given && <Text style={styles.tagIncorrect}>Your Answer</Text>}
            </View>
          );
        })}

        {q.question_type === 'NAT' && (
          <View style={styles.natRow}>
            <View style={styles.natBox}>
              <Text style={styles.natBoxLabel}>Your Answer</Text>
              <Text style={[styles.natBoxValue, { color: statusColor(q.status) }]}>{q.given_answer != null && q.given_answer !== '' ? String(q.given_answer) : '—'}</Text>
            </View>
            <View style={styles.natBox}>
              <Text style={styles.natBoxLabel}>Correct Answer</Text>
              <Text style={[styles.natBoxValue, { color: c.correct }]}>{String(q.correct_answer)}</Text>
            </View>
          </View>
        )}

        {q.explanation && (
          <View style={styles.explBox}>
            <Text style={styles.explTitle}>Explanation</Text>
            <Text style={styles.explText}>{q.explanation}</Text>
            {q.solution_steps && q.solution_steps.length > 0 && (
              <>
                <Text style={styles.stepsTitle}>Step-by-step solution</Text>
                {q.solution_steps.map((step, i) => (
                  <Text key={i} style={styles.stepText}>{i + 1}. {step}</Text>
                ))}
              </>
            )}
            {(q.topic || q.difficulty) && (
              <View style={styles.metaRow}>
                {q.topic && <Text style={styles.metaText}>Topic: {q.topic}</Text>}
                {q.difficulty && <Text style={styles.metaText}>Difficulty: {q.difficulty}</Text>}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.explainBtn} onPress={askAiToExplain} disabled={explaining}>
          {explaining
            ? <ActivityIndicator color={c.primary} size="small" />
            : <Ionicons name="sparkles-outline" size={15} color={c.primary} />}
          <Text style={styles.explainBtnText}>{explaining ? 'Asking AI…' : 'Explain with AI'}</Text>
        </TouchableOpacity>

        {aiExplanation && (
          <View style={styles.aiBox}>
            <Text style={styles.aiTitle}>AI Explanation</Text>
            <Text style={styles.aiText}>{aiExplanation}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navBtn, index === 0 && styles.navBtnDisabled]}
          disabled={index === 0}
          onPress={() => goToIndex(index - 1)}
        >
          <Text style={styles.navBtnText}>← Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnPrimary, index === questions.length - 1 && styles.navBtnDisabled]}
          disabled={index === questions.length - 1}
          onPress={() => goToIndex(index + 1)}
        >
          <Text style={styles.navBtnTextPrimary}>Next →</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={gridVisible} transparent animationType="slide" onRequestClose={() => setGridVisible(false)}>
        <View style={styles.gridBackdrop}>
          <View style={styles.gridSheet}>
            <View style={styles.gridHeader}>
              <Text style={styles.gridTitle}>Jump to Question</Text>
              <TouchableOpacity onPress={() => setGridVisible(false)}><Text style={styles.gridClose}>Close</Text></TouchableOpacity>
            </View>
            <View style={styles.legendRow}>
              <LegendDot color={c.correct} label={`Correct (${result.correct})`} />
              <LegendDot color={c.incorrect} label={`Incorrect (${result.incorrect})`} />
              <LegendDot color={c.notVisited} label={`Unattempted (${result.unattempted})`} />
            </View>
            <ScrollView contentContainerStyle={styles.grid}>
              {questions.map((qr, i) => (
                <TouchableOpacity
                  key={qr.question_id}
                  style={[styles.gridCell, { backgroundColor: statusColor(qr.status) }, i === index && styles.gridCellCurrent]}
                  onPress={() => { goToIndex(i); setGridVisible(false); }}
                >
                  <Text style={styles.gridCellText}>{i + 1}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: { backgroundColor: c.header, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 3, borderBottomColor: '#e6b335', gap: 10 },
  backLink: { color: '#fff', fontSize: 12, fontWeight: '600' },
  headerTitle: { color: c.headerText, fontWeight: '700', fontSize: 13, flex: 1 },
  infoBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  infoLabel: { fontSize: 12, color: c.textMuted, fontWeight: '600' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statusPillText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  body: { flex: 1 },
  qNumber: { fontSize: 16, fontWeight: '800', color: c.text, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  figureImage: { width: '100%', height: 150, marginBottom: 14, backgroundColor: c.bgMuted, borderRadius: 6 },
  qText: { fontSize: 15, color: c.text, lineHeight: 22, marginBottom: 16 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, borderWidth: 1.5, marginBottom: 8 },
  optionCorrect: { borderColor: c.correct, backgroundColor: '#eef7e6' },
  optionIncorrect: { borderColor: c.incorrect, backgroundColor: '#fbeae4' },
  optionNeutral: { borderColor: c.border, backgroundColor: c.bg },
  optionMark: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  optionMarkCorrect: { backgroundColor: c.correct },
  optionMarkIncorrect: { backgroundColor: c.incorrect },
  optionMarkNeutral: { borderWidth: 2, borderColor: c.border },
  optionText: { flex: 1, fontSize: 13, color: c.text, lineHeight: 19 },
  optionImage: { flex: 1, height: 60 },
  tagCorrect: { fontSize: 9, fontWeight: '800', color: c.correct, textTransform: 'uppercase' },
  tagIncorrect: { fontSize: 9, fontWeight: '800', color: c.incorrect, textTransform: 'uppercase' },
  natRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  natBox: { flex: 1, backgroundColor: c.bgMuted, borderRadius: 8, padding: 12 },
  natBoxLabel: { fontSize: 10, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  natBoxValue: { fontSize: 18, fontWeight: '800' },
  explBox: { backgroundColor: '#eaf4fa', borderWidth: 1, borderColor: '#bfe0ee', borderRadius: 8, padding: 14, marginTop: 4 },
  explTitle: { fontSize: 13, fontWeight: '800', color: c.primary, marginBottom: 8 },
  explText: { fontSize: 13, color: c.text, lineHeight: 19, marginBottom: 10 },
  stepsTitle: { fontSize: 11, fontWeight: '700', color: c.primary, textTransform: 'uppercase', marginBottom: 6 },
  stepText: { fontSize: 12, color: c.text, lineHeight: 18, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#bfe0ee' },
  metaText: { fontSize: 11, color: c.textMuted },
  explainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, borderWidth: 1.5, borderColor: c.primary, borderRadius: 8, paddingVertical: 12 },
  explainBtnText: { color: c.primary, fontWeight: '700', fontSize: 13 },
  aiBox: { backgroundColor: c.amberBg, borderWidth: 1, borderColor: c.amberBorder, borderRadius: 8, padding: 14, marginTop: 10 },
  aiTitle: { fontSize: 13, fontWeight: '800', color: c.amberText, marginBottom: 8 },
  aiText: { fontSize: 13, color: c.text, lineHeight: 19 },
  footer: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: c.border },
  navBtn: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 6, paddingVertical: 12, alignItems: 'center' },
  navBtnPrimary: { backgroundColor: c.primary, borderColor: c.primary },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: c.text, fontWeight: '600', fontSize: 13 },
  navBtnTextPrimary: { color: '#fff', fontWeight: '700', fontSize: 13 },
  gridBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  gridSheet: { backgroundColor: c.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '75%' },
  gridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border },
  gridTitle: { fontSize: 16, fontWeight: '700', color: c.text },
  gridClose: { color: c.primary, fontWeight: '600' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: c.sidebar },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 14, height: 14, borderRadius: 4 },
  legendText: { fontSize: 11, color: c.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  gridCell: { width: 40, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  gridCellCurrent: { borderWidth: 2, borderColor: c.text },
  gridCellText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
