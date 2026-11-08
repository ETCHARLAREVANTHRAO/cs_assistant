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
  GoogleAuthProvider,
  onAuthStateChanged,
  browserPopupRedirectResolver,
  type User,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { activityPing } from '../services/api';

interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function friendlyError(code: string, fallback?: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
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
        ? `Sign-in failed: ${fallback} (${code})`
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

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured for this deployment.');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured for this deployment.');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase is not configured for this deployment.');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      // Pass browserPopupRedirectResolver explicitly to avoid sessionStorage redirect fallback crashes
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
