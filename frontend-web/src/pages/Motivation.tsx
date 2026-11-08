import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getMotivation } from '../services/api';

export default function Motivation() {
  const [data, setData] = useState<any>(null);
  const [quote, setQuote] = useState<string>('');
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [pomodoroSeconds, setPomodoroSeconds] = useState<number>(25 * 60);
  const [pomodoroActive, setPomodoroActive] = useState<boolean>(false);

  useEffect(() => {
    getMotivation()
      .then((d) => {
        setData(d);
        if (d?.daily_quote) setQuote(d.daily_quote);
      })
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (pomodoroActive && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroSeconds === 0) {
      setPomodoroActive(false);
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroSeconds]);

  async function fetchFreshQuote() {
    setLoadingQuote(true);
    try {
      const res = await fetch('https://api.quotable.io/random');
      if (res.ok) {
        const item = await res.json();
        setQuote(`"${item.content}" — ${item.author}`);
      }
    } catch {
      if (data?.daily_quote) setQuote(data.daily_quote);
    } finally {
      setLoadingQuote(false);
    }
  }

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!data) {
    return (
      <Layout activePage="motivation" title="Motivation">
        <div className="flex items-center justify-center min-h-[50vh] text-text-muted text-sm">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" />
          Loading daily motivation...
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="motivation" title="Daily Focus &amp; Motivation">
      <div className="max-w-container-max mx-auto px-4 md:px-gutter pb-16 flex flex-col gap-8">
        
        {/* Resq.io Ambient Hero Header */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">local_fire_department</span>
                Exam Mindset &amp; Deep Focus
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
                Daily Motivation &amp; Study Sprint
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
                Build unstoppable study habits. Track your active day streak, run distraction-free Pomodoro sprints, and maintain peak mental discipline.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 text-center min-w-[120px]">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Streak</div>
                <div className="text-2xl font-black text-amber-400 mt-0.5 flex items-center justify-center gap-1 font-mono">
                  {data.consistency?.current_streak ?? 12} <span className="text-base">🔥</span>
                </div>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 text-center min-w-[120px]">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Longest</div>
                <div className="text-2xl font-black text-indigo-300 mt-0.5 font-mono">
                  {data.consistency?.longest_streak ?? 24}d
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pomodoro Timer Centerpiece */}
        <section className="bg-surface rounded-3xl border border-border shadow-soft p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <span className="material-symbols-outlined text-sm">timer</span>
              25-Minute Focus Sprint
            </div>
            <h2 className="text-xl font-bold text-text-primary">Distraction-Free Deep Study Block</h2>
            <p className="text-xs sm:text-sm text-text-muted mt-2 leading-relaxed">
              Use the Pomodoro technique for high-yield GATE problem solving: 25 minutes of unbroken focus followed by a 5-minute break.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="px-8 py-4 rounded-3xl bg-surface-container-lowest border border-border shadow-inner font-mono text-5xl sm:text-6xl font-black text-primary tracking-wider">
              {formatTimer(pomodoroSeconds)}
            </div>

            <div className="flex flex-col gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setPomodoroActive(!pomodoroActive)}
                className={`px-8 py-3.5 rounded-2xl font-bold text-xs shadow-glow-sm hover:shadow-glow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  pomodoroActive
                    ? 'bg-amber-500 text-white'
                    : 'bg-gradient-to-r from-primary to-indigo-600 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {pomodoroActive ? 'pause' : 'play_arrow'}
                </span>
                <span>{pomodoroActive ? 'Pause Sprint' : 'Start Focus Block'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPomodoroActive(false);
                  setPomodoroSeconds(25 * 60);
                }}
                className="px-6 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-container-low text-text-muted hover:text-text-primary text-xs font-semibold transition-all text-center cursor-pointer"
              >
                Reset to 25:00
              </button>
            </div>
          </div>
        </section>

        {/* Daily Inspiration & Challenge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Daily Quote */}
          <section className="bg-surface rounded-3xl border border-border shadow-soft p-6 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="material-symbols-outlined">format_quote</span>
                  <span>Daily Word of Resilience</span>
                </div>
                <button
                  type="button"
                  onClick={fetchFreshQuote}
                  disabled={loadingQuote}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50 cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-sm ${loadingQuote ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                  <span>New Quote</span>
                </button>
              </div>

              <blockquote className="p-4 rounded-2xl bg-surface-container-lowest border-l-4 border-primary text-xs sm:text-sm text-text-primary italic leading-relaxed">
                {quote || data.daily_quote}
              </blockquote>
            </div>

            <div className="text-[11px] text-text-muted">
              Updated daily at 05:00 AM IST for morning study sessions
            </div>
          </section>

          {/* Daily Target Challenge */}
          <section className="bg-surface rounded-3xl border border-border shadow-soft p-6 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-3">
                <span className="material-symbols-outlined">emoji_events</span>
                <span>Today's Milestone Challenge</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs sm:text-sm text-text-primary font-medium leading-relaxed">
                {data.daily_challenge}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border/50">
              <span>Mark completed on practice completion</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">task_alt</span> Ready
              </span>
            </div>
          </section>

        </div>

        {/* Progress Badges */}
        {data.progress_badges && data.progress_badges.length > 0 && (
          <section className="bg-surface rounded-3xl border border-border shadow-soft p-6 sm:p-7 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">military_tech</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Earned Achievement Badges</h2>
                <p className="text-xs text-text-muted mt-0.5">Unlocked through consistent problem-solving milestones</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.progress_badges.map((b: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-surface-container-low border border-border/50 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">{b.name}</span>
                    <span className="material-symbols-outlined text-amber-500 text-base">verified</span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">{b.rule}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </Layout>
  );
}
