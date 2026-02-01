import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const FAROL_DA_BARRA = {
  latitude: -13.0097,
  longitude: -38.5317,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

const TRUCK_ICON_SIZE = 40;

/** Estilo do mapa: ruas em cinza em vez de preto (evita manchas pretas). */
const MAP_STYLE_STREETS_GRAY = [
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#bdbdbd' }] },
];

export interface Pin {
  id: string;
  artistId: string;
  artist: { id: string; name: string };
  lat: number;
  lng: number;
  reportCount: number;
}

interface OverlayPin {
  pin: Pin;
  x: number;
  y: number;
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

export default function MapViewComponent({ pins, initialRegion, onMapPress, onConfirmPin, onReportIncorrect, onRemovePin, isAdmin }: MapViewComponentProps) {
  const mapRef = useRef<MapView>(null);
  const region = initialRegion ?? FAROL_DA_BARRA;
  const [overlayPositions, setOverlayPositions] = useState<OverlayPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const updateOverlayPositions = useCallback(async () => {
    if (!mapRef.current || pins.length === 0) {
      setOverlayPositions([]);
      return;
    }
    try {
      const positions: OverlayPin[] = [];
      for (const pin of pins) {
        const point = await mapRef.current.pointForCoordinate({
          latitude: pin.lat,
          longitude: pin.lng,
        });
        positions.push({ pin, x: point.x, y: point.y });
      }
      setOverlayPositions(positions);
    } catch {
      setOverlayPositions([]);
    }
  }, [pins]);

  useEffect(() => {
    updateOverlayPositions();
  }, [updateOverlayPositions]);

  const handleMapReady = useCallback(() => {
    updateOverlayPositions();
  }, [updateOverlayPositions]);

  const handleRegionChangeComplete = useCallback(() => {
    updateOverlayPositions();
  }, [updateOverlayPositions]);

  const handleConfirmFromModal = useCallback(() => {
    if (selectedPin && onConfirmPin) {
      onConfirmPin(selectedPin);
    }
    setSelectedPin(null);
  }, [selectedPin, onConfirmPin]);

  const handleReportIncorrectFromModal = useCallback(() => {
    if (selectedPin && onReportIncorrect) {
      onReportIncorrect(selectedPin);
    }
    setSelectedPin(null);
  }, [selectedPin, onReportIncorrect]);

  const handleRemovePinFromModal = useCallback(() => {
    if (selectedPin && onRemovePin) {
      onRemovePin(selectedPin);
    }
    setSelectedPin(null);
  }, [selectedPin, onRemovePin]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        mapType="standard"
        customMapStyle={MAP_STYLE_STREETS_GRAY}
        onMapReady={handleMapReady}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={onMapPress ? (e) => onMapPress(e.nativeEvent.coordinate) : undefined}
      />
      {/* Overlay: truck icons at pin lat/lng (no map Markers – app-only overlay) */}
      <View style={styles.overlay} pointerEvents="box-none">
        {overlayPositions.map(({ pin, x, y }) => (
          <TouchableOpacity
            key={pin.id}
            style={[
              styles.truckIconWrap,
              {
                left: x - TRUCK_ICON_SIZE / 2,
                top: y - TRUCK_ICON_SIZE / 2,
              },
            ]}
            onPress={() => setSelectedPin(pin)}
            activeOpacity={0.8}
            pointerEvents="auto"
          >
            <Ionicons name="bus" size={TRUCK_ICON_SIZE} color="#8b0000" />
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={selectedPin != null} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPin(null)}
        >
          <View style={styles.pinCallout} onStartShouldSetResponder={() => true}>
            {selectedPin && (
              <>
                <Text style={styles.calloutTitle}>{selectedPin.artist.name}</Text>
                <Text style={styles.calloutDesc}>{selectedPin.reportCount} confirmações</Text>
                {onConfirmPin && (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirmFromModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmBtnText}>Confirme artista</Text>
                  </TouchableOpacity>
                )}
                {onReportIncorrect && (
                  <TouchableOpacity
                    style={styles.reportBtn}
                    onPress={handleReportIncorrectFromModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.reportBtnText}>Não é o artista</Text>
                  </TouchableOpacity>
                )}
                {isAdmin && onRemovePin && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={handleRemovePinFromModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.removeBtnText}>Remover pin</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPin(null)}>
                  <Text style={styles.closeBtnText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  truckIconWrap: {
    position: 'absolute',
    width: TRUCK_ICON_SIZE,
    height: TRUCK_ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCallout: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  calloutTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 6 },
  calloutDesc: { color: '#a0a0a0', fontSize: 13, marginBottom: 14 },
  confirmBtn: { backgroundColor: '#e94560', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  confirmBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  reportBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#a0a0a0', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginBottom: 8 },
  reportBtnText: { color: '#a0a0a0', fontWeight: '600', fontSize: 14 },
  removeBtn: { backgroundColor: '#8b0000', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginBottom: 8 },
  removeBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  closeBtn: { alignItems: 'center' },
  closeBtnText: { color: '#a0a0a0', fontSize: 14 },
});
