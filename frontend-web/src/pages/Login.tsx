import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, friendlyError } from '../context/AuthContext';

type Mode = 'signin' | 'signup';

export default function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const isDesktopApp = window.location.protocol === 'file:';

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      navigate('/chat');
    } catch (e: any) {
      setError(e.code ? friendlyError(e.code) : String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      navigate('/chat');
    } catch (e: any) {
      setError(e.code ? friendlyError(e.code) : String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

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
            <span className="material-symbols-outlined text-[17px] text-indigo-400">smart_toy</span>
            <span>GATE Computer Science AI Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text">
            My Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
            {mode === 'signin'
              ? 'Sign in to access your personal RAG notes, PYQ test series, and AI doubt solver.'
              : 'Create an account to start your personalized GATE CS preparation.'}
          </p>
        </div>

        {/* Glass Form Panel */}
        <div className="rounded-3xl bg-white/95 dark:bg-[#101222]/95 backdrop-blur-2xl p-6 sm:p-8 border border-white/20 dark:border-slate-800 shadow-2xl shadow-indigo-950/40 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aspirant@gatecse.in"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                {mode === 'signin' && (
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Log In to Dashboard' : 'Create Student Account'}</span>
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
                  Or continue with
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
                <span>Continue with Google</span>
              </button>
            </>
          )}

          <div className="pt-2 text-center text-xs text-slate-500">
            <span>{mode === 'signin' ? "Don't have an account?" : 'Already registered?'}</span>{' '}
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                setError('');
              }}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              {mode === 'signin' ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>

        {/* Platform Feature Trust Strip */}
        <div className="grid grid-cols-3 gap-2 text-center text-slate-400 text-[11px] pt-2">
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-[18px] text-indigo-400">verified</span>
            <span>2012–2026 PYQs</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-[18px] text-purple-400">layers</span>
            <span>Multi-Doc RAG</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-[18px] text-cyan-400">offline_bolt</span>
            <span>FastEmbed ONNX</span>
          </div>
        </div>
      </div>
    </div>
  );
}
