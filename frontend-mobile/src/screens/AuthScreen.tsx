import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../config/firebase';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const clearState = () => { setError(''); setResetSent(false); };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setError(e.code ? `${friendlyError(e.code)} [${e.code}]` : String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      setError(e.code ? `${friendlyError(e.code)} [${e.code}]` : String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email above first.'); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (e: any) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}>
          <Ionicons name="school-outline" size={34} color="#fff" />
        </View>
        <Text style={styles.title}>GATE CS Assistant</Text>
        <Text style={styles.subtitle}>PYQs, learning, doubts, planner, analytics, and AI tools in one mobile app.</Text>

        {/* Mode tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'signin' && styles.tabActive]}
            onPress={() => { setMode('signin'); clearState(); }}
          >
            <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.tabActive]}
            onPress={() => { setMode('signup'); clearState(); }}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Inputs */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {resetSent ? <Text style={styles.success}>Password reset email sent!</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>
          }
        </TouchableOpacity>

        {mode === 'signin' && (
          <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {Platform.OS === 'web' && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={loading}>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function friendlyError(code: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
    default: return 'Something went wrong. Please try again.';
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  brandMark: {
    width: 72, height: 72, borderRadius: 18, backgroundColor: '#4F46E5',
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 31, fontWeight: '900', color: '#3525CD', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 21, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  tabs: { flexDirection: 'row', backgroundColor: '#F0ECF9', borderRadius: 8, marginBottom: 24, padding: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#3525CD' },
  tabText: { color: '#6B7280', fontWeight: '800', fontSize: 15 },
  tabTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#FFFFFF', color: '#111827', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    marginBottom: 14, borderWidth: 1, borderColor: '#E5E7EB',
  },
  error: { color: '#ff6b6b', marginBottom: 12, textAlign: 'center', fontSize: 14 },
  success: { color: '#51cf66', marginBottom: 12, textAlign: 'center', fontSize: 14 },
  button: {
    backgroundColor: '#3525CD', borderRadius: 8, paddingVertical: 15,
    alignItems: 'center', marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: '#3525CD', textAlign: 'center', fontSize: 14, marginTop: 4, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { color: '#6B7280', marginHorizontal: 12, fontSize: 13 },
  googleButton: {
    backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  googleButtonText: { color: '#333', fontSize: 15, fontWeight: '600' },
});
