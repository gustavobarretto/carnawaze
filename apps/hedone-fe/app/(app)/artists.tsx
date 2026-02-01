import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, selectIsAdmin } from '../../src/store/auth';
import { api } from '../../src/api/client';

export default function ArtistsScreen() {
  const token = useAuthStore((s) => s.token)!;
  const isAdmin = useAuthStore(selectIsAdmin);
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['artists-list', page],
    queryFn: () => api.artists.list(token, page, 20),
    enabled: isAdmin,
  });
  const createArtist = useMutation({
    mutationFn: (name: string) => api.artists.create(token, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists-list'] });
      setNewName('');
    },
  });
  const deleteArtist = useMutation({
    mutationFn: (id: string) => api.artists.delete(token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['artists-list'] }),
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.accessDenied}>Acesso negado. Apenas administradores.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Nome do artista"
          placeholderTextColor="#888"
          value={newName}
          onChangeText={setNewName}
          editable={!createArtist.isPending}
        />
        <TouchableOpacity
          style={[styles.addBtn, (!newName.trim() || createArtist.isPending) && styles.addBtnDisabled]}
          onPress={() => newName.trim() && createArtist.mutate(newName.trim())}
          disabled={!newName.trim() || createArtist.isPending}
        >
          {createArtist.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addBtnText}>Adicionar</Text>}
        </TouchableOpacity>
      </View>
      {createArtist.isError && <Text style={styles.error}>Erro ao criar artista.</Text>}
      {isLoading ? (
        <ActivityIndicator color="#e94560" style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.artistName}>{item.name}</Text>
              <TouchableOpacity onPress={() => deleteArtist.mutate(item.id)} disabled={deleteArtist.isPending}>
                <Text style={styles.deleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      <View style={styles.pagination}>
        <TouchableOpacity style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]} onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          <Text style={styles.pageBtnText}>Anterior</Text>
        </TouchableOpacity>
        <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
        <TouchableOpacity style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]} onPress={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
          <Text style={styles.pageBtnText}>Próxima</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#1a1a2e' },
  accessDenied: { color: '#a0a0a0', fontSize: 16, textAlign: 'center', marginTop: 48 },
  addRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  input: { flex: 1, backgroundColor: '#16213e', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16 },
  addBtn: { backgroundColor: '#e94560', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  error: { color: '#e94560', marginBottom: 12 },
  loader: { marginTop: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#16213e', borderRadius: 12, marginBottom: 8 },
  artistName: { color: '#fff', fontSize: 16 },
  deleteText: { color: '#e94560', fontSize: 14 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 },
  pageBtn: { padding: 12 },
  pageBtnDisabled: { opacity: 0.5 },
  pageBtnText: { color: '#e94560' },
  pageInfo: { color: '#a0a0a0' },
});
