import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WeatherWidget from '../components/WeatherWidget';
import { weatherApi, WeatherData } from '../services/api';

export default function WeatherScreen() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    const q = city.trim();
    if (!q) return;
    setLoading(true);
    try {
      setWeather(await weatherApi.get(q));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail ?? 'Could not fetch weather');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Weather</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Enter city name..."
            placeholderTextColor="#6B7280"
            returnKeyType="search"
            onSubmitEditing={fetch}
          />
          <TouchableOpacity style={styles.btn} onPress={fetch} disabled={loading}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {loading && <ActivityIndicator style={styles.loader} color="#3525CD" size="large" />}
        {weather && !loading && <WeatherWidget data={weather} />}
        {!weather && !loading && (
          <Text style={styles.hint}>Search for any city to see current weather.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: '800', color: '#3525CD', marginHorizontal: 20, marginTop: 16, marginBottom: 12 },
  searchRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  btn: {
    backgroundColor: '#3525CD',
    width: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: { marginTop: 40 },
  hint: { color: '#6B7280', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
