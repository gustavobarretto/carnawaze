import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, selectIsAdmin } from '../../src/store/auth';
import { api } from '../../src/api/client';

export default function StatsScreen() {
  const token = useAuthStore((s) => s.token)!;
  const isAdmin = useAuthStore(selectIsAdmin);

  const { data: usersData } = useQuery({ queryKey: ['stats-users'], queryFn: () => api.stats.usersCount(token), enabled: isAdmin });
  const { data: pinsData } = useQuery({ queryKey: ['stats-pins'], queryFn: () => api.stats.pinsByMinute(token), enabled: isAdmin });

  const totalUsers = usersData?.total ?? 0;
  const pinsByMinute = pinsData?.data ?? [];

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.accessDenied}>Acesso negado. Apenas administradores.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Total de usuários</Text>
        <Text style={styles.cardValue}>{totalUsers}</Text>
      </View>
      <Text style={styles.sectionTitle}>Pins por minuto (últimas 24h)</Text>
      <FlatList
        data={pinsByMinute}
        keyExtractor={(item) => item.minute}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowMinute}>{item.minute}</Text>
            <Text style={styles.rowCount}>{item.count}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#1a1a2e' },
  accessDenied: { color: '#a0a0a0', fontSize: 16, textAlign: 'center', marginTop: 48 },
  card: { backgroundColor: '#16213e', borderRadius: 16, padding: 24, marginBottom: 24 },
  cardLabel: { color: '#a0a0a0', fontSize: 14 },
  cardValue: { color: '#e94560', fontSize: 32, fontWeight: '700', marginTop: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#16213e', borderRadius: 8, marginBottom: 8 },
  rowMinute: { color: '#fff' },
  rowCount: { color: '#e94560', fontWeight: '600' },
});
