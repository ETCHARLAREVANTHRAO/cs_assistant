import { useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, isAccountVerified } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser, loading, sendVerificationEmail, reloadUser, signOutUser } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="font-label-md text-label-md text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if account email is verified
  if (!isAccountVerified(currentUser)) {
    const handleResend = async () => {
      setResending(true);
      setError('');
      setNotice('');
      try {
        await sendVerificationEmail(currentUser);
        setNotice(`Verification email sent to ${currentUser.email}! Check your inbox and spam folder.`);
      } catch (err: any) {
        setError(err.message || 'Failed to send verification email. Please try again later.');
      } finally {
        setResending(false);
      }
    };

    const handleRefresh = async () => {
      setChecking(true);
      setError('');
      setNotice('');
      try {
        const verified = await reloadUser();
        if (!verified) {
          setError('Email is not verified yet. Please click the link in your email first.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to refresh status.');
      } finally {
        setChecking(false);
      }
    };

    return (
      <div className="min-h-screen resq-hero-dark flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="resq-beam" />
        <div className="resq-beam-right" />
        <div className="w-full max-w-md relative z-10">
          <div className="rounded-3xl bg-white/95 dark:bg-[#101222]/95 backdrop-blur-2xl p-6 sm:p-8 border border-white/20 dark:border-slate-800 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[32px] text-amber-600 dark:text-amber-400">
                mark_email_unread
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Email Verification Required
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                To keep our student platform safe from unauthorized bot and fake accounts, please verify:
              </p>
              <div className="inline-block px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                {currentUser.email}
              </div>
            </div>

            {notice && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs">
                {notice}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={checking}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {checking ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Checking Status...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    <span>I have verified, let me in</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[15px]">send</span>
                <span>{resending ? 'Sending...' : 'Resend Verification Email'}</span>
              </button>

              <button
                type="button"
                onClick={() => signOutUser()}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
              >
                Sign out / Log in with different account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
