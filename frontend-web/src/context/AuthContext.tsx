import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  GoogleAuthProvider,
  onAuthStateChanged,
  browserPopupRedirectResolver,
  type User,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { activityPing } from '../services/api';

export const ADMIN_EMAILS = new Set([
  'etcharlarevanthrao9402@gmail.com',
  'revrao9550@gmail.com',
]);

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}

export function isAccountVerified(user: User | null): boolean {
  if (!user) return false;
  if (user.emailVerified) return true;
  if (isUserAdmin(user.email)) return true;
  // If provider is Google, email is inherently verified
  if (user.providerData?.some((p) => p.providerId === 'google.com')) return true;
  return false;
}

interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  sendVerificationEmail: (user?: User | null) => Promise<void>;
  resendVerificationForEmail: (email: string, password: string) => Promise<void>;
  reloadUser: () => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function friendlyError(code: string, fallback?: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please log in.';
    case 'auth/weak-password':
    case 'auth/password-too-weak':
      return 'Password must be at least 8 characters and include letters and numbers.';
    case 'auth/password-mismatch':
      return 'Passwords do not match.';
    case 'auth/disposable-email':
      return 'Disposable or temporary emails are not permitted. Please use your real email address.';
    case 'auth/unverified-email':
      return 'Please verify your email address. We sent a verification link to your inbox.';
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few moments and try again.';
    case 'auth/popup-blocked':
      return 'The Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before it finished. Please try again.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'This sign-in method is not supported here. Please use email and password.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in popup is already open. Please close it and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google sign-in. Please contact the app administrator.';
    default:
      return fallback
        ? `Authentication notice: ${fallback} (${code})`
        : `Something went wrong (${code}). Please try again.`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        activityPing({ email: user.email ?? '', display_name: user.displayName ?? '' }).catch(() => {});
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const sendVerificationEmail = async (user?: User | null) => {
    const target = user || auth?.currentUser;
    if (!target) {
      throw new Error('No user is currently available to send a verification email to.');
    }
    await sendEmailVerification(target);
  };

  const resendVerificationForEmail = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured for this deployment.');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      await sendEmailVerification(cred.user);
    } finally {
      await signOut(auth);
    }
  };

  const reloadUser = async (): Promise<boolean> => {
    if (!auth?.currentUser) return false;
    await auth.currentUser.reload();
    const updated = auth.currentUser;
    setCurrentUser(updated ? ({ ...updated } as User) : null);
    return isAccountVerified(updated);
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    if (!auth) throw new Error('Firebase is not configured for this deployment.');
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Enforce email verification check for email/password users
    if (!isAccountVerified(cred.user)) {
      await signOut(auth);
      const err: any = new Error('Email verification required.');
      err.code = 'auth/unverified-email';
      err.email = cred.user.email;
      throw err;
    }

    return cred.user;
  };

  const signUp = async (email: string, password: string): Promise<User> => {
    if (!auth) throw new Error('Firebase is not configured for this deployment.');
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Immediately dispatch email verification link
    try {
      await sendEmailVerification(cred.user);
    } catch (verr) {
      console.warn('[Auth] Failed to dispatch verification email:', verr);
    }

    return cred.user;
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase is not configured for this deployment.');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    } catch (err: any) {
      console.error('[Google sign-in error]', err);
      throw err;
    }
  };

  const signOutUser = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const value: AuthContextValue = {
    currentUser,
    loading,
    signIn,
    signUp,
    sendVerificationEmail,
    resendVerificationForEmail,
    reloadUser,
    signInWithGoogle,
    signOutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
