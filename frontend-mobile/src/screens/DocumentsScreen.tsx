import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DocumentCard from '../components/DocumentCard';
import { documentsApi } from '../services/api';

const LIMIT_MB = 15;

function formatMB(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export default function DocumentsScreen() {
  const [docs, setDocs] = useState<string[]>([]);
  const [usedBytes, setUsedBytes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const showMsg = (text: string, error = false) => {
    setMessage({ text, error });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentsApi.list();
      setDocs(res.documents);
      setUsedBytes(res.used_bytes);
    } catch (e: any) {
      showMsg('Could not load documents: ' + (e?.message ?? 'Unknown error'), true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadDocs(); }, [loadDocs]));

  const pickAndUpload = async () => {
    if (Platform.OS === 'web') {
      const doc = typeof document !== 'undefined' ? document : null;
      if (!doc) return;
      const input = doc.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
          const msg = await documentsApi.upload('', file.name, file);
          showMsg(msg || 'Uploaded successfully!');
          await loadDocs();
        } catch (e: any) {
          console.error('Upload error:', e);
          showMsg('Upload failed: ' + (e?.message || 'Unknown error'), true);
        } finally {
          setUploading(false);
          input.value = '';
        }
      };
      input.click();
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const msg = await documentsApi.upload(asset.uri, asset.name);
      showMsg(msg || 'Uploaded successfully!');
      await loadDocs();
    } catch (e: any) {
      const detail = e?.response?.data?.detail ?? e?.message ?? 'Unknown error';
      showMsg('Upload failed: ' + detail, true);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`Remove "${filename}" from the knowledge base?`)
      : true;
    if (!confirmed) return;
    try {
      await documentsApi.delete(filename);
      showMsg(`"${filename}" deleted.`);
      await loadDocs();
    } catch {
      showMsg('Could not delete document.', true);
    }
  };

  const usedMB = parseFloat(formatMB(usedBytes));
  const pct = Math.min((usedMB / LIMIT_MB) * 100, 100);
  const barColor = pct > 85 ? '#EF4444' : pct > 60 ? '#A44100' : '#3525CD';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Documents</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickAndUpload} disabled={uploading}>
          {uploading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="add" size={22} color="#fff" />}
        </TouchableOpacity>
      </View>

      {/* Quota bar */}
      <View style={styles.quotaContainer}>
        <View style={styles.quotaRow}>
          <Text style={styles.quotaText}>{formatMB(usedBytes)} MB used</Text>
          <Text style={styles.quotaText}>{LIMIT_MB} MB limit</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
        </View>
      </View>

      {message && (
        <View style={[styles.toast, message.error ? styles.toastError : styles.toastSuccess]}>
          <Text style={styles.toastText}>{message.text}</Text>
        </View>
      )}

      {loading
        ? <ActivityIndicator style={styles.center} color="#3525CD" />
        : docs.length === 0
          ? <Text style={styles.empty}>No documents yet. Tap + to upload.</Text>
          : (
            <FlatList
              data={docs}
              keyExtractor={d => d}
              renderItem={({ item }) => <DocumentCard filename={item} onDelete={handleDelete} />}
            />
          )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#3525CD' },
  uploadBtn: {
    backgroundColor: '#3525CD', width: 38, height: 38,
    borderRadius: 19, justifyContent: 'center', alignItems: 'center',
  },
  quotaContainer: { paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  quotaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  quotaText: { color: '#6B7280', fontSize: 12 },
  barBg: { height: 6, backgroundColor: '#EAE6F4', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  toast: { margin: 12, padding: 12, borderRadius: 10 },
  toastSuccess: { backgroundColor: '#10B981' },
  toastError: { backgroundColor: '#EF4444' },
  toastText: { color: '#fff', fontSize: 14, textAlign: 'center' },
  center: { flex: 1, alignSelf: 'center' },
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 60, paddingHorizontal: 40, fontSize: 15, lineHeight: 22 },
});
