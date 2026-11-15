import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  startSpeedBattle,
  submitSpeedBattle,
  type BattleStartResponse,
  type BattleSubmitResult,
} from '../services/api';

type TabMode = 'duel' | 'study_room';

export default function SpeedBattle() {
  const [activeTab, setActiveTab] = useState<TabMode>('duel');

  // ==========================================
  // 1. 1v1 SPEED BATTLE STATE
  // ==========================================
  const [battleState, setBattleState] = useState<'idle' | 'matching' | 'playing' | 'result'>('idle');
  const [matchData, setMatchData] = useState<BattleStartResponse | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [userTimes, setUserTimes] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [battleResult, setBattleResult] = useState<BattleSubmitResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Web Audio Context for beeps and ambience
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playBeep = (freq = 440, duration = 0.1) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Start matchmaking
  const handleStartDuel = async () => {
    setBattleState('matching');
    playBeep(523, 0.15);
    try {
      const match = await startSpeedBattle();
      setTimeout(() => {
        setMatchData(match);
        setQuestionIndex(0);
        setTimeLeft(match.time_per_question || 20);
        setUserAnswers([]);
        setUserTimes([]);
        setSelectedOption(null);
        setBattleResult(null);
        setBattleState('playing');
        questionStartTimeRef.current = Date.now();
        playBeep(659, 0.2);
      }, 1200);
    } catch {
      setBattleState('idle');
    }
  };

  // Finalize and submit answers
  const finalizeBattle = useCallback(
    async (finalAnswers: number[], finalTimes: number[]) => {
      if (!matchData) return;
      setIsSubmitting(true);
      try {
        const result = await submitSpeedBattle(matchData.match_id, finalAnswers, finalTimes);
        setBattleResult(result);
        setBattleState('result');
        if (result.winner === 'user') {
          playBeep(880, 0.3);
        } else {
          playBeep(330, 0.3);
        }
      } catch {
        setBattleState('idle');
      } finally {
        setIsSubmitting(false);
      }
    },
    [matchData]
  );

  // Next question or finish
  const handleAdvanceQuestion = useCallback(
    (chosenOpt: number | null) => {
      if (!matchData) return;
      const elapsed = Math.min(20, (Date.now() - questionStartTimeRef.current) / 1000);
      const answerVal = chosenOpt !== null ? chosenOpt : -1;

      const nextAnswers = [...userAnswers, answerVal];
      const nextTimes = [...userTimes, elapsed];
      setUserAnswers(nextAnswers);
      setUserTimes(nextTimes);

      if (questionIndex + 1 < matchData.questions.length) {
        setQuestionIndex((prev) => prev + 1);
        setSelectedOption(null);
        setTimeLeft(matchData.time_per_question || 20);
        questionStartTimeRef.current = Date.now();
        playBeep(587, 0.1);
      } else {
        finalizeBattle(nextAnswers, nextTimes);
      }
    },
    [matchData, userAnswers, userTimes, questionIndex, finalizeBattle]
  );

  // Timer countdown
  useEffect(() => {
    if (battleState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAdvanceQuestion(selectedOption);
          return 20;
        }
        if (prev <= 4) {
          playBeep(440, 0.05);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [battleState, selectedOption, handleAdvanceQuestion]);

  // ==========================================
  // 2. VIRTUAL STUDY ROOM / POMODORO STATE
  // ==========================================
  const [pomoMinutes, setPomoMinutes] = useState<number>(25);
  const [pomoSeconds, setPomoSeconds] = useState<number>(0);
  const [isPomoRunning, setIsPomoRunning] = useState<boolean>(false);
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'lofi' | 'library'>('none');
  const ambientNodeRef = useRef<any>(null);

  // Pomodoro timer tick
  useEffect(() => {
    if (!isPomoRunning) return;
    const interval = setInterval(() => {
      if (pomoSeconds > 0) {
        setPomoSeconds((s) => s - 1);
      } else if (pomoMinutes > 0) {
        setPomoMinutes((m) => m - 1);
        setPomoSeconds(59);
      } else {
        setIsPomoRunning(false);
        playBeep(880, 0.5);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPomoRunning, pomoMinutes, pomoSeconds]);

  // Ambient sound synthesizer
  useEffect(() => {
    if (ambientNodeRef.current) {
      try {
        ambientNodeRef.current.stop();
        ambientNodeRef.current.disconnect();
      } catch {}
      ambientNodeRef.current = null;
    }

    if (ambientSound === 'none') return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ambientSound === 'rain' || ambientSound === 'library') {
        // White / pink noise buffer for rain
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink filter
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = ambientSound === 'rain' ? 'lowpass' : 'bandpass';
        filter.frequency.setValueAtTime(ambientSound === 'rain' ? 800 : 400, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, ctx.currentTime);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
        ambientNodeRef.current = noise;
      } else if (ambientSound === 'lofi') {
        // Lo-Fi warm drone chord
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(146.83, ctx.currentTime); // D3
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(220.0, ctx.currentTime); // A3

        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        ambientNodeRef.current = {
          stop: () => {
            osc1.stop();
            osc2.stop();
          },
          disconnect: () => {
            gain.disconnect();
          },
        };
      }
    } catch {}

    return () => {
      if (ambientNodeRef.current) {
        try {
          ambientNodeRef.current.stop();
          ambientNodeRef.current.disconnect();
        } catch {}
      }
    };
  }, [ambientSound]);

  const currentQ = matchData?.questions[questionIndex];

  return (
    <Layout activePage="battle" title="1v1 Speed Battle & Study Rooms">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950/60 via-orange-950/40 to-slate-900/80 border border-orange-500/20 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">swords</span>
                <span>Competitive CS & Deep Focus</span>
              </div>
              <h1 className="text-2xl font-black text-white">1v1 Speed Battles & Study Rooms</h1>
              <p className="text-sm text-slate-300 mt-1">
                Challenge AI peer toppers in rapid-fire 20s GATE CS duels or enter the ambient Pomodoro study lounge.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('duel')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'duel'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">swords</span>
                <span>1v1 Speed Duel</span>
              </button>
              <button
                onClick={() => setActiveTab('study_room')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'study_room'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">coffee</span>
                <span>Virtual Study Lounge</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. SPEED DUEL VIEW */}
        {activeTab === 'duel' && (
          <div className="space-y-4">
            {battleState === 'idle' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-sm">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <span className="material-symbols-outlined text-4xl">swords</span>
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    Ready for a 5-Question GATE Duel?
                  </h2>
                  <p className="text-xs text-slate-400">
                    20 seconds per question. Faster correct answers yield higher speed points. Face off against
                    calibrated topper profiles.
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleStartDuel}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm shadow-lg shadow-orange-900/30 transition flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                    <span>Find Opponent & Start</span>
                  </button>
                </div>
              </div>
            )}

            {battleState === 'matching' && (
              <div className="h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                  <span className="material-symbols-outlined absolute inset-0 m-auto text-2xl text-orange-400 flex items-center justify-center">
                    search
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">Searching Matchmaking Pool...</h3>
                <p className="text-xs text-slate-400">Pairing with candidate in Top 5% GATE Rating Bracket</p>
              </div>
            )}

            {battleState === 'playing' && matchData && currentQ && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                {/* Opponents Banner */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                      YOU
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white">Alex Rivera</div>
                      <div className="text-[10px] text-slate-400 font-mono">Current Score: {userAnswers.filter((a) => a !== -1).length * 40} pts</div>
                    </div>
                  </div>

                  {/* VS Emblem & Timer */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`text-2xl font-black font-mono transition ${
                        timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-orange-400'
                      }`}
                    >
                      {timeLeft}s
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Q {questionIndex + 1} of {matchData.questions.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white">
                        {matchData.opponent.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {matchData.opponent.title}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm">
                      AI
                    </div>
                  </div>
                </div>

                {/* Question Box */}
                <div className="space-y-4">
                  <div className="inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-orange-400 font-mono">
                    {currentQ.subject}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white leading-relaxed">
                    {currentQ.question}
                  </h3>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {currentQ.options.map((option, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => setSelectedOption(optIdx)}
                        className={`p-4 rounded-2xl border text-left text-xs font-semibold transition flex items-start gap-3 ${
                          selectedOption === optIdx
                            ? 'bg-orange-600/10 border-orange-500 text-orange-300 ring-2 ring-orange-500/30'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[11px] font-bold font-mono">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1 mt-0.5">{option}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={() => handleAdvanceQuestion(selectedOption)}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-2"
                  >
                    <span>{questionIndex + 1 === matchData.questions.length ? 'Finish Duel' : 'Submit & Next'}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {battleState === 'result' && battleResult && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="text-center space-y-2">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-3xl mb-2 ${
                      battleResult.winner === 'user'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl">
                      {battleResult.winner === 'user' ? 'emoji_events' : 'sentiment_dissatisfied'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                    {battleResult.winner === 'user' ? 'Victory!' : 'Match Completed'}
                  </h2>
                  <div className="text-xs font-semibold text-slate-400">
                    Rating Change: <span className="text-emerald-400 font-bold font-mono">+{battleResult.rating_change} pts</span>
                  </div>
                </div>

                {/* Scoreboard Comparison */}
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-xs text-slate-400 font-bold">Your Score</div>
                    <div className="text-2xl font-black text-orange-400 font-mono mt-1">
                      {battleResult.user_score}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {battleResult.user_correct_count} correct
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-xs text-slate-400 font-bold">Opponent Score</div>
                    <div className="text-2xl font-black text-slate-300 font-mono mt-1">
                      {battleResult.opponent_score}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {battleResult.opponent_correct_count} correct
                    </div>
                  </div>
                </div>

                {/* Question Breakdown List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Question Analysis & Timing
                  </h4>
                  {battleResult.detailed_results.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-white">Q{idx + 1}: {item.question}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.user_correct
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {item.user_correct ? 'Correct' : 'Missed'}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] leading-relaxed">
                        Correct Option: <span className="text-slate-200 font-mono font-bold">{item.correct_option}</span> — {item.explanation}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span>Your time: {item.user_time}s</span>
                        <span>•</span>
                        <span>Opponent time: {item.opponent_time}s</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setBattleState('idle')}
                    className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow-sm"
                  >
                    Play Another Match
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. VIRTUAL STUDY ROOM / POMODORO VIEW */}
        {activeTab === 'study_room' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Timer & Ambient Panel */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">GATE Focus Lounge</h2>
                  <p className="text-xs text-slate-400">Deep uninterrupted work session with fellow aspirants.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>4 Online</span>
                </span>
              </div>

              {/* Big Timer Clock */}
              <div className="text-center py-6">
                <div className="text-6xl sm:text-7xl font-black font-mono text-slate-800 dark:text-white tracking-wider">
                  {String(pomoMinutes).padStart(2, '0')}:{String(pomoSeconds).padStart(2, '0')}
                </div>
                <div className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-semibold">
                  {isPomoRunning ? 'Deep Focus Session in Progress' : 'Paused / Ready'}
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsPomoRunning(!isPomoRunning)}
                  className={`px-6 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 shadow-md ${
                    isPomoRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isPomoRunning ? 'pause' : 'play_arrow'}
                  </span>
                  <span>{isPomoRunning ? 'Pause Session' : 'Start Focus'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsPomoRunning(false);
                    setPomoMinutes(25);
                    setPomoSeconds(0);
                  }}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  Reset (25m)
                </button>

                <button
                  onClick={() => {
                    setIsPomoRunning(false);
                    setPomoMinutes(50);
                    setPomoSeconds(0);
                  }}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  Deep (50m)
                </button>
              </div>

              {/* Ambient Noise Selector */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">headphones</span>
                  <span>Synthesized Ambient Background Sound</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setAmbientSound('none')}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                      ambientSound === 'none'
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    Mute
                  </button>
                  <button
                    onClick={() => setAmbientSound('rain')}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                      ambientSound === 'rain'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    🌧️ Rain Noise
                  </button>
                  <button
                    onClick={() => setAmbientSound('lofi')}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                      ambientSound === 'lofi'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    🎹 Warm Synth
                  </button>
                  <button
                    onClick={() => setAmbientSound('library')}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                      ambientSound === 'library'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    📚 Library Noise
                  </button>
                </div>
              </div>
            </div>

            {/* Room Participants Sidebar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-400">group</span>
                <span>Active Aspirants in Room</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    AR
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-white truncate">You (Alex Rivera)</div>
                    <div className="text-[10px] text-indigo-400 truncate">Algorithms & Complexity</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center">
                    RM
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-white truncate">Rohan M. (IITB Aspirant)</div>
                    <div className="text-[10px] text-slate-400 truncate">Theory of Computation PYQs</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center">
                    AS
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-white truncate">Ananya S. (Rank 114)</div>
                    <div className="text-[10px] text-slate-400 truncate">DBMS B-Trees & Serializability</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center">
                    VK
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-white truncate">Vikram K. (BITS Pilani)</div>
                    <div className="text-[10px] text-slate-400 truncate">CN Subnetting & CIDR</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
