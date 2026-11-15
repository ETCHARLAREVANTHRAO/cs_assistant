import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import {
  fetchPodcastEpisodes,
  generatePodcastDialogue,
  fetchVoiceQuizQuestions,
  type PodcastEpisode,
  type VoiceQuizQuestion,
} from '../services/api';

type AudioTab = 'podcast' | 'voice_quiz';

export default function AudioStudy() {
  const [activeTab, setActiveTab] = useState<AudioTab>('podcast');
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<PodcastEpisode | null>(null);
  const [activeLineIdx, setActiveLineIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Voice Quiz State
  const [quizQuestions, setQuizQuestions] = useState<VoiceQuizQuestion[]>([]);
  const [activeQuizIdx, setActiveQuizIdx] = useState<number>(0);
  const [userSpokenText, setUserSpokenText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [quizVerdict, setQuizVerdict] = useState<{ passed: boolean; message: string } | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetchPodcastEpisodes().then((data) => {
      setEpisodes(data);
      if (data.length > 0) setSelectedEpisode(data[0]);
    });
    fetchVoiceQuizQuestions().then(setQuizQuestions);
  }, []);

  // Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserSpokenText(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const speakText = (text: string, isSarah: boolean, onDone?: () => void) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = playbackRate;
    utterance.pitch = isSarah ? 1.25 : 0.95;
    utterance.onend = () => {
      if (onDone) onDone();
    };
    window.speechSynthesis.speak(utterance);
  };

  const playEpisodeSequence = (startIdx: number) => {
    if (!selectedEpisode || startIdx >= selectedEpisode.transcript.length) {
      setIsPlaying(false);
      setActiveLineIdx(-1);
      return;
    }
    setActiveLineIdx(startIdx);
    const line = selectedEpisode.transcript[startIdx];
    speakText(line.text, line.speaker === 'Sarah', () => {
      playEpisodeSequence(startIdx + 1);
    });
  };

  const togglePodcastPlayback = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playEpisodeSequence(activeLineIdx >= 0 ? activeLineIdx : 0);
    }
  };

  const handleGenerateCustom = async () => {
    if (!customTopicInput.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const ep = await generatePodcastDialogue(customTopicInput);
      setEpisodes((prev) => [ep, ...prev]);
      setSelectedEpisode(ep);
      setCustomTopicInput('');
    } finally {
      setIsGenerating(false);
    }
  };

  // Voice Quiz Actions
  const currentQuiz = quizQuestions[activeQuizIdx];

  const playQuizQuestionPrompt = () => {
    if (!currentQuiz) return;
    speakText(currentQuiz.voice_prompt, false);
  };

  const startVoiceAnswer = () => {
    if (!recognitionRef.current) return;
    setUserSpokenText('');
    setQuizVerdict(null);
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopVoiceAnswerAndVerify = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (!currentQuiz) return;

    const lower = userSpokenText.toLowerCase();
    const matched = currentQuiz.expected_keywords.filter((kw) => lower.includes(kw.toLowerCase()));
    const passed = matched.length >= Math.ceil(currentQuiz.expected_keywords.length / 2);

    setQuizVerdict({
      passed,
      message: passed
        ? `Great job! You mentioned: ${matched.join(', ')}.`
        : `Key points to include: ${currentQuiz.expected_keywords.join(', ')}. Ideal answer: ${currentQuiz.ideal_spoken_answer}`,
    });

    speakText(
      passed ? 'Correct! Excellent answer.' : `Not quite. ${currentQuiz.ideal_spoken_answer}`,
      true
    );
  };

  return (
    <Layout activePage="audio-study" title="AI Audio Revision & Podcast">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-teal-950/60 via-slate-900/80 to-slate-900 border border-teal-500/20 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">headphones</span>
                <span>Hands-Free Audio Learning</span>
              </div>
              <h1 className="text-2xl font-black text-white">AI Audio Revision & Commute Study</h1>
              <p className="text-sm text-slate-300 mt-1">
                Listen to 2-host conversational dialogues explaining core concepts, or practice hands-free voice quizzes.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-1 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('podcast')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'podcast'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">podcasts</span>
                <span>2-Host Podcasts</span>
              </button>
              <button
                onClick={() => setActiveTab('voice_quiz')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'voice_quiz'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
                <span>Voice Quizzer</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. PODCAST TAB */}
        {activeTab === 'podcast' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player & Transcript */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              {/* Active Episode Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-400 font-mono">
                    {selectedEpisode?.subject} • {selectedEpisode?.duration_minutes} Mins
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">
                    {selectedEpisode?.title}
                  </h2>
                </div>

                {/* Animated Waveform */}
                <div className="flex items-center gap-1">
                  {[4, 12, 8, 16, 10, 6].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: isPlaying ? `${h * 1.5}px` : '4px' }}
                      className="w-1 bg-teal-400 rounded-full transition-all duration-200"
                    />
                  ))}
                </div>
              </div>

              {/* Player Controls Bar */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePodcastPlayback}
                    className="w-12 h-12 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center shadow-md transition"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                      {isPlaying ? 'Playing Audio' : 'Paused / Ready'}
                    </div>
                    <div className="text-[10px] text-slate-400">Alex &amp; Sarah Narrating</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Speed:</span>
                  {[1.0, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition ${
                        playbackRate === rate
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Dialogue Transcript */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {selectedEpisode?.transcript.map((line, idx) => {
                  const isCurrent = activeLineIdx === idx;
                  const isSarah = line.speaker === 'Sarah';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 ring-1 ring-teal-500/30'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className={isSarah ? 'text-purple-400' : 'text-blue-400'}>
                          {line.speaker} ({line.role})
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-500/20 text-teal-300 font-mono">
                            Speaking...
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed">{line.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar: Episodes & Generator */}
            <div className="space-y-4">
              {/* Custom Topic Generator */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-teal-400">auto_fix_high</span>
                  <span>Generate Custom Episode</span>
                </h3>

                <input
                  type="text"
                  value={customTopicInput}
                  onChange={(e) => setCustomTopicInput(e.target.value)}
                  placeholder="e.g. Master Theorem Case 3"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-white"
                />

                <button
                  onClick={handleGenerateCustom}
                  disabled={!customTopicInput.trim() || isGenerating}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm"
                >
                  {isGenerating ? 'Synthesizing Dialogue...' : 'Generate 2-Host Dialogue'}
                </button>
              </div>

              {/* Episode Playlist */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Available Episodes
                </h3>

                <div className="space-y-2">
                  {episodes.map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => {
                        window.speechSynthesis.cancel();
                        setIsPlaying(false);
                        setSelectedEpisode(ep);
                        setActiveLineIdx(-1);
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition ${
                        selectedEpisode?.id === ep.id
                          ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{ep.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{ep.subject}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. VOICE QUIZZER TAB */}
        {activeTab === 'voice_quiz' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-3xl mx-auto shadow-sm space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <span className="material-symbols-outlined text-3xl">record_voice_over</span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono">
                {currentQuiz?.subject} • Question {activeQuizIdx + 1} of {quizQuestions.length}
              </span>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {currentQuiz?.voice_prompt}
              </h2>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={playQuizQuestionPrompt}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">volume_up</span>
                <span>Read Question Aloud</span>
              </button>
            </div>

            {/* Voice Input Box */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="text-xs text-slate-400">
                {isListening ? 'Listening to your spoken answer...' : 'Click the microphone to speak your answer'}
              </div>

              <div className="min-h-16 flex items-center justify-center text-slate-800 dark:text-white font-medium text-sm italic">
                {userSpokenText ? `"${userSpokenText}"` : 'Your spoken words will appear here...'}
              </div>

              <div className="flex justify-center gap-3 pt-2">
                {!isListening ? (
                  <button
                    onClick={startVoiceAnswer}
                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">mic</span>
                    <span>Speak Answer</span>
                  </button>
                ) : (
                  <button
                    onClick={stopVoiceAnswerAndVerify}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md animate-pulse transition flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">stop</span>
                    <span>Finish &amp; Evaluate</span>
                  </button>
                )}
              </div>
            </div>

            {/* Verdict */}
            {quizVerdict && (
              <div
                className={`p-4 rounded-2xl text-xs text-left leading-relaxed ${
                  quizVerdict.passed
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="font-bold mb-1">{quizVerdict.passed ? '✓ Correct' : '⚠️ Feedback'}</div>
                <div>{quizVerdict.message}</div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={activeQuizIdx === 0}
                onClick={() => {
                  setActiveQuizIdx((p) => p - 1);
                  setUserSpokenText('');
                  setQuizVerdict(null);
                }}
                className="text-xs text-slate-400 hover:text-white disabled:opacity-40"
              >
                ← Previous
              </button>
              <button
                disabled={activeQuizIdx >= quizQuestions.length - 1}
                onClick={() => {
                  setActiveQuizIdx((p) => p + 1);
                  setUserSpokenText('');
                  setQuizVerdict(null);
                }}
                className="text-xs text-teal-400 font-bold hover:underline disabled:opacity-40"
              >
                Next Question →
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
