import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  filename: string;
  onDelete: (filename: string) => void;
}

export default function DocumentCard({ filename, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <Ionicons name="document-text-outline" size={22} color="#3525CD" style={styles.icon} />
      <Text style={styles.name} numberOfLines={1}>{filename}</Text>
      <TouchableOpacity onPress={() => onDelete(filename)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 5,
    marginHorizontal: 16,
  },
  icon: { marginRight: 10 },
  name: { flex: 1, color: '#1B1B24', fontSize: 14 },
});
