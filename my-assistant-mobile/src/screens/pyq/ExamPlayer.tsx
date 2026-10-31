import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pyqApi, pyqAssetUrl, PYQAttemptStartResponse, PYQAnswer, PYQResult } from '../../services/api';
import { pyqColors as c } from './colors';
import { QuestionUIState } from './types';
import PaletteModal from './PaletteModal';
import SubmitConfirm from './SubmitConfirm';

interface Props {
  attempt: PYQAttemptStartResponse;
  onSubmitted: (result: PYQResult) => void;
}

const isImagePath = (v: string | undefined | null): v is string => !!v && v.startsWith('/pyq-assets/');

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ExamPlayer({ attempt, onSubmitted }: Props) {
  const questions = attempt.paper.questions;
  const sectionOrder = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    questions.forEach(q => { if (!seen.has(q.section)) { seen.add(q.section); order.push(q.section); } });
    return order;
  }, [questions]);
  const sectionTitleByCode = useMemo(() => {
    const map: Record<string, string> = {};
    questions.forEach(q => { map[q.section] = q.section_title; });
    return map;
  }, [questions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, PYQAnswer>>({});
  const [visited, setVisited] = useState<Set<string>>(() => new Set([questions[0]?.question_id]));
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [draftAnswer, setDraftAnswer] = useState<PYQAnswer>(null);
  const [paletteVisible, setPaletteVisible] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(attempt.duration_minutes * 60);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const draftRef = useRef(draftAnswer);
  draftRef.current = draftAnswer;
  const autoSubmittedRef = useRef(false);
  const submittingRef = useRef(false);

  const currentQ = questions[currentIndex];

  // Sync the working draft whenever the visible question changes.
  useEffect(() => {
    const existing = answersRef.current[currentQ.question_id];
    setDraftAnswer(existing !== undefined ? existing : (currentQ.question_type === 'MSQ' ? [] : null));
  }, [currentIndex, currentQ.question_id, currentQ.question_type]);

  // Deadline-based countdown so it stays correct across app backgrounding.
  const deadline = useMemo(
    () => new Date(attempt.started_at).getTime() + attempt.duration_minutes * 60000,
    [attempt.started_at, attempt.duration_minutes],
  );

  useEffect(() => {
    const tick = () => {
      const secs = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemainingSeconds(secs);
      if (secs <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        handleSubmit(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  const states: Record<string, QuestionUIState> = {};
  questions.forEach(q => {
    states[q.question_id] = { visited: visited.has(q.question_id), marked: marked.has(q.question_id), answer: answers[q.question_id] ?? null };
  });

  function goTo(index: number) {
    setCurrentIndex(index);
    setVisited(prev => new Set(prev).add(questions[index].question_id));
  }

  function commitDraft(markReview: boolean) {
    const qid = currentQ.question_id;
    setAnswers(prev => ({ ...prev, [qid]: draftRef.current }));
    if (markReview) setMarked(prev => new Set(prev).add(qid));
  }

  function handleSaveNext() {
    commitDraft(false);
    if (currentIndex < questions.length - 1) goTo(currentIndex + 1);
  }

  function handleMarkForReview() {
    commitDraft(true);
    if (currentIndex < questions.length - 1) goTo(currentIndex + 1);
  }

  function handleClear() {
    const cleared = currentQ.question_type === 'MSQ' ? [] : null;
    setDraftAnswer(cleared);
    setAnswers(prev => ({ ...prev, [currentQ.question_id]: cleared }));
  }

  function toggleOption(key: string) {
    if (currentQ.question_type === 'MCQ') {
      setDraftAnswer(key);
    } else if (currentQ.question_type === 'MSQ') {
      setDraftAnswer(prev => {
        const arr = Array.isArray(prev) ? [...prev] : [];
        const idx = arr.indexOf(key);
        if (idx >= 0) arr.splice(idx, 1); else arr.push(key);
        return arr;
      });
    }
  }

  async function handleSubmit(auto = false) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const finalAnswers = { ...answersRef.current, [currentQ.question_id]: draftRef.current };
      const result = await pyqApi.submitAttempt(attempt.attempt_id, finalAnswers);
      onSubmitted(result);
    } catch (e) {
      Alert.alert('Submission failed', auto ? 'Time is up but we could not auto-submit. Please try again.' : 'Could not submit your exam. Please check your connection and try again.');
      submittingRef.current = false;
      setSubmitting(false);
      autoSubmittedRef.current = false;
    }
  }

  const timeCritical = remainingSeconds <= 300;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>{attempt.paper.title}</Text>
        <TouchableOpacity onPress={() => setPaletteVisible(true)} style={styles.paletteBtn}>
          <Ionicons name="grid-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.subheader}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {sectionOrder.map(section => {
            const active = currentQ.section === section;
            return (
              <TouchableOpacity
                key={section}
                style={[styles.sectionTab, active && styles.sectionTabActive]}
                onPress={() => goTo(questions.findIndex(q => q.section === section))}
              >
                <Text style={[styles.sectionTabText, active && styles.sectionTabTextActive]} numberOfLines={1}>{sectionTitleByCode[section] ?? section}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={[styles.timer, timeCritical && styles.timerCritical]}>{formatTime(remainingSeconds)}</Text>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>Question Type: {currentQ.question_type}</Text>
        <Text style={styles.infoText}>
          <Text style={{ color: c.answered, fontWeight: '700' }}>+{currentQ.marks}</Text>
          {currentQ.negative_marking > 0 && <Text style={{ color: c.notAnswered, fontWeight: '700' }}> / -{currentQ.negative_marking}</Text>}
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={styles.qNumber}>Question No. {currentIndex + 1}</Text>

        {currentQ.question_type === 'MSQ' && (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>This question has one or more correct options. Select ALL that apply.</Text>
          </View>
        )}

        {isImagePath(currentQ.image_url) && (
          <Image source={{ uri: pyqAssetUrl(currentQ.image_url) }} style={styles.figureImage} resizeMode="contain" />
        )}

        <Text style={styles.qText}>{currentQ.question}</Text>

        {currentQ.question_type !== 'NAT' && currentQ.options && Object.entries(currentQ.options).map(([key, value]) => {
          const selected = currentQ.question_type === 'MSQ'
            ? Array.isArray(draftAnswer) && draftAnswer.includes(key)
            : draftAnswer === key;
          return (
            <TouchableOpacity key={key} style={styles.optionRow} onPress={() => toggleOption(key)}>
              <View style={[
                currentQ.question_type === 'MSQ' ? styles.checkbox : styles.radio,
                selected && (currentQ.question_type === 'MSQ' ? styles.checkboxSelected : styles.radioSelected),
              ]}>
                {selected && currentQ.question_type === 'MSQ' && <Ionicons name="checkmark" size={13} color="#fff" />}
                {selected && currentQ.question_type === 'MCQ' && <View style={styles.radioDot} />}
              </View>
              {isImagePath(value)
                ? <Image source={{ uri: pyqAssetUrl(value) }} style={styles.optionImage} resizeMode="contain" />
                : <Text style={styles.optionText}>{value}</Text>}
            </TouchableOpacity>
          );
        })}

        {currentQ.question_type === 'NAT' && (
          <View>
            <TextInput
              style={styles.natInput}
              value={typeof draftAnswer === 'string' ? draftAnswer : ''}
              onChangeText={setDraftAnswer}
              keyboardType="numbers-and-punctuation"
              placeholder="Type a number"
              placeholderTextColor={c.textMuted}
            />
            <Text style={styles.natHint}>Answer may be an integer or a decimal (e.g. 12 or 3.5).</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleMarkForReview}>
            <Text style={styles.secondaryBtnText}>Mark for Review & Next</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleClear}>
            <Text style={styles.secondaryBtnText}>Clear Response</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.submitBtn} onPress={() => setSubmitModalVisible(true)}>
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveNextBtn} onPress={handleSaveNext}>
            <Text style={styles.saveNextBtnText}>Save & Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PaletteModal
        visible={paletteVisible}
        onClose={() => setPaletteVisible(false)}
        questions={questions}
        states={states}
        currentQuestionId={currentQ.question_id}
        onJump={qid => goTo(questions.findIndex(q => q.question_id === qid))}
      />

      <SubmitConfirm
        visible={submitModalVisible}
        paperTitle={attempt.paper.title}
        questions={questions}
        states={states}
        submitting={submitting}
        onCancel={() => setSubmitModalVisible(false)}
        onConfirm={() => handleSubmit(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: { backgroundColor: c.header, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 3, borderBottomColor: '#e6b335' },
  headerTitle: { color: c.headerText, fontWeight: '700', fontSize: 13, flex: 1, marginRight: 12 },
  paletteBtn: { padding: 4 },
  subheader: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.sidebar, paddingHorizontal: 8, paddingVertical: 6 },
  sectionTab: { maxWidth: 160, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border },
  sectionTabActive: { backgroundColor: c.primary, borderColor: c.primary },
  sectionTabText: { fontSize: 12, fontWeight: '600', color: c.primary },
  sectionTabTextActive: { color: '#fff' },
  timer: { fontSize: 13, fontWeight: '800', color: c.text, paddingHorizontal: 8, fontVariant: ['tabular-nums'] },
  timerCritical: { color: c.notAnswered },
  infoBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  infoText: { fontSize: 12, color: c.textMuted, fontWeight: '600' },
  content: { flex: 1 },
  qNumber: { fontSize: 16, fontWeight: '800', color: c.text, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  noteBox: { backgroundColor: c.sidebar, borderRadius: 6, padding: 10, marginBottom: 14 },
  noteText: { fontSize: 12, color: c.primary, fontWeight: '600' },
  figureImage: { width: '100%', height: 160, marginBottom: 14, backgroundColor: c.bgMuted, borderRadius: 6 },
  qText: { fontSize: 15, color: c.text, lineHeight: 22, marginBottom: 18 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.textMuted, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: c.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: c.primary },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: c.textMuted, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: c.primary, borderColor: c.primary },
  optionText: { flex: 1, fontSize: 14, color: c.text, lineHeight: 20 },
  optionImage: { flex: 1, height: 70 },
  natInput: { borderWidth: 2, borderColor: c.primary, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: c.text, maxWidth: 220 },
  natHint: { fontSize: 11, color: c.textMuted, marginTop: 8 },
  footer: { borderTopWidth: 1, borderTopColor: c.border, padding: 10, gap: 8 },
  footerRow: { flexDirection: 'row', gap: 8 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 6, paddingVertical: 10, alignItems: 'center' },
  secondaryBtnText: { fontSize: 12, fontWeight: '600', color: c.text },
  submitBtn: { flex: 1, backgroundColor: c.secondary, borderRadius: 6, paddingVertical: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  saveNextBtn: { flex: 2, backgroundColor: c.primary, borderRadius: 6, paddingVertical: 12, alignItems: 'center' },
  saveNextBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
