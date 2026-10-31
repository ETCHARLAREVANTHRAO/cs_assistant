import { useEffect, useMemo, useState } from 'react';
import {
  adminCreateAnnouncement,
  adminDeactivateAnnouncement,
  adminGetContent,
  adminListAnnouncements,
  adminResetContent,
  adminSaveContent,
  type AdminAnnouncement,
  type AdminContentPayload,
} from '../services/api';

type SectionKey = keyof AdminContentPayload;

const SECTIONS: Array<{ key: SectionKey; label: string; icon: string }> = [
  { key: 'formula_sheets', label: 'Formulas', icon: 'functions' },
  { key: 'cheat_sheets', label: 'Cheat Sheets', icon: 'article_shortcut' },
  { key: 'book_recommendations', label: 'Books', icon: 'menu_book' },
  { key: 'exam_info', label: 'Exam Notices', icon: 'campaign' },
  { key: 'mentor_sessions', label: 'Mentor Sessions', icon: 'groups' },
  { key: 'short_tricks', label: 'Short Tricks', icon: 'tips_and_updates' },
  { key: 'learning_overrides', label: 'Learning', icon: 'school' },
];

export default function AdminContent() {
  const [content, setContent] = useState<AdminContentPayload | null>(null);
  const [section, setSection] = useState<SectionKey>('formula_sheets');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementRoute, setAnnouncementRoute] = useState('/exam-info');
  const [announcementPriority, setAnnouncementPriority] = useState('normal');
  const [sendPush, setSendPush] = useState(false);

  useEffect(() => {
    adminGetContent()
      .then((data) => {
        setContent(data);
        setDraft(JSON.stringify(data.formula_sheets, null, 2));
      })
      .catch((err: any) => setError(err?.response?.data?.detail || 'Admin content could not be loaded.'))
      .finally(() => setLoading(false));
    adminListAnnouncements().then(setAnnouncements).catch(() => {});
  }, []);

  const selectedMeta = useMemo(() => SECTIONS.find((item) => item.key === section)!, [section]);

  function selectSection(next: SectionKey) {
    setSection(next);
    setError('');
    setMessage('');
    setDraft(JSON.stringify(content?.[next] ?? null, null, 2));
  }

  async function save() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const parsed = JSON.parse(draft);
      const data = await adminSaveContent({ [section]: parsed });
      setContent(data);
      setDraft(JSON.stringify(data[section], null, 2));
      setMessage(`${selectedMeta.label} saved.`);
    } catch (err: any) {
      setError(err instanceof SyntaxError ? 'Invalid JSON. Fix the structure and try again.' : err?.response?.data?.detail || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const data = await adminResetContent();
      setContent(data);
      setDraft(JSON.stringify(data[section], null, 2));
      setMessage('Content reset to defaults.');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Reset failed.');
    } finally {
      setSaving(false);
    }
  }

  async function createAnnouncement() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await adminCreateAnnouncement({
        title: announcementTitle,
        message: announcementMessage,
        action_route: announcementRoute || undefined,
        priority: announcementPriority,
        send_push: sendPush,
      });
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setSendPush(false);
      setAnnouncements(await adminListAnnouncements());
      setMessage(`Announcement published${result.push.sent ? ` and pushed to ${result.push.sent} devices` : ''}.`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Announcement failed.');
    } finally {
      setSaving(false);
    }
  }

  async function deactivateAnnouncement(id: string) {
    setSaving(true);
    setError('');
    try {
      await adminDeactivateAnnouncement(id);
      setAnnouncements(await adminListAnnouncements());
      setMessage('Announcement deactivated.');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not deactivate announcement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-background p-gutter">
      <div className="max-w-container-max mx-auto space-y-5">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary">Admin Content</h1>
            <p className="font-body-md text-body-md text-text-muted mt-2">Manage formulas, cheat sheets, books, exam notices, mentor sessions, and short tricks.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} disabled={saving || loading} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-label-md text-label-md hover:bg-surface-container disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">restart_alt</span>Reset Defaults
            </button>
            <button onClick={save} disabled={saving || loading} className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 font-label-md text-label-md disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">save</span>{saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </header>

        {error && <div className="rounded-lg border border-error/30 bg-error-container/30 p-4 text-on-error-container">{error}</div>}
        {message && <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-success">{message}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <aside className="lg:col-span-3 bg-surface rounded-lg border border-border shadow-soft p-4 grid gap-2">
            {SECTIONS.map((item) => (
              <button key={item.key} onClick={() => selectSection(item.key)} className={section === item.key ? 'flex items-center gap-2 rounded-lg bg-primary text-white px-3 py-2.5 text-left' : 'flex items-center gap-2 rounded-lg text-on-surface-variant hover:bg-surface-container px-3 py-2.5 text-left'}>
                <span className="material-symbols-outlined text-sm">{item.icon}</span>{item.label}
              </button>
            ))}
          </aside>

          <main className="lg:col-span-9 bg-surface rounded-lg border border-border shadow-soft p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">{selectedMeta.icon}</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">{selectedMeta.label}</h2>
            </div>
            {loading ? (
              <div className="text-text-muted">Loading...</div>
            ) : (
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                spellCheck={false}
                className="w-full min-h-[620px] rounded-lg border border-border bg-surface-container-lowest p-4 font-code text-code text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </main>
        </div>

        <section className="bg-surface rounded-lg border border-border shadow-soft p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">notifications_active</span>
            <h2 className="font-headline-sm text-headline-sm text-text-primary">Bell Announcements</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <input value={announcementTitle} onChange={(event) => setAnnouncementTitle(event.target.value)} placeholder="Title" className="w-full rounded-lg border border-border bg-surface-container-lowest px-4 py-3" />
              <textarea value={announcementMessage} onChange={(event) => setAnnouncementMessage(event.target.value)} placeholder="Message" rows={4} className="w-full rounded-lg border border-border bg-surface-container-lowest px-4 py-3" />
              <div className="grid sm:grid-cols-2 gap-3">
                <select value={announcementRoute} onChange={(event) => setAnnouncementRoute(event.target.value)} className="rounded-lg border border-border bg-surface-container-lowest px-4 py-3">
                  <option value="/exam-info">Exam Info</option>
                  <option value="/pyq">PYQ</option>
                  <option value="/revision-planner">Revision Planner</option>
                  <option value="/resources">Resources</option>
                  <option value="/progress">Progress</option>
                  <option value="/motivation">Motivation</option>
                </select>
                <select value={announcementPriority} onChange={(event) => setAnnouncementPriority(event.target.value)} className="rounded-lg border border-border bg-surface-container-lowest px-4 py-3">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <label className="flex items-center gap-2 font-label-md text-label-md text-text-muted">
                <input type="checkbox" checked={sendPush} onChange={(event) => setSendPush(event.target.checked)} />
                Send push notification to registered devices
              </label>
              <button onClick={createAnnouncement} disabled={saving || !announcementTitle.trim() || !announcementMessage.trim()} className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 font-label-md text-label-md disabled:opacity-50">
                <span className="material-symbols-outlined text-sm">campaign</span>Publish Announcement
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {announcements.length === 0 ? <p className="text-text-muted">No announcements yet.</p> : announcements.map((item) => (
                <div key={item.notification_id} className={item.active ? 'rounded-lg border border-border p-3' : 'rounded-lg border border-border p-3 opacity-60'}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-label-md text-label-md font-bold text-text-primary">{item.title}</p>
                      <p className="font-body-sm text-body-sm text-text-muted mt-1">{item.message}</p>
                    </div>
                    {item.active && (
                      <button onClick={() => deactivateAnnouncement(item.notification_id)} className="text-error font-label-sm text-label-sm font-bold">Deactivate</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
