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
      <div className="max-w-container-max mx-auto space-y-gutter px-4 md:px-gutter pb-12">
        {error && <div className="bg-error-container/30 border border-error/30 text-on-error-container rounded-lg p-4">{error}</div>}
        {loading ? (
          <div className="flex items-center gap-3 text-text-muted font-label-md text-label-md">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading analytics...
          </div>
        ) : data && data.total_attempts > 0 ? (
          <Analytics data={data} onPractice={() => navigate('/quiz')} />
        ) : (
          <div className="bg-surface rounded-lg border border-border shadow-soft p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-primary mb-3">insights</span>
            <h2 className="font-headline-md text-headline-md text-text-primary mb-2">No analytics yet</h2>
            <p className="font-body-md text-body-md text-text-muted mb-6">Complete a mock test or PYQ practice session to unlock performance insights.</p>
            <button onClick={() => navigate('/quiz')} className="bg-primary text-white px-6 py-3 rounded-lg font-label-md text-label-md">Start Practice</button>
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
      <div>
        <h2 className="font-headline-lg text-headline-lg text-text-primary mb-2">Performance Overview</h2>
        <p className="font-body-md text-body-md text-text-muted">Tracking readiness from your submitted PYQ and practice attempts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Metric label="Attempts" value={String(data.total_attempts)} icon="assignment" />
        <Metric label="Accuracy" value={`${data.overall_accuracy}%`} icon="my_location" />
        <Metric label="Score Rate" value={`${scorePct}%`} icon="leaderboard" />
        <Metric label="Percentile" value={data.percentile_prediction ? `${data.percentile_prediction}%` : 'N/A'} icon="workspace_premium" />
        <Metric label="Avg Time" value={formatDuration(Math.round(data.time_management.avg_time_per_attempted_seconds))} icon="timer" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-8 bg-surface rounded-lg p-6 border border-border shadow-soft">
          <h3 className="font-headline-sm text-headline-sm text-text-primary mb-6">Subject Accuracy</h3>
          <BucketBars buckets={data.subjects.slice(0, 8)} />
        </div>
        <div className="lg:col-span-4 bg-primary-container text-on-primary-container rounded-lg p-6 border border-primary-fixed-dim shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 text-secondary-fixed">
              <span className="material-symbols-outlined">explore</span>
              <h3 className="font-headline-sm text-headline-sm">Recommended Next</h3>
            </div>
            <p className="font-body-md text-body-md opacity-90 mb-4">{data.rank_prediction}</p>
            <div className="bg-inverse-surface/20 rounded-lg p-3 mb-6">
              <div className="font-label-sm text-label-sm opacity-80 mb-1">Focus Topic</div>
              <div className="font-label-md text-label-md text-white">{data.weak_topics[0]?.key || data.subjects[0]?.key || 'Mixed Practice'}</div>
            </div>
          </div>
          <button onClick={onPractice} className="w-full bg-white text-primary font-label-md text-label-md py-3 rounded-lg hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">quiz</span>
            Start Drill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <Panel title="Weakest Topics" icon="warning" tone="text-error">
          <TopicList buckets={data.weak_topics} empty="Weak topics need at least two attempted questions." onPractice={onPractice} />
        </Panel>
        <Panel title="Strong Topics" icon="verified" tone="text-success">
          <TopicList buckets={data.strong_topics} empty="Strong topics appear after repeated correct attempts." onPractice={onPractice} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <Panel title="Time Management" icon="timer" tone="text-secondary">
          <div className="grid grid-cols-2 gap-3">
            <SmallStat label="Total Time" value={formatDuration(data.time_management.total_time_seconds)} />
            <SmallStat label="Avg / Attempted" value={formatDuration(Math.round(data.time_management.avg_time_per_attempted_seconds))} />
            <SmallStat label="Fastest Correct" value={data.time_management.fastest_correct_seconds ? formatDuration(data.time_management.fastest_correct_seconds) : 'N/A'} />
            <SmallStat label="Slowest Incorrect" value={data.time_management.slowest_incorrect_seconds ? formatDuration(data.time_management.slowest_incorrect_seconds) : 'N/A'} />
          </div>
          <div className="mt-4 bg-surface-container-low rounded-lg p-3 font-label-md text-label-md text-on-surface-variant">
            {data.time_management.overtime_questions} question(s) crossed 2 minutes.
          </div>
        </Panel>
        <Panel title="Improvement Graph" icon="trending_up" tone="text-primary">
          <div className="h-48 flex items-end gap-2 border-b border-border pt-6">
            {data.improvement_graph.map((point, index) => (
              <div key={`${point.submitted_at}-${index}`} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <div className="w-full bg-primary rounded-t" style={{ height: `${Math.max(4, point.accuracy)}%` }} />
                <span className="font-label-sm text-[10px] text-text-muted truncate w-full text-center">{index + 1}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Personalized Study Plan" icon="route" tone="text-primary">
        <div className="space-y-3">
          {data.personalized_study_plan.map((item) => (
            <div key={item} className="flex gap-3 p-3 bg-surface-container-low rounded-lg border border-border">
              <span className="material-symbols-outlined text-success text-base mt-0.5">check_circle</span>
              <span className="font-body-md text-body-md text-on-surface-variant">{item}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-surface rounded-lg p-5 border border-border shadow-soft">
      <div className="flex items-center justify-between text-text-muted mb-2">
        <span className="font-label-sm text-label-sm">{label}</span>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="font-headline-md text-headline-md text-text-primary">{value}</div>
    </div>
  );
}

function BucketBars({ buckets }: { buckets: StatBucket[] }) {
  return (
    <div className="space-y-5">
      {buckets.map((row) => (
        <div key={row.key}>
          <div className="flex justify-between items-end mb-2 gap-3">
            <span className="font-label-md text-label-md text-text-primary truncate">{row.key}</span>
            <span className="font-code text-code font-semibold text-primary">{row.accuracy}%</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${row.accuracy}%` }} />
          </div>
          <div className="text-xs text-text-muted mt-1">{row.correct} correct, {row.incorrect} incorrect, avg {formatDuration(Math.round(row.avg_time_seconds))}</div>
        </div>
      ))}
    </div>
  );
}

function Panel({ title, icon, tone, children }: { title: string; icon: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-lg p-6 border border-border shadow-soft">
      <div className={`flex items-center gap-2 mb-5 ${tone}`}>
        <span className="material-symbols-outlined">{icon}</span>
        <h3 className="font-headline-sm text-headline-sm text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TopicList({ buckets, empty, onPractice }: { buckets: StatBucket[]; empty: string; onPractice: () => void }) {
  if (!buckets.length) return <p className="text-text-muted font-body-md text-body-md">{empty}</p>;
  return (
    <div className="space-y-3">
      {buckets.map((topic) => (
        <div key={topic.key} className="flex items-center justify-between gap-4 p-4 bg-surface-container-low rounded-lg border border-border">
          <div className="min-w-0">
            <h4 className="font-label-md text-label-md text-text-primary truncate">{topic.key}</h4>
            <p className="font-label-sm text-label-sm text-text-muted mt-1">{topic.accuracy}% accuracy, {topic.attempted} attempted</p>
          </div>
          <button onClick={onPractice} className="shrink-0 px-3 py-1.5 bg-surface text-primary border border-border rounded-lg font-label-sm text-label-sm hover:bg-surface-container-low transition-colors">
            Practice
          </button>
        </div>
      ))}
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-low rounded-lg border border-border p-3">
      <div className="font-label-sm text-label-sm text-text-muted mb-1">{label}</div>
      <div className="font-headline-sm text-headline-sm text-text-primary">{value}</div>
    </div>
  );
}