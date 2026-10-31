import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, GhostButton, Pill, PrimaryButton, theme } from '../components/MobileScaffold';
import {
  generateLocalReply,
  getLocalModelStatus,
  importLocalModel,
  inspectLocalModel,
  loadLocalModel,
  releaseLocalModel,
  type LocalChatMessage,
  type LocalModelStatus,
} from '../services/localModel';

interface ChatRow {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const systemMessage: LocalChatMessage = {
  role: 'system',
  content: 'You are a concise GATE CS study assistant. Explain clearly, use steps, and keep answers practical.',
};

export default function LocalModelScreen() {
  const [status, setStatus] = useState<LocalModelStatus | null>(null);
  const [modelInfo, setModelInfo] = useState('');
  const [loadingModel, setLoadingModel] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatRow[]>([
    { id: 'welcome', role: 'assistant', text: 'Import your GGUF model, load it, then ask me a GATE CS question offline.' },
  ]);

  async function refresh() {
    const next = await getLocalModelStatus();
    setStatus(next);
  }

  useEffect(() => {
    refresh().catch(() => setError('Could not read local model status.'));
    return () => {
      releaseLocalModel().catch(() => {});
    };
  }, []);

  const sizeLabel = useMemo(() => {
    if (!status?.sizeBytes) return 'No model imported';
    const gb = status.sizeBytes / 1_073_741_824;
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(status.sizeBytes / 1_048_576).toFixed(1)} MB`;
  }, [status]);

  async function pickModel() {
    setError('');
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.name.toLowerCase().endsWith('.gguf')) {
      setError('Please choose a .gguf model file.');
      return;
    }
    setBusy(true);
    try {
      const next = await importLocalModel(asset.uri, asset.name);
      setStatus(next);
      setModelInfo('');
    } catch (e: any) {
      setError(e?.message || 'Could not import model.');
    } finally {
      setBusy(false);
    }
  }

  async function loadModel() {
    setError('');
    setLoadingModel(true);
    setProgress(0);
    try {
      await loadLocalModel(undefined, setProgress);
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Could not load model.');
    } finally {
      setLoadingModel(false);
    }
  }

  async function inspect() {
    setError('');
    setBusy(true);
    try {
      const info = await inspectLocalModel();
      setModelInfo(JSON.stringify(info, null, 2).slice(0, 1600));
    } catch (e: any) {
      setError(e?.message || 'Could not inspect model.');
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy || loadingModel) return;
    setInput('');
    setError('');
    const user: ChatRow = { id: `${Date.now()}-u`, role: 'user', text };
    const assistantId = `${Date.now()}-a`;
    setMessages((prev) => [...prev, user, { id: assistantId, role: 'assistant', text: '' }]);
    setBusy(true);
    try {
      const history: LocalChatMessage[] = [
        systemMessage,
        ...messages
          .filter((m) => m.id !== 'welcome')
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.text }) as LocalChatMessage),
        { role: 'user', content: text },
      ];
      let streamed = '';
      const finalText = await generateLocalReply(history, (token) => {
        streamed += token;
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, text: streamed } : m));
      });
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, text: finalText || streamed || 'No text generated.' } : m));
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Local generation failed.');
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, text: 'Local generation failed. Check that the model is imported and loaded.' } : m));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>On-Device Model</Text>
            <Text style={styles.subtitle}>Run a GGUF model inside the mobile app.</Text>
          </View>
          <Pill label={status?.loaded ? 'Loaded' : status?.exists ? 'Imported' : 'Missing'} tone={status?.loaded ? 'success' : status?.exists ? 'primary' : 'danger'} />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              <Card>
                <Text style={styles.cardTitle}>Model File</Text>
                <Text style={styles.meta}>{status?.modelPath ?? 'Checking...'}</Text>
                <Text style={styles.meta}>{sizeLabel}</Text>
                {loadingModel ? <Text style={styles.progress}>Loading: {Math.round(progress * 100)}%</Text> : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <View style={styles.actions}>
                  <PrimaryButton label={busy ? 'Working...' : 'Import GGUF'} icon="download-outline" onPress={pickModel} disabled={busy || loadingModel} />
                  <GhostButton label="Load" icon="hardware-chip-outline" onPress={loadModel} />
                </View>
                <View style={styles.actions}>
                  <GhostButton label="Inspect" icon="information-circle-outline" onPress={inspect} />
                  <GhostButton label="Release" icon="close-circle-outline" onPress={() => releaseLocalModel().then(refresh)} />
                </View>
              </Card>
              {modelInfo ? <Card><Text style={styles.cardTitle}>Model Info</Text><Text style={styles.info}>{modelInfo}</Text></Card> : null}
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.assistantText]}>
                {item.text || (busy ? 'Thinking...' : '')}
              </Text>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask the local model..."
            placeholderTextColor={theme.muted}
            multiline
          />
          <TouchableOpacity style={[styles.send, (!status?.exists || busy) && styles.disabled]} onPress={send} disabled={!status?.exists || busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={19} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 18,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: { color: theme.primary, fontSize: 22, fontWeight: '900' },
  subtitle: { color: theme.muted, fontSize: 12, marginTop: 3 },
  list: { padding: 14, paddingBottom: 24 },
  cardTitle: { color: theme.text, fontSize: 15, fontWeight: '900', marginBottom: 8 },
  meta: { color: theme.muted, fontSize: 12, lineHeight: 18 },
  progress: { color: theme.primary, fontWeight: '900', marginTop: 8 },
  error: { color: theme.danger, marginTop: 8, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  info: { color: theme.muted, fontSize: 11, lineHeight: 17 },
  bubble: { maxWidth: '86%', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: theme.primary, borderColor: theme.primary },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: theme.surface, borderColor: theme.border },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userText: { color: '#fff' },
  assistantText: { color: theme.onSurface },
  inputRow: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  input: { flex: 1, maxHeight: 110, backgroundColor: theme.surface2, borderRadius: 8, color: theme.text, paddingHorizontal: 12, paddingVertical: 10 },
  send: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary },
  disabled: { opacity: 0.5 },
});
