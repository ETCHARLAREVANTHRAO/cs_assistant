import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import {
  fetchInterviewTracks,
  startMockInterview,
  submitInterviewTurn,
  completeMockInterview,
  type InterviewTrack,
  type InterviewTurnResponse,
  type InterviewCompleteResponse,
} from '../services/api';

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
  feedback?: string;
  scores?: {
    star: number;
    tech: number;
    comm: number;
  };
}

export default function MockInterview() {
  const [tracks, setTracks] = useState<Record<string, InterviewTrack>>({});
  const [selectedTrack, setSelectedTrack] = useState<string>('sde_backend');
  const [candidateName, setCandidateName] = useState<string>('Alex Rivera');
  const [targetRole, setTargetRole] = useState<string>('Backend Systems Engineer');

  // Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [finalReport, setFinalReport] = useState<InterviewCompleteResponse | null>(null);

  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load tracks
  useEffect(() => {
    fetchInterviewTracks().then(setTracks).catch(() => {});
  }, []);

  // Initialize Speech Recognition if supported
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
        setAnswerInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isSubmitting]);

  // Voice output (TTS)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use text typing.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleStartInterview = async () => {
    setIsSubmitting(true);
    try {
      const res = await startMockInterview(selectedTrack, candidateName, targetRole);
      setSessionId(res.session_id);
      setCurrentRound(1);
      setCurrentQuestion(res.first_question);
      setMessages([
        { role: 'interviewer', content: res.greeting },
        { role: 'interviewer', content: `**Question #1:**\n${res.first_question}` },
      ]);
      setFinalReport(null);
      speakText(`Hello ${candidateName}! Let's begin Question 1: ${res.first_question}`);
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerInput.trim() || !sessionId || isSubmitting) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const currentAnswer = answerInput.trim();
    setAnswerInput('');
    setIsSubmitting(true);

    const userMsg: Message = { role: 'candidate', content: currentAnswer };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const turnRes: InterviewTurnResponse = await submitInterviewTurn(
        sessionId,
        selectedTrack,
        currentQuestion,
        currentAnswer,
        currentRound,
        messages.map((m) => ({ role: m.role, content: m.content }))
      );

      const feedbackMsg: Message = {
        role: 'interviewer',
        content: `**Evaluation for Question #${currentRound}:**\n${turnRes.feedback}`,
        feedback: turnRes.feedback,
        scores: {
          star: turnRes.star_score,
          tech: turnRes.technical_accuracy,
          comm: turnRes.communication_score,
        },
      };

      if (turnRes.is_completed || !turnRes.next_question) {
        setMessages((prev) => [
          ...prev,
          feedbackMsg,
          {
            role: 'interviewer',
            content: '🎉 **Interview Completed!** Generating your comprehensive hiring scorecard and STAR evaluation...',
          },
        ]);
        const report = await completeMockInterview(
          sessionId,
          selectedTrack,
          messages.map((m) => ({ role: m.role, content: m.content }))
        );
        setFinalReport(report);
      } else {
        setCurrentRound((r) => r + 1);
        setCurrentQuestion(turnRes.next_question);
        setMessages((prev) => [
          ...prev,
          feedbackMsg,
          {
            role: 'interviewer',
            content: `**Question #${currentRound + 1}:**\n${turnRes.next_question}`,
          },
        ]);
        speakText(`Question ${currentRound + 1}: ${turnRes.next_question}`);
      }
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout activePage="interview" title="AI Tech Mock Interviewer">
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-[#07080e]">
        {/* Top Bar */}
        <div className="bg-white/95 dark:bg-[#0d0f1b]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <span className="material-symbols-outlined text-[22px]">record_voice_over</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI Technical &amp; Research Mock Interview</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  Voice &amp; STAR
                </span>
              </h2>
              <p className="text-xs text-slate-500">Practice behavioral, systems, and GATE research rounds</p>
            </div>
          </div>

          {sessionId && (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Round {currentRound} of 4
              </span>
              <button
                onClick={() => setSessionId(null)}
                className="px-3 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              >
                End Session
              </button>
            </div>
          )}
        </div>

        {/* Workspace */}
        {!sessionId ? (
          /* Track Selection & Setup Screen */
          <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6 sidebar-scroll">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">settings</span>
                Configure Your Interview Session
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Candidate Name</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Target Role / Program</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Technical Track
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(tracks).map(([key, t]) => (
                    <div
                      key={key}
                      onClick={() => setSelectedTrack(key)}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        selectedTrack === key
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{t.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{t.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleStartInterview}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-md shadow-indigo-500/25 transition flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  <span>Begin Mock Interview</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Live Interview Chat & Turn Workspace */
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 overflow-hidden">
            {/* Conversation Stream */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 p-2 sidebar-scroll">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'candidate' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                      m.role === 'candidate'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Scores Pill */}
                    {m.scores && (
                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          Tech Accuracy: {m.scores.tech}%
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                          STAR Structure: {m.scores.star}%
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                          Clarity: {m.scores.comm}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isSubmitting && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span>Interviewer is evaluating your response...</span>
                </div>
              )}

              {/* Final Report Card */}
              {finalReport && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Official Hiring &amp; Admission Scorecard
                      </div>
                      <div className="text-emerald-600 font-bold mt-0.5">{finalReport.verdict}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-sm text-emerald-600">
                      {finalReport.overall_score}%
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-semibold">Technical Depth</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white">{finalReport.technical_score}%</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-semibold">STAR Method</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white">{finalReport.star_method_score}%</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-semibold">Communication</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white">{finalReport.communication_score}%</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-700 dark:text-slate-300">Key Strengths:</div>
                    {finalReport.strengths.map((s, idx) => (
                      <div key={idx} className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px]">check</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-700 dark:text-slate-300">Actionable Feedback:</div>
                    {finalReport.improvements.map((imp, idx) => (
                      <div key={idx} className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px]">arrow_right</span>
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Answer Input Bar with Mic & Speaker */}
            {!finalReport && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-2">
                <textarea
                  rows={3}
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Type your response or click the microphone to speak..."
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Mic Toggle Button */}
                    <button
                      onClick={toggleMic}
                      title={isListening ? 'Stop listening' : 'Speak your answer'}
                      className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-semibold ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isListening ? 'mic_off' : 'mic'}
                      </span>
                      <span>{isListening ? 'Listening...' : 'Voice'}</span>
                    </button>

                    {/* Audio Mute/Unmute */}
                    <button
                      onClick={() => {
                        if (isSpeaking) {
                          window.speechSynthesis.cancel();
                          setIsSpeaking(false);
                        } else {
                          speakText(currentQuestion);
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition text-xs flex items-center gap-1"
                      title="Read question aloud"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isSpeaking ? 'volume_off' : 'volume_up'}
                      </span>
                      <span>{isSpeaking ? 'Mute' : 'Audio'}</span>
                    </button>
                  </div>

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!answerInput.trim() || isSubmitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <span>Submit Answer</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
