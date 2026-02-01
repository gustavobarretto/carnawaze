import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, TextInput, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useAuthStore, selectIsAdmin } from '../../src/store/auth';
import { api } from '../../src/api/client';
import MapViewComponent from '../../src/components/MapView';

const FAROL_DA_BARRA = {
  latitude: -13.0097,
  longitude: -38.5317,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

const ZOOMED_DELTA = 0.005;

export default function MapScreen() {
  const token = useAuthStore((s) => s.token)!;
  const isAdmin = useAuthStore(selectIsAdmin);
  const queryClient = useQueryClient();
  const [initialRegion, setInitialRegion] = useState(FAROL_DA_BARRA);
  const [addPinMode, setAddPinMode] = useState(false);
  const [pendingCoord, setPendingCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [artistSearch, setArtistSearch] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setInitialRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: ZOOMED_DELTA,
          longitudeDelta: ZOOMED_DELTA,
        });
      } catch {
        // keep Farol da Barra with zoom
      }
    })();
  }, []);

  const { data: pinsData } = useQuery({ queryKey: ['pins'], queryFn: () => api.pins.list(token) });
  const pins = pinsData?.pins ?? [];

  const { data: artistSearchData, isLoading: searchingArtists } = useQuery({
    queryKey: ['artists-search', artistSearch],
    queryFn: () => api.artists.search(token, artistSearch),
    enabled: pendingCoord != null,
  });
  const artists = artistSearchData?.artists ?? [];

  const createPin = useMutation({
    mutationFn: (body: { artistId: string; lat: number; lng: number; type: 'create' | 'confirm' }) =>
      api.pins.createOrConfirm(token, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pins'] });
      setPendingCoord(null);
      setAddPinMode(false);
      setArtistSearch('');
    },
    onError: (e: unknown) => {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Erro ao criar pin.';
      Alert.alert('Erro', msg);
    },
  });

  function handleMapPress(coordinate: { latitude: number; longitude: number }) {
    if (addPinMode) setPendingCoord(coordinate);
  }

  function handleConfirmPin(pin: { id: string; artistId: string; artist: { id: string; name: string }; lat: number; lng: number }) {
    createPin.mutate({ artistId: pin.artistId, lat: pin.lat, lng: pin.lng, type: 'confirm' });
  }

  const reportIncorrect = useMutation({
    mutationFn: (pin: { artistId: string; lat: number; lng: number }) =>
      api.pins.reportIncorrect(token, { artistId: pin.artistId, lat: pin.lat, lng: pin.lng }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pins'] }),
    onError: (e: unknown) => {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Erro ao reportar.';
      Alert.alert('Erro', msg);
    },
  });

  const deletePin = useMutation({
    mutationFn: (pinId: string) => api.pins.delete(token, pinId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pins'] }),
    onError: (e: unknown) => {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Erro ao remover pin.';
      Alert.alert('Erro', msg);
    },
  });

  function handleReportIncorrect(pin: { artistId: string; lat: number; lng: number }) {
    reportIncorrect.mutate(pin);
  }

  function handleRemovePin(pin: { id: string }) {
    deletePin.mutate(pin.id);
  }

  function handleSelectArtistForNewPin(artistId: string) {
    if (!pendingCoord) return;
    createPin.mutate({
      artistId,
      lat: pendingCoord.latitude,
      lng: pendingCoord.longitude,
      type: 'create',
    });
  }

  function closeArtistModal() {
    setPendingCoord(null);
    setArtistSearch('');
  }

  return (
    <View style={styles.container}>
      <MapViewComponent
        pins={pins}
        initialRegion={initialRegion}
        onMapPress={addPinMode ? handleMapPress : undefined}
        onConfirmPin={handleConfirmPin}
        onReportIncorrect={handleReportIncorrect}
        onRemovePin={isAdmin ? handleRemovePin : undefined}
        isAdmin={isAdmin}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddPinMode((v) => !v)}
        accessibilityLabel={addPinMode ? 'Cancelar adicionar pin' : 'Adicionar pin do trio'}
      >
        <Ionicons name={addPinMode ? 'close' : 'add'} size={28} color="#fff" />
      </TouchableOpacity>
      {addPinMode && (
        <Text style={styles.fabHint}>Toque no mapa para escolher o local</Text>
      )}

      <Modal visible={pendingCoord != null} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeArtistModal}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Escolha o artista</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar artista..."
              placeholderTextColor="#888"
              value={artistSearch}
              onChangeText={setArtistSearch}
              autoFocus
            />
            {searchingArtists ? (
              <ActivityIndicator color="#e94560" style={styles.modalLoader} />
            ) : (
              <FlatList
                data={artists}
                keyExtractor={(item) => item.id}
                style={styles.artistList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.artistRow}
                    onPress={() => handleSelectArtistForNewPin(item.id)}
                    disabled={createPin.isPending}
                  >
                    <Text style={styles.artistName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  artistSearch.length >= 1 ? (
                    <Text style={styles.emptySearch}>Nenhum artista encontrado</Text>
                  ) : (
                    <Text style={styles.emptySearch}>Digite para buscar artistas</Text>
                  )
                }
              />
            )}
            <TouchableOpacity style={styles.cancelModalBtn} onPress={closeArtistModal}>
              <Text style={styles.cancelModalText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ android: { elevation: 4 }, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 } }),
  },
  fabHint: {
    position: 'absolute',
    bottom: 165,
    alignSelf: 'center',
    color: '#e94560',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  searchInput: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  modalLoader: { padding: 24 },
  artistList: { maxHeight: 280 },
  artistRow: { paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  artistName: { color: '#fff', fontSize: 16 },
  emptySearch: { color: '#a0a0a0', textAlign: 'center', padding: 24 },
  cancelModalBtn: { marginTop: 16, alignItems: 'center' },
  cancelModalText: { color: '#a0a0a0', fontSize: 16 },
});
