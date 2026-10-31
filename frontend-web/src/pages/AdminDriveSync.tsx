import { useState } from 'react';
import { syncDrive } from '../services/api';

// Deliberately not linked from Layout/nav — the backend also independently
// rejects any non-admin caller with 403, so this page is a convenience
// trigger only, not a security boundary.
export default function AdminDriveSync() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [details, setDetails] = useState<{ ingested: string[]; skipped: string[]; failed: string[] } | null>(null);

  const handleSync = async () => {
    setError('');
    setMessage('');
    setDetails(null);
    setSyncing(true);
    try {
      const result = await syncDrive();
      setDetails(result);
      const parts = [];
      if (result.ingested.length) parts.push(`${result.ingested.length} synced`);
      if (result.skipped.length) parts.push(`${result.skipped.length} skipped (unsupported type)`);
      if (result.failed.length) parts.push(`${result.failed.length} failed`);
      setMessage(parts.length ? parts.join(', ') : 'Everything already up to date.');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Drive sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-surface rounded-[16px] p-8 shadow-soft border border-border">
        <h1 className="font-headline-lg text-headline-lg text-text-primary mb-2">Admin: Drive Sync</h1>
        <p className="font-body-md text-body-md text-text-muted mb-6">
          Syncs the shared Drive folder into the global knowledge base used as background
          context for every user's chat. Never appears in any user's Documents list.
        </p>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-[16px] font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-soft hover:shadow-hover disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[20px] ${syncing ? 'animate-spin' : ''}`}>
            sync
          </span>
          {syncing ? 'Syncing...' : 'Sync from Drive'}
        </button>

        {error && (
          <div className="mt-6 px-4 py-3 rounded-lg bg-error-container/40 border border-error/30 text-error font-label-sm text-label-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 px-4 py-3 rounded-lg bg-success/10 border border-success/30 text-success font-label-sm text-label-sm">
            {message}
          </div>
        )}

        {details && (details.ingested.length > 0 || details.skipped.length > 0 || details.failed.length > 0) && (
          <div className="mt-4 font-label-sm text-label-sm text-text-muted space-y-1">
            {details.ingested.map((f) => (
              <div key={f} className="text-success">✓ {f}</div>
            ))}
            {details.skipped.map((f) => (
              <div key={f}>– {f} (skipped)</div>
            ))}
            {details.failed.map((f) => (
              <div key={f} className="text-error">✗ {f} (failed)</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
