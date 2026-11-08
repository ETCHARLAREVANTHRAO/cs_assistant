import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { pyqGetAnalytics, type AnalyticsResponse, type StatBucket } from '../services/api';

function formatDuration(seconds: number): string {
  if (!seconds) return '0m';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function Progress() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    pyqGetAnalytics()
      .then(setData)
      .catch(() => setError('Could not load analytics. Take a practice test or refresh to try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout activePage="progress" title="Performance Analytics" searchPlaceholder="Search reports...">
      <div className="max-w-container-max mx-auto space-y-8 px-4 md:px-gutter pb-16">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded-2xl p-4 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-text-muted text-sm py-12">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading comprehensive analytics...
          </div>
        ) : data && data.total_attempts > 0 ? (
          <Analytics data={data} onPractice={() => navigate('/quiz')} />
        ) : (
          <div className="relative rounded-3xl p-10 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl text-center flex flex-col items-center">
            <div className="resq-beam" />
            <div className="resq-beam-right" />
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl">insights</span>
            </div>
            <h2 className="text-2xl font-extrabold gradient-text mb-2">No Practice Attempts Recorded Yet</h2>
            <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
              Complete your first GATE CS practice drill or previous year paper simulation to unlock detailed topic-wise accuracy, speed metrics, and AIR percentile predictions.
            </p>
            <button
              onClick={() => navigate('/quiz')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-sm shadow-glow-sm hover:shadow-glow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">rocket_launch</span>
              Launch Your First Practice Drill
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Analytics({ data, onPractice }: { data: AnalyticsResponse; onPractice: () => void }) {
  const scorePct = data.total_max_marks > 0 ? Math.round((data.total_marks / data.total_max_marks) * 100) : 0;

  return (
    <>
      {/* Resq.io Ambient Hero Header */}
      <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl">
        <div className="resq-beam" />
        <div className="resq-beam-right" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Performance Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
              GATE CS Readiness Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
              Synthesized from your submitted practice tests, mock papers, and timed subject drills.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3.5 text-center min-w-[110px]">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Overall Accuracy</div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-0.5">{data.overall_accuracy}%</div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3.5 text-center min-w-[110px]">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Predicted Percentile</div>
              <div className="text-xl sm:text-2xl font-extrabold text-indigo-300 mt-0.5">
                {data.percentile_prediction ? `${data.percentile_prediction}%` : 'Top 10%'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Attempts" value={String(data.total_attempts)} icon="assignment" sub="Completed drills" />
        <MetricCard label="Accuracy Rate" value={`${data.overall_accuracy}%`} icon="my_location" sub="Net precision" />
        <MetricCard label="Marks Capture" value={`${scorePct}%`} icon="leaderboard" sub={`${data.total_marks.toFixed(1)} / ${data.total_max_marks}`} />
        <MetricCard
          label="Percentile"
          value={data.percentile_prediction ? `${data.percentile_prediction}%` : 'N/A'}
          icon="workspace_premium"
          sub="Relative standing"
        />
        <MetricCard
          label="Avg Pace"
          value={formatDuration(Math.round(data.time_management.avg_time_per_attempted_seconds))}
          icon="timer"
          sub="Per question"
        />
      </div>

      {/* Subject Accuracy & AI Next Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Subject Accuracy Bars */}
        <div className="lg:col-span-8 bg-surface rounded-3xl p-6 sm:p-7 border border-border shadow-soft flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-primary">Subject-Wise Accuracy Breakdown</h2>
              <p className="text-xs text-text-muted mt-0.5">Visual representation across core Computer Science subjects</p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {data.subjects.length} Subjects Evaluated
            </span>
          </div>

          <BucketBars buckets={data.subjects.slice(0, 8)} />
        </div>

        {/* Recommended Focus Card */}
        <div className="lg:col-span-4 rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white border border-indigo-500/30 shadow-xl flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              AI Targeted Recommendation
            </div>
            <h3 className="text-lg font-bold gradient-text">Recommended Next Focus</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {data.rank_prediction || 'Concentrating on your weakest topics will deliver the fastest rank boost.'}
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Priority Topic</div>
              <div className="text-sm font-bold text-white mt-1">
                {data.weak_topics[0]?.key || data.subjects[0]?.key || 'Operating Systems: Paging'}
              </div>
            </div>
          </div>

          <button
            onClick={onPractice}
            className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-indigo-500 text-white font-bold text-xs shadow-glow-sm hover:shadow-glow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">quiz</span>
            Practice Weak Topics Now
          </button>
        </div>

      </div>

      {/* Weakest vs Strong Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Weakest Topics (High Return on Revision)" icon="warning" tone="text-red-500">
          <TopicList
            buckets={data.weak_topics}
            empty="No critical weak topics identified yet. Keep attempting varied questions."
            onPractice={onPractice}
            isWeak
          />
        </Panel>

        <Panel title="Strong Topics (Mastered Concepts)" icon="verified" tone="text-emerald-500">
          <TopicList
            buckets={data.strong_topics}
            empty="Strong topics appear here once you achieve repeated 80%+ accuracy."
            onPractice={onPractice}
            isWeak={false}
          />
        </Panel>
      </div>

      {/* Time Management & Improvement Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Time Management */}
        <Panel title="Pacing & Time Management" icon="timer" tone="text-indigo-400">
          <div className="grid grid-cols-2 gap-3.5">
            <SmallStat label="Total Test Time" value={formatDuration(data.time_management.total_time_seconds)} />
            <SmallStat
              label="Avg Time / Question"
              value={formatDuration(Math.round(data.time_management.avg_time_per_attempted_seconds))}
            />
            <SmallStat
              label="Fastest Correct"
              value={data.time_management.fastest_correct_seconds ? formatDuration(data.time_management.fastest_correct_seconds) : 'N/A'}
            />
            <SmallStat
              label="Slowest Miss"
              value={data.time_management.slowest_incorrect_seconds ? formatDuration(data.time_management.slowest_incorrect_seconds) : 'N/A'}
            />
          </div>

          <div className="mt-4 p-3.5 rounded-2xl bg-surface-container-low border border-border/60 text-xs text-text-muted flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-base">info</span>
            <span>
              <strong className="text-text-primary">{data.time_management.overtime_questions}</strong> question(s) took more than 2 minutes. Focus on quick elimination in MCQs.
            </span>
          </div>
        </Panel>

        {/* Improvement Trend */}
        <Panel title="Test Accuracy Trend" icon="trending_up" tone="text-primary">
          <div className="h-44 flex items-end gap-2 border-b border-border/60 pb-2 pt-4">
            {data.improvement_graph && data.improvement_graph.length > 0 ? (
              data.improvement_graph.map((point, index) => (
                <div key={`${point.submitted_at}-${index}`} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <div
                    className="w-full bg-gradient-to-t from-primary to-indigo-400 rounded-t-lg transition-all duration-500 min-h-[6px]"
                    style={{ height: `${Math.max(6, point.accuracy)}%` }}
                    title={`Attempt ${index + 1}: ${point.accuracy}%`}
                  />
                  <span className="text-[10px] font-mono text-text-muted truncate w-full text-center">
                    T{index + 1}
                  </span>
                </div>
              ))
            ) : (
              <div className="w-full text-center text-xs text-text-muted py-12">
                Trendline will develop as you submit more tests.
              </div>
            )}
          </div>
        </Panel>

      </div>

      {/* Personalized Study Plan */}
      {data.personalized_study_plan && data.personalized_study_plan.length > 0 && (
        <Panel title="Tailored Action Roadmap" icon="route" tone="text-primary">
          <div className="space-y-2.5">
            {data.personalized_study_plan.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 bg-surface-container-low rounded-2xl border border-border/60">
                <span className="material-symbols-outlined text-emerald-500 text-base mt-0.5">check_circle</span>
                <span className="text-xs sm:text-sm text-text-primary leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}

function MetricCard({ label, value, icon, sub }: { label: string; value: string; icon: string; sub: string }) {
  return (
    <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-soft flex flex-col justify-between">
      <div className="flex items-center justify-between text-text-muted mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
      </div>
      <div>
        <div className="text-xl sm:text-2xl font-extrabold text-text-primary font-mono">{value}</div>
        <div className="text-[11px] text-text-muted mt-0.5 truncate">{sub}</div>
      </div>
    </div>
  );
}

function BucketBars({ buckets }: { buckets: StatBucket[] }) {
  return (
    <div className="space-y-4">
      {buckets.map((row) => (
        <div key={row.key} className="space-y-1.5">
          <div className="flex justify-between items-end gap-3 text-xs">
            <span className="font-bold text-text-primary truncate">{row.key}</span>
            <span className="font-mono font-extrabold text-primary">{row.accuracy}%</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-indigo-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(row.accuracy, 4)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>{row.correct} correct &bull; {row.incorrect} incorrect</span>
            <span>Avg {formatDuration(Math.round(row.avg_time_seconds))}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Panel({ title, icon, tone, children }: { title: string; icon: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-3xl p-6 sm:p-7 border border-border shadow-soft flex flex-col gap-4">
      <div className={`flex items-center gap-2.5 ${tone}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TopicList({
  buckets,
  empty,
  onPractice,
  isWeak,
}: {
  buckets: StatBucket[];
  empty: string;
  onPractice: () => void;
  isWeak: boolean;
}) {
  if (!buckets.length) return <p className="text-text-muted text-xs py-4">{empty}</p>;
  return (
    <div className="space-y-2.5">
      {buckets.map((topic) => (
        <div
          key={topic.key}
          className="flex items-center justify-between gap-4 p-3.5 bg-surface-container-low rounded-2xl border border-border/60"
        >
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-text-primary truncate">{topic.key}</h4>
            <p className="text-[11px] text-text-muted mt-0.5">
              <span className={`font-mono font-bold ${isWeak ? 'text-red-500' : 'text-emerald-500'}`}>
                {topic.accuracy}% accuracy
              </span>{' '}
              &bull; {topic.attempted} attempts
            </p>
          </div>
          <button
            type="button"
            onClick={onPractice}
            className="shrink-0 px-3 py-1.5 bg-surface hover:bg-surface-container text-primary border border-border rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Practice
          </button>
        </div>
      ))}
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-low rounded-2xl border border-border/60 p-3.5">
      <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className="text-base font-bold text-text-primary font-mono">{value}</div>
    </div>
  );
}
