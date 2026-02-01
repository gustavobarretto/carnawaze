import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export interface Pin {
  id: string;
  artistId: string;
  artist: { id: string; name: string };
  lat: number;
  lng: number;
  reportCount: number;
}

interface MapViewComponentProps {
  pins: Pin[];
  initialRegion?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onConfirmPin?: (pin: Pin) => void;
  onReportIncorrect?: (pin: Pin) => void;
  onRemovePin?: (pin: Pin) => void;
  isAdmin?: boolean;
}

export default function MapViewComponent({ pins }: MapViewComponentProps) {
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Mapa disponível no app (iOS/Android)</Text>
        <Text style={styles.bannerSubtext}>Trios elétricos reportados:</Text>
      </View>
      <ScrollView style={styles.list}>
        {pins.length === 0 ? (
          <Text style={styles.empty}>Nenhum pin no momento.</Text>
        ) : (
          pins.map((pin) => (
            <View key={pin.id} style={styles.pinRow}>
              <Text style={styles.artistName}>{pin.artist.name}</Text>
              <Text style={styles.coords}>
                {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
              </Text>
              <Text style={styles.count}>{pin.reportCount} confirmações</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  banner: {
    padding: 16,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  bannerText: { color: '#e94560', fontWeight: '600', fontSize: 14, marginBottom: 4 },
  bannerSubtext: { color: '#a0a0a0', fontSize: 12 },
  list: { flex: 1, padding: 16 },
  empty: { color: '#a0a0a0', textAlign: 'center', marginTop: 24 },
  pinRow: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  artistName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  coords: { color: '#a0a0a0', fontSize: 12, marginTop: 4 },
  count: { color: '#e94560', fontSize: 12, marginTop: 4 },
});
