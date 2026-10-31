import { useEffect, useState } from 'react';
import { adminGetDashboard, type AdminDashboardResponse, type AdminDashboardUser } from '../services/api';

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setData(await adminGetDashboard());
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Admin dashboard could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-background text-on-background p-gutter">
      <div className="max-w-container-max mx-auto space-y-5">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary">Admin Dashboard</h1>
            <p className="font-body-md text-body-md text-text-muted mt-2">Users, active members, attempts, storage, AI usage, and engagement.</p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 font-label-md text-label-md disabled:opacity-50">
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
        </header>

        {error && <div className="rounded-lg border border-error/30 bg-error-container/30 p-4 text-on-error-container">{error}</div>}
        {loading && !data ? <div className="bg-surface rounded-lg border border-border shadow-soft p-5 text-text-muted">Loading...</div> : data && <Dashboard data={data} />}
      </div>
    </div>
  );
}

function Dashboard({ data }: { data: AdminDashboardResponse }) {
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon="group" label="Total Users" value={data.users.total} />
        <Metric icon="person_add" label="New Today" value={data.users.new_today} />
        <Metric icon="bolt" label="Active Today" value={data.users.active_today} />
        <Metric icon="calendar_month" label="Active 30d" value={data.users.active_30d} />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon="quiz" label="PYQ Attempts" value={data.activity.pyq_attempts} />
        <Metric icon="fact_check" label="Submitted" value={data.activity.submitted_attempts} />
        <Metric icon="event_note" label="Planner Tasks" value={`${data.activity.completed_planner_tasks}/${data.activity.planner_tasks}`} />
        <Metric icon="forum" label="Community Posts" value={data.activity.community_posts} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <Panel title="Growth">
          <Row label="New users today" value={data.users.new_today} />
          <Row label="New users 7 days" value={data.users.new_7d} />
          <Row label="New users 30 days" value={data.users.new_30d} />
          <Row label="Tracked profiles" value={data.users.tracked_profiles} />
        </Panel>
        <Panel title="Usage">
          <Row label="AI messages today" value={data.activity.daily_messages} />
          <Row label="AI monthly tokens" value={data.activity.monthly_tokens.toLocaleString()} />
          <Row label="Documents" value={data.activity.documents} />
          <Row label="Storage" value={formatBytes(data.activity.storage_bytes)} />
        </Panel>
        <Panel title="Activity">
          <Row label="Active today" value={data.users.active_today} />
          <Row label="Active 7 days" value={data.users.active_7d} />
          <Row label="Active 30 days" value={data.users.active_30d} />
          <Row label="Generated" value={new Date(data.generated_at).toLocaleString()} />
        </Panel>
      </section>

      <section className="bg-surface rounded-lg border border-border shadow-soft overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Recent Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-surface-container-lowest text-text-muted font-label-sm text-label-sm">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Planner</th>
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3">AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recent_users.length === 0 ? (
                <tr><td className="px-4 py-6 text-text-muted" colSpan={7}>No tracked users yet.</td></tr>
              ) : data.recent_users.map((user) => <UserRow key={user.user_id} user={user} />)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function UserRow({ user }: { user: AdminDashboardUser }) {
  return (
    <tr className="font-body-md text-body-md">
      <td className="px-4 py-3"><p className="font-label-md text-text-primary">{user.email || user.display_name || user.user_id.slice(0, 8)}</p><p className="text-text-muted text-sm">{user.user_id.slice(0, 12)}</p></td>
      <td className="px-4 py-3 text-text-muted">{formatDate(user.created_at)}</td>
      <td className="px-4 py-3 text-text-muted">{formatDate(user.last_active_at)}</td>
      <td className="px-4 py-3">{user.submitted_attempts}/{user.attempts}</td>
      <td className="px-4 py-3">{user.completed_planner_tasks}/{user.planner_tasks}</td>
      <td className="px-4 py-3">{user.documents} ({formatBytes(user.storage_bytes)})</td>
      <td className="px-4 py-3">{user.daily_messages} msg / {user.monthly_tokens.toLocaleString()} tok</td>
    </tr>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: number | string }) {
  return <div className="bg-surface rounded-lg border border-border shadow-soft p-4"><div className="flex items-center gap-2 text-text-muted"><span className="material-symbols-outlined text-sm">{icon}</span><span className="font-label-sm text-label-sm">{label}</span></div><p className="font-headline-md text-headline-md text-primary mt-2">{value}</p></div>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="bg-surface rounded-lg border border-border shadow-soft p-5"><h2 className="font-headline-sm text-headline-sm text-text-primary mb-4">{title}</h2><div className="space-y-3">{children}</div></section>; }
function Row({ label, value }: { label: string; value: number | string }) { return <div className="flex items-center justify-between gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0"><span className="text-text-muted">{label}</span><span className="font-label-md text-text-primary text-right">{value}</span></div>; }
function formatDate(value: string | null) { return value ? new Date(value).toLocaleString() : 'Not tracked'; }
function formatBytes(bytes: number) { if (!bytes) return '0 B'; const units = ['B', 'KB', 'MB', 'GB']; let value = bytes; let i = 0; while (value >= 1024 && i < units.length - 1) { value /= 1024; i += 1; } return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`; }
