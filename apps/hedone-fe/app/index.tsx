import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth';

export default function Index() {
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }
  if (token && user?.emailConfirmedAt) return <Redirect href="/(app)/map" />;
  if (token && user && !user.emailConfirmedAt) {
    return <Redirect href={{ pathname: '/(auth)/confirm-email', params: { email: user.email ?? '' } }} />;
  }
  if (token) return <Redirect href="/(app)/map" />;
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    ...(Platform.OS === 'web' && { minHeight: '100vh' as any }),
  },
  loadingText: {
    color: '#a0a0a0',
    marginTop: 12,
    fontSize: 16,
  },
});
