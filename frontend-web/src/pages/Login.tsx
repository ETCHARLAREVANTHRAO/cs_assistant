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
    <div className="bg-background min-h-screen flex items-center justify-center font-body-md text-on-background antialiased relative overflow-hidden">
      {/* Ambient Background Elements for Depth */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-secondary-container/10 rounded-full blur-[100px]" />
      </div>
      {/* Centered Form Container */}
      <div className="w-full max-w-md px-4 sm:px-0 z-10 relative">
        <div className="glass-panel rounded-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] p-stack-lg flex flex-col gap-stack-lg relative overflow-hidden">
          {/* Subtle Top Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-stack-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2 shadow-sm border border-primary/20">
              <span className="material-symbols-outlined text-primary font-bold" style={{ fontSize: '28px' }}>
                school
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">my_assistant</h1>
            <p className="font-body-md text-body-md text-text-muted mt-1">
              {mode === 'signin' ? 'Sign in to continue your preparation.' : 'Create an account to get started.'}
            </p>
          </div>
          {/* Form */}
          <form className="flex flex-col gap-stack-md" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-shadow placeholder:text-outline-variant"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">
                  Password
                </label>
                {mode === 'signin' && (
                  <a className="font-label-sm text-label-sm text-primary hover:text-primary-fixed-variant transition-colors" href="#">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                </div>
                <input
                  className="w-full pl-10 pr-10 py-3 bg-surface border border-border rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-shadow placeholder:text-outline-variant"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface-variant transition-colors"
                  onClick={() => setShowPassword((s) => !s)}
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${showPassword ? 'text-primary' : ''}`}
                  >
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
            {error && (
              <p className="text-error font-label-sm text-label-sm text-center">{error}</p>
            )}
            <button
              className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-lg shadow-sm hover:bg-primary-container hover:shadow-[0_4px_12px_rgba(53,37,205,0.2)] transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Please wait...' : mode === 'signin' ? 'Log In' : 'Create Account'}</span>
              {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </form>
          {!isDesktopApp && (
            <>
              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-border" />
                <span className="flex-shrink-0 mx-4 font-label-sm text-label-sm text-text-muted uppercase tracking-wider">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-border" />
              </div>
              {/* OAuth Buttons */}
              <div className="grid grid-cols-1 gap-stack-md">
                <button
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-surface border border-border rounded-lg shadow-sm hover:bg-surface-container-low transition-colors text-on-surface font-label-md text-label-md active:scale-[0.98] disabled:opacity-60"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
              </div>
            </>
          )}
          {/* Footer Link */}
          <div className="text-center mt-2">
            <span className="font-body-md text-body-md text-text-muted">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                setError('');
              }}
              className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors ml-1 font-semibold"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
