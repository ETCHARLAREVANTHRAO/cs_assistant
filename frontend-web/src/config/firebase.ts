import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, type Auth } from 'firebase/auth';

const firebaseApiKey =
  import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBNmRsap9D-4OHvpeluY33WA0YgnzKNxEg';

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: 'my-assistant-ecf2f.firebaseapp.com',
  projectId: 'my-assistant-ecf2f',
  storageBucket: 'my-assistant-ecf2f.firebasestorage.app',
  messagingSenderId: '927897334283',
  appId: '1:927897334283:web:fb36bac9374a169afe4d0e',
};

// Purge any stale redirect / OAuth state in sessionStorage
try {
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith('firebase:') || key.startsWith('pendingRedirect')) {
      sessionStorage.removeItem(key);
    }
  }
} catch {
  // safe to ignore in environments where sessionStorage is blocked
}

const app = firebaseApiKey ? initializeApp(firebaseConfig) : null;
export const auth: Auth | null = app ? getAuth(app) : null;

if (auth) {
  auth.setPersistence(browserLocalPersistence).catch(() => {});
}

export const isFirebaseConfigured = Boolean(firebaseApiKey);
