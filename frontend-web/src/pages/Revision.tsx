import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getRevision } from '../services/api';

type PlanTab = '7_day' | '30_day' | 'last_minute' | 'personalized';

export default function Revision() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<PlanTab>('7_day');

  useEffect(() => {
    getRevision().then(setData).catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <Layout activePage="revision" title="Revision">
        <div className="flex items-center justify-center min-h-[50vh] text-text-muted text-sm">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" />
          Loading revision curriculum...
        </div>
      </Layout>
    );
  }

  const tabs: { key: PlanTab; label: string; icon: string; count: number }[] = [
    { key: '7_day', label: '7-Day Sprint', icon: 'bolt', count: data['7_day']?.length || 7 },
    { key: '30_day', label: '30-Day Crash Course', icon: 'calendar_month', count: data['30_day']?.length || 30 },
    { key: 'last_minute', label: 'Last-Minute Capsules', icon: 'timer_3', count: data.last_minute?.length || 10 },
    { key: 'personalized', label: 'Personalized Focus', icon: 'auto_awesome', count: data.personalized_focus?.length || 0 },
  ];

  const currentList =
    activeTab === '7_day'
      ? data['7_day']
      : activeTab === '30_day'
        ? data['30_day']
        : activeTab === 'last_minute'
          ? data.last_minute
          : data.personalized_focus;

  return (
    <Layout activePage="revision" title="High-Yield Revision">
      <div className="max-w-container-max mx-auto px-4 md:px-gutter pb-16 flex flex-col gap-8">
        
        {/* Resq.io Ambient Hero Header */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">event_repeat</span>
                Spaced Repetition &amp; Crash Courses
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
                GATE CS Rapid Revision Engine
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
                Structured fast-track roadmaps designed to maximize score retention.
                Filter through 7-day power sprints, 30-day comprehensive revision, and high-frequency PYQs.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 text-center min-w-[120px]">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Top Topics</div>
                <div className="text-2xl font-black text-white mt-0.5 font-mono">
                  {data.most_repeated_pyqs?.length || 10}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between group cursor-pointer ${
                  isActive
                    ? 'border-primary bg-primary/10 shadow-glow-sm'
                    : 'border-border bg-surface hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? 'bg-primary text-white' : 'bg-surface-container text-text-muted group-hover:text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-primary text-white' : 'bg-surface-container text-text-muted'
                  }`}>
                    {tab.count} Modules
                  </span>
                </div>
                <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Content: Active Plan + Most Repeated PYQs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Active Plan Tasks */}
          <section className="lg:col-span-7 bg-surface rounded-3xl border border-border shadow-soft p-6 sm:p-7 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h2 className="text-base font-bold text-text-primary">
                  {tabs.find((t) => t.key === activeTab)?.label}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">High-priority syllabus checklist</p>
              </div>
            </div>

            <div className="space-y-3">
              {(currentList && currentList.length > 0) ? (
                currentList.map((row: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-surface-container-low border border-border/50 text-xs sm:text-sm text-text-primary flex items-start gap-3 hover:border-primary/30 transition-all"
                  >
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed flex-1">{row}</span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-text-muted">
                  Attempt at least one practice drill to unlock personalized topic-level revision.
                </div>
              )}
            </div>
          </section>

          {/* Most Repeated PYQs High-Yield Shelf */}
          <aside className="lg:col-span-5 bg-surface rounded-3xl border border-border shadow-soft p-6 sm:p-7 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">star</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Most Repeated PYQ Topics</h2>
                <p className="text-xs text-text-muted mt-0.5">Highest marks return per study hour</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {(data.most_repeated_pyqs || []).map((x: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-surface-container-low border border-border/50 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-text-primary">{x.topic}</span>
                    <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {x.total_marks} Marks
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span>{x.question_count} verified GATE questions</span>
                    <span className="text-emerald-500 font-semibold">Priority 1</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>

        </div>

      </div>
    </Layout>
  );
}
