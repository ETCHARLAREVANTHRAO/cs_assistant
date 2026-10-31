import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { pyqColors as c } from './colors';

interface Props {
  paperTitle: string;
  durationMinutes: number;
  onNext: () => void;
  onBack: () => void;
}

const LEGEND = [
  { color: c.notVisited, textColor: c.notVisitedText, label: 'You have NOT visited the question yet.' },
  { color: c.notAnswered, textColor: '#fff', label: 'You have NOT answered the question.' },
  { color: c.answered, textColor: '#fff', label: 'You HAVE answered the question.' },
  { color: c.marked, textColor: '#fff', label: 'You have NOT answered the question, but have marked it for review.' },
];

export default function GeneralInstructions({ paperTitle, durationMinutes, onNext, onBack }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>{paperTitle}</Text>
      </View>
      <View style={styles.subheader}><Text style={styles.subheaderText}>Instructions</Text></View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.h2}>General Instructions</Text>
        <Text style={styles.bold}>Please read the following carefully.</Text>

        <Text style={styles.p}>
          1. The duration of the examination is <Text style={styles.bold}>{durationMinutes}</Text> minutes.
          The countdown timer at the top of your screen displays the time available for you to complete the examination.
        </Text>
        <Text style={styles.p}>2. When the timer reaches zero, the examination will end automatically and your answers will be auto-submitted.</Text>
        <Text style={styles.p}>3. Tap the grid icon at any time to open the Question Palette and jump to any question.</Text>
        <Text style={styles.p}>4. The Question Palette shows the status of each question using one of the following:</Text>

        <View style={styles.legendBox}>
          {LEGEND.map((item, i) => (
            <View key={i} style={[styles.legendRow, i !== LEGEND.length - 1 && styles.legendRowBorder]}>
              <View style={[styles.swatch, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.p}>
          5. There is a fixed marking scheme per question — negative marking applies only to MCQs;
          MSQ and NAT questions carry no negative marks.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backBtnText}>Back</Text></TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={onNext}><Text style={styles.nextBtnText}>Next →</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: { backgroundColor: c.header, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: '#e6b335' },
  headerTitle: { color: c.headerText, fontWeight: '700', fontSize: 14 },
  subheader: { backgroundColor: c.sidebar, paddingHorizontal: 16, paddingVertical: 8 },
  subheaderText: { color: c.primary, fontWeight: '700' },
  body: { flex: 1 },
  h2: { fontSize: 18, fontWeight: '800', textAlign: 'center', color: c.text, marginBottom: 16 },
  bold: { fontWeight: '700', color: c.text },
  p: { fontSize: 13, color: c.text, lineHeight: 20, marginBottom: 12 },
  legendBox: { borderWidth: 1, borderColor: c.border, borderRadius: 6, marginBottom: 12, overflow: 'hidden' },
  legendRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 12 },
  legendRowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  swatch: { width: 28, height: 26, borderRadius: 4 },
  legendText: { flex: 1, fontSize: 12, color: c.text },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: c.border },
  backBtn: { borderWidth: 1, borderColor: c.border, borderRadius: 6, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: c.text, fontWeight: '600' },
  nextBtn: { backgroundColor: c.primary, borderRadius: 6, paddingHorizontal: 24, paddingVertical: 10 },
  nextBtnText: { color: '#fff', fontWeight: '700' },
});
