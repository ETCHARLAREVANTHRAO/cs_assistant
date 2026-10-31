import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { WeatherData } from '../services/api';

interface Props {
  data: WeatherData;
}

export default function WeatherWidget({ data }: Props) {
  const iconUrl = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.city}>{data.city}</Text>
        <Image source={{ uri: iconUrl }} style={styles.icon} />
      </View>
      <Text style={styles.temp}>{Math.round(data.temperature_c)} deg C</Text>
      <Text style={styles.desc}>{data.description}</Text>
      <View style={styles.row}>
        <Stat label="Feels like" value={`${Math.round(data.feels_like_c)} deg C`} />
        <Stat label="Humidity" value={`${data.humidity}%`} />
        <Stat label="Wind" value={`${data.wind_speed_ms} m/s`} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    margin: 16,
    alignItems: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  city: { fontSize: 22, fontWeight: '800', color: '#111827', marginRight: 8 },
  icon: { width: 50, height: 50 },
  temp: { fontSize: 44, fontWeight: '500', color: '#3525CD', marginVertical: 4 },
  desc: { fontSize: 16, color: '#6B7280', marginBottom: 20, textTransform: 'capitalize' },
  row: { flexDirection: 'row', gap: 24 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 14, color: '#111827', fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
