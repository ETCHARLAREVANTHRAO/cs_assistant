import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

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

const app = firebaseApiKey ? initializeApp(firebaseConfig) : null;

// Web app: default browser localStorage persistence
export const auth: Auth | null = app ? getAuth(app) : null;
export const isFirebaseConfigured = Boolean(firebaseApiKey);
