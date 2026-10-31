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
      // Fallback: cycle local quote
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
        <div className="p-gutter flex items-center justify-center min-h-[50vh] text-text-muted">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
          Loading motivation...
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="motivation" title="Motivation">
      <div className="p-gutter max-w-container-max mx-auto pb-32 space-y-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-text-primary">Daily Motivation & Focus</h2>
          <p className="font-body-md text-body-md text-text-muted mt-1">Keep your streak alive and sharpen your exam mindset.</p>
        </div>

        {/* Daily Quote & Challenge Cards */}
        <div className="grid md:grid-cols-2 gap-5">
          <section className="bg-surface rounded-lg border border-border shadow-soft p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 text-text-primary">
                  <span className="material-symbols-outlined text-primary">format_quote</span>
                  Daily Inspiration
                </h3>
                <button
                  onClick={fetchFreshQuote}
                  disabled={loadingQuote}
                  className="inline-flex items-center gap-1 text-label-sm font-label-sm text-primary hover:underline disabled:opacity-50"
                  title="Load fresh quote"
                >
                  <span className={`material-symbols-outlined text-sm ${loadingQuote ? 'animate-spin' : ''}`}>refresh</span>
                  <span>New Quote</span>
                </button>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface italic bg-surface-container-lowest p-4 rounded-lg border-l-4 border-primary">
                {quote || data.daily_quote}
              </p>
            </div>
          </section>

          <Card icon="emoji_events" title="Daily Challenge" text={data.daily_challenge} />
        </div>

        {/* Active Pomodoro Timer */}
        <section className="bg-surface rounded-lg border border-border shadow-soft p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 text-text-primary mb-2">
                <span className="material-symbols-outlined text-secondary">timer</span>
                Study Sprint (Pomodoro)
              </h3>
              <p className="font-body-md text-body-md text-text-muted">
                25 minutes of high-intensity focus without distractions.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-mono text-4xl font-bold tracking-wider text-primary bg-surface-container-lowest px-5 py-2.5 rounded-lg border border-border">
                {formatTimer(pomodoroSeconds)}
              </span>
              <button
                onClick={() => setPomodoroActive(!pomodoroActive)}
                className={`px-4 py-2.5 rounded-lg font-label-md text-label-md transition flex items-center gap-1.5 ${
                  pomodoroActive ? 'bg-error text-on-error hover:opacity-90' : 'bg-primary text-on-primary hover:opacity-90'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{pomodoroActive ? 'pause' : 'play_arrow'}</span>
                {pomodoroActive ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => {
                  setPomodoroActive(false);
                  setPomodoroSeconds(25 * 60);
                }}
                className="px-3 py-2.5 rounded-lg border border-border bg-surface hover:bg-surface-container-lowest text-text-muted text-label-md"
                title="Reset timer"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* Progress Badges & Consistency */}
        <div className="grid md:grid-cols-2 gap-5">
          <section className="bg-surface rounded-lg border border-border shadow-soft p-5">
            <h3 className="font-headline-sm text-headline-sm mb-4 flex items-center gap-2 text-text-primary">
              <span className="material-symbols-outlined text-tertiary">military_tech</span>
              Progress Badges
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {data.progress_badges.map((b: any) => (
                <div key={b.name} className="rounded-lg bg-surface-container-lowest p-3 border border-border/50">
                  <p className="font-label-md text-text-primary font-semibold">{b.name}</p>
                  <p className="font-body-sm text-body-sm text-text-muted mt-1">{b.rule}</p>
                </div>
              ))}
            </div>
          </section>

          <Card
            icon="local_fire_department"
            title="Consistency Streak"
            text={`Current streak: ${data.consistency.current_streak} days (Best: ${data.consistency.longest_streak} days). Earned rewards: ${
              data.earned_rewards.join(', ') || 'Keep solving questions daily to unlock rewards!'
            }`}
          />
        </div>
      </div>
    </Layout>
  );
}

function Card({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <section className="bg-surface rounded-lg border border-border shadow-soft p-5">
      <h3 className="font-headline-sm text-headline-sm mb-3 flex items-center gap-2 text-text-primary">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        {title}
      </h3>
      <p className="font-body-md text-body-md text-on-surface bg-surface-container-lowest p-4 rounded-lg">{text}</p>
    </section>
  );
}
