import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: 'my-assistant-ecf2f.firebaseapp.com',
  projectId: 'my-assistant-ecf2f',
  storageBucket: 'my-assistant-ecf2f.firebasestorage.app',
  messagingSenderId: '927897334283',
  appId: '1:927897334283:web:fb36bac9374a169afe4d0e',
};

const mockAuth = {
  currentUser: null,
  signOut: async () => {},
};

const app = firebaseApiKey ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : (mockAuth as any);
