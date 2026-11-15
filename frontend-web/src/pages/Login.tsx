import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, friendlyError } from '../context/AuthContext';

type Mode = 'signin' | 'signup';

// Common disposable / throwaway email domains to prevent spam accounts
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com',
  '10minutemail.com',
  'mailinator.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
  'dispostable.com',
  'sharklasers.com',
  'fakeinbox.com',
  'getairmail.com',
  'throwawaymail.com',
  'temp-mail.org',
  'generator.email',
  'mohmal.com',
  'mytemp.email',
  'burnermail.io',
  'crazymailing.com',
  'inboxkitten.com',
  'dropmail.me',
  'tempail.com',
  'maildrop.cc',
]);

function isDisposableEmail(email: string): boolean {
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(parts[1]);
}

function isValidEmailFormat(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email.trim());
}

function validatePasswordStrength(pw: string): { valid: boolean; reason?: string } {
  if (pw.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  if (!hasLetter || !hasNumber) {
    return { valid: false, reason: 'Password must contain both letters and numbers.' };
  }
  return { valid: true };
}

export default function Login() {
  const { signIn, signUp, resendVerificationForEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const isDesktopApp = window.location.protocol === 'file:';

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Email verification sent state
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [unverifiedAccountAlert, setUnverifiedAccountAlert] = useState(false);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setUnverifiedAccountAlert(false);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Validate Email format
    if (!isValidEmailFormat(cleanEmail)) {
      setError('Please enter a valid, complete email address (e.g. name@domain.com).');
      return;
    }

    // 2. Block disposable emails
    if (isDisposableEmail(cleanEmail)) {
      setError('Temporary or disposable emails are not permitted. Please use your real email address.');
      return;
    }

    // 3. Password validations
    if (mode === 'signup') {
      const pwCheck = validatePasswordStrength(password);
      if (!pwCheck.valid) {
        setError(pwCheck.reason || 'Password does not meet security requirements.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter your password.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(cleanEmail, password);
        // Show verification pending screen
        setVerificationPendingEmail(cleanEmail);
        setResendCooldown(60);
      } else {
        await signIn(cleanEmail, password);
        navigate('/chat');
      }
    } catch (e: any) {
      if (e.code === 'auth/unverified-email') {
        setUnverifiedAccountAlert(true);
        setError('Your email is not verified yet. Please check your inbox for the activation link.');
      } else {
        setError(e.code ? friendlyError(e.code) : String(e.message || e));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isResending) return;
    const targetEmail = (verificationPendingEmail || email).trim().toLowerCase();
    if (!targetEmail) {
      setError('Please enter your email to resend the verification link.');
      return;
    }

    setIsResending(true);
    setError('');
    setInfoMessage('');
    try {
      // If we have password in state, trigger resend
      if (password) {
        await resendVerificationForEmail(targetEmail, password);
      } else {
        setError('Please enter your password above so we can verify and resend the activation link.');
        return;
      }
      setInfoMessage(`Fresh activation link sent to ${targetEmail}! Check your inbox and spam folder.`);
      setResendCooldown(60);
    } catch (err: any) {
      setError(friendlyError(err.code || '', 'Unable to resend verification link.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      await signInWithGoogle();
      navigate('/chat');
    } catch (e: any) {
      setError(e.code ? friendlyError(e.code) : String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  // Render Verification Sent Screen
  if (verificationPendingEmail) {
    return (
      <div className="min-h-screen resq-hero-dark flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="resq-beam" />
        <div className="resq-beam-right" />
        <div className="absolute inset-0 resq-stardust opacity-25 pointer-events-none" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          <div className="rounded-3xl bg-white/95 dark:bg-[#101222]/95 backdrop-blur-2xl p-6 sm:p-8 border border-white/20 dark:border-slate-800 shadow-2xl shadow-indigo-950/40 text-center space-y-5">
            {/* Visual Header */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[32px] text-indigo-600 dark:text-indigo-400 animate-bounce">
                mark_email_unread
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Verify Your Email
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                We sent an official activation link to:
              </p>
              <div className="inline-block px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                {verificationPendingEmail}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-left space-y-1.5">
              <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-amber-500">info</span>
                Next Steps:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Open the email from Firebase / My Assistant.</li>
                <li>Click the verification link to activate your account.</li>
                <li>Return here and log in with your credentials.</li>
              </ol>
              <p className="pt-1 text-[10px] text-slate-400 italic">
                Tip: Check your spam or promotions folder if you don't see it within 60 seconds.
              </p>
            </div>

            {infoMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs">
                {infoMessage}
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
                onClick={() => {
                  setVerificationPendingEmail(null);
                  setMode('signin');
                  setInfoMessage('Account created! Please log in once you have clicked the verification link.');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Log In</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || isResending}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[15px]">send</span>
                <span>
                  {resendCooldown > 0
                    ? `Resend link in ${resendCooldown}s`
                    : isResending
                    ? 'Sending...'
                    : 'Resend Verification Link'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerificationPendingEmail(null);
                  setMode('signup');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
              >
                Use a different email address
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen resq-hero-dark flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Resq Ambient Beams */}
      <div className="resq-beam" />
      <div className="resq-beam-right" />
      <div className="absolute inset-0 resq-stardust opacity-25 pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Card */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-semibold shadow-lg">
            <span className="material-symbols-outlined text-[17px] text-indigo-400">code_blocks</span>
            <span>Computer Science & AI Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text">
            My Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
            {mode === 'signin'
              ? 'Sign in to access your AI engineering copilot, interactive labs, and research tools.'
              : 'Create a student account to master Computer Science, Software Engineering, and AI.'}
          </p>
        </div>

        {/* Glass Form Panel */}
        <div className="rounded-3xl bg-white/95 dark:bg-[#101222]/95 backdrop-blur-2xl p-6 sm:p-8 border border-white/20 dark:border-slate-800 shadow-2xl shadow-indigo-950/40 space-y-5">
          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>{infoMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span>{error}</span>
              </div>

              {unverifiedAccountAlert && (
                <div className="pt-2 border-t border-rose-200/50 dark:border-rose-800/50 flex items-center justify-between">
                  <span className="text-[11px] text-rose-600 dark:text-rose-400">Need a new link?</span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendCooldown > 0 || isResending}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-[10px] hover:bg-rose-700 disabled:opacity-50 transition-all"
                  >
                    {resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend Link'}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                {mode === 'signup' && (
                  <span className="text-[10px] text-slate-400">Min 8 chars, letters & numbers</span>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={mode === 'signup' ? 8 : 6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-1 animate-fadeIn">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    lock_reset
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Dashboard' : 'Create Verified Account'}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {!isDesktopApp && (
            <>
              <div className="relative flex items-center justify-center my-4">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                <span className="px-3 bg-white dark:bg-[#101222] text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute">
                  Instant Verified Sign-In
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google (Auto-Verified)</span>
              </button>
            </>
          )}

          <div className="pt-2 text-center text-xs text-slate-500">
            <span>{mode === 'signin' ? "Don't have an account?" : 'Already have a verified account?'}</span>{' '}
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                setError('');
                setInfoMessage('');
                setUnverifiedAccountAlert(false);
              }}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              {mode === 'signin' ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>

        {/* Platform Trust Badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-slate-400 text-[11px] pt-2">
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-[18px] text-indigo-400">verified_user</span>
            <span>Verified Auth</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-[18px] text-purple-400">terminal</span>
            <span>Interactive Labs</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-[18px] text-cyan-400">psychology</span>
            <span>AI Copilot</span>
          </div>
        </div>
      </div>
    </div>
  );
}
