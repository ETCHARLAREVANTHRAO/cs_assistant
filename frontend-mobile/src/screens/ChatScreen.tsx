import React, { useEffect, useRef, useState } from 'react';
import {
  View, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessageBubble from '../components/MessageBubble';
import { chatApi, KnowledgeMode } from '../services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  sources?: string[];
}
const knowledgeModes: Array<{ key: KnowledgeMode; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'server', label: 'GATE Library', icon: 'cloud-outline' },
  { key: 'local', label: 'My Docs', icon: 'document-text-outline' },
  { key: 'hybrid', label: 'Best Answer', icon: 'layers-outline' },
];

export default function ChatScreen() {
  const route = useRoute<any>();
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: 'Hi! I\'m your personal assistant. Ask me anything or about your documents.', isUser: false },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [knowledgeMode, setKnowledgeMode] = useState<KnowledgeMode>('hybrid');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const prompt = route.params?.prompt;
    if (typeof prompt === 'string' && prompt.trim()) {
      setInput(prompt);
    }
  }, [route.params?.prompt]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), text, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatApi.send(text, knowledgeMode);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: res.reply,
        isUser: false,
        sources: res.sources,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: 'Sorry, something went wrong. Is the server running?', isUser: false },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.modeBar}>
          {knowledgeModes.map(mode => {
            const active = mode.key === knowledgeMode;
            return (
              <TouchableOpacity
                key={mode.key}
                style={[styles.modeBtn, active && styles.modeBtnActive]}
                onPress={() => setKnowledgeMode(mode.key)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Ionicons name={mode.icon} size={15} color={active ? '#fff' : '#6B7280'} />
                <Text style={[styles.modeText, active && styles.modeTextActive]} numberOfLines={1}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <MessageBubble text={item.text} isUser={item.isUser} sources={item.sources} />
          )}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
        {loading && <ActivityIndicator style={styles.loader} color="#3525CD" />}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor="#666"
            multiline
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={loading}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  modeBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modeBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  modeBtnActive: { backgroundColor: '#3525CD', borderColor: '#3525CD' },
  modeText: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
  modeTextActive: { color: '#fff' },
  list: { paddingVertical: 12 },
  loader: { marginVertical: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F2FF',
    color: '#111827',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: '#3525CD',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
