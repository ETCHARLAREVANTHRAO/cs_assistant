import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { pyqApi, DailyPracticeResponse, PYQAttemptStartResponse, PYQPaperSummary, PYQResult, PracticeFilter } from '../services/api';
import HomeScreen from './pyq/HomeScreen';
import GeneralInstructions from './pyq/GeneralInstructions';
import PaperInstructions from './pyq/PaperInstructions';
import ExamPlayer from './pyq/ExamPlayer';
import ResultScreen from './pyq/ResultScreen';
import SolutionReview from './pyq/SolutionReview';
import PracticeSetup from './pyq/PracticeSetup';
import TopicsScreen from './pyq/TopicsScreen';
import AnalyticsScreen from './pyq/AnalyticsScreen';

type Step = 'home' | 'general' | 'paper_instructions' | 'exam' | 'result' | 'review' | 'practice_setup' | 'topics' | 'analytics';

export default function PYQScreen() {
  const route = useRoute<any>();
  const [step, setStep] = useState<Step>('home');
  const [selectedPaper, setSelectedPaper] = useState<PYQPaperSummary | null>(null);
  const [attempt, setAttempt] = useState<PYQAttemptStartResponse | null>(null);
  const [result, setResult] = useState<PYQResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [practiceTopic, setPracticeTopic] = useState<string | undefined>(undefined);

  useEffect(() => {
    const topic = route.params?.practiceTopic;
    if (typeof topic === 'string' && topic) {
      setPracticeTopic(topic);
      setStep('practice_setup');
    }
  }, [route.params?.practiceTopic]);

  function selectPaper(paper: PYQPaperSummary) {
    setSelectedPaper(paper);
    setStep('general');
  }

  async function viewPastAttempt(attemptId: string) {
    try {
      const r = await pyqApi.getResult(attemptId);
      setResult(r);
      setStep('result');
    } catch {
      Alert.alert('Could not load result', 'Please try again.');
    }
  }

  async function beginAttempt() {
    if (!selectedPaper) return;
    setStarting(true);
    try {
      const a = await pyqApi.startAttempt(selectedPaper.paper_id);
      setAttempt(a);
      setStep('exam');
    } catch {
      Alert.alert('Could not start test', 'Please check your connection and try again.');
    } finally {
      setStarting(false);
    }
  }

  async function startPractice(filter: PracticeFilter) {
    setStarting(true);
    try {
      const a = await pyqApi.startPractice(filter);
      setSelectedPaper(null);
      setAttempt(a);
      setStep('exam');
    } catch (e: any) {
      Alert.alert('Could not start practice', e?.response?.data?.detail || 'Please try again.');
    } finally {
      setStarting(false);
    }
  }

  async function startDaily(daily: DailyPracticeResponse) {
    if (daily.already_submitted) {
      try {
        const r = await pyqApi.getResult(daily.attempt_id);
        setResult(r);
        setStep('result');
      } catch {
        Alert.alert("Could not load today's result", 'Please try again.');
      }
    } else {
      setSelectedPaper(null);
      setAttempt(daily);
      setStep('exam');
    }
  }

  function handleSubmitted(r: PYQResult) {
    setResult(r);
    setAttempt(null);
    setStep('result');
  }

  function retake() {
    setResult(null);
    setStep(selectedPaper ? 'paper_instructions' : 'home');
  }

  function backToHome() {
    setSelectedPaper(null);
    setAttempt(null);
    setResult(null);
    setPracticeTopic(undefined);
    setStep('home');
  }

  return (
    <View style={styles.container}>
      {step === 'home' && (
        <HomeScreen
          onSelectPaper={selectPaper}
          onViewAttempt={viewPastAttempt}
          onStartDaily={startDaily}
          onOpenPracticeSetup={() => { setPracticeTopic(undefined); setStep('practice_setup'); }}
          onOpenTopics={() => setStep('topics')}
          onOpenAnalytics={() => setStep('analytics')}
        />
      )}

      {step === 'practice_setup' && (
        <PracticeSetup
          onBack={backToHome}
          onStart={startPractice}
          starting={starting}
          initialTopic={practiceTopic}
        />
      )}

      {step === 'topics' && (
        <TopicsScreen
          onBack={backToHome}
          onPracticeTopic={(topic) => { setPracticeTopic(topic); setStep('practice_setup'); }}
        />
      )}

      {step === 'analytics' && (
        <AnalyticsScreen onBack={backToHome} />
      )}

      {step === 'general' && selectedPaper && (
        <GeneralInstructions
          paperTitle={selectedPaper.title}
          durationMinutes={selectedPaper.duration_minutes}
          onBack={backToHome}
          onNext={() => setStep('paper_instructions')}
        />
      )}

      {step === 'paper_instructions' && selectedPaper && (
        <PaperInstructions
          paperId={selectedPaper.paper_id}
          starting={starting}
          onBack={() => setStep('general')}
          onBegin={beginAttempt}
        />
      )}

      {step === 'exam' && attempt && (
        <ExamPlayer attempt={attempt} onSubmitted={handleSubmitted} />
      )}

      {step === 'result' && result && (
        <ResultScreen
          result={result}
          onRetake={retake}
          onViewSolutions={() => setStep('review')}
          onBackHome={backToHome}
        />
      )}

      {step === 'review' && result && (
        <SolutionReview result={result} onBack={() => setStep('result')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
