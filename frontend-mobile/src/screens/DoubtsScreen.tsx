import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Card, PrimaryButton, ScrollShell, theme } from '../components/MobileScaffold';
import { doubtsApi } from '../services/api';

export default function DoubtsScreen() {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<{ uri: string; name: string } | null>(null);
  const [answer, setAnswer] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) {
      setFile({ uri: result.assets[0].uri, name: result.assets[0].name });
    }
  }

  async function solve() {
    setLoading(true);
    setError('');
    setAnswer('');
    setExtractedText('');
    try {
      const res = await doubtsApi.solve({ message, subject, topic, uri: file?.uri, filename: file?.name });
      setAnswer(res.answer);
      setExtractedText(res.extracted_text);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not solve this doubt.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && (!!message.trim() || !!file);

  return (
    <ScrollShell title="Doubt Solver" subtitle="Ask by text, or attach an image/PDF of a question.">
      <Card>
        <View style={local.row}>
          <TextInput style={[local.input, { flex: 1 }]} placeholder="Subject" placeholderTextColor={theme.muted} value={subject} onChangeText={setSubject} />
          <TextInput style={[local.input, { flex: 1 }]} placeholder="Topic" placeholderTextColor={theme.muted} value={topic} onChangeText={setTopic} />
        </View>
        <TextInput
          style={[local.input, local.textArea]}
          placeholder="Describe where you are stuck..."
          placeholderTextColor={theme.muted}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity style={local.fileBox} onPress={pickFile}>
          <Text style={local.fileTitle}>{file ? file.name : 'Attach image, PDF, DOCX, TXT, or notes'}</Text>
          <Text style={local.fileHint}>Optional upload</Text>
        </TouchableOpacity>
        {error ? <Text style={local.error}>{error}</Text> : null}
        <PrimaryButton label={loading ? 'Solving...' : 'Solve Doubt'} icon="sparkles-outline" onPress={solve} disabled={!canSubmit} />
      </Card>

      {loading ? <ActivityIndicator color={theme.primary} style={{ marginVertical: 18 }} /> : null}

      {answer ? (
        <Card>
          <Text style={local.cardTitle}>Tutor Answer</Text>
          <Text style={local.answer}>{answer}</Text>
        </Card>
      ) : null}

      {extractedText ? (
        <Card>
          <Text style={local.cardTitle}>Extracted Text</Text>
          <Text style={local.answer}>{extractedText}</Text>
        </Card>
      ) : null}
    </ScrollShell>
  );
}

const local = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  input: { backgroundColor: theme.surface2, color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, fontSize: 14 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  fileBox: { borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 9, padding: 13, marginBottom: 12, backgroundColor: theme.surface2 },
  fileTitle: { color: theme.text, fontWeight: '800', fontSize: 13 },
  fileHint: { color: theme.muted, fontSize: 12, marginTop: 3 },
  error: { color: theme.danger, marginBottom: 10 },
  cardTitle: { color: theme.text, fontSize: 16, fontWeight: '900', marginBottom: 8 },
  answer: { color: theme.muted, fontSize: 14, lineHeight: 21 },
});
