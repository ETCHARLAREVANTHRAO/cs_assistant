import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  text: string;
  isUser: boolean;
  sources?: string[];
}

export default function MessageBubble({ text, isUser, sources }: Props) {
  return (
    <View style={[styles.wrapper, isUser ? styles.userWrapper : styles.botWrapper]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.botText]}>{text}</Text>
        {!isUser && sources && sources.length > 0 && (
          <Text style={styles.sources}>Sources: {sources.join(', ')}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 4, paddingHorizontal: 12 },
  userWrapper: { alignItems: 'flex-end' },
  botWrapper: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  userBubble: { backgroundColor: '#3525CD', borderColor: '#3525CD', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderBottomLeftRadius: 4 },
  text: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  botText: { color: '#1B1B24' },
  sources: { marginTop: 6, fontSize: 11, color: '#6B7280', fontStyle: 'italic' },
});
