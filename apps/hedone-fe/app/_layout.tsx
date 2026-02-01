import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/auth';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient();

function NavigationTree() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const [mounted, setMounted] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const html = document.documentElement;
    const body = document.body;
    html.style.height = '100%';
    body.style.height = '100%';
    body.style.margin = '0';
    body.style.backgroundColor = '#1a1a2e';
    return () => {
      html.style.height = '';
      body.style.height = '';
      body.style.margin = '';
      body.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' && hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  if (Platform.OS === 'web' && !mounted) {
    return (
      <View style={styles.webPlaceholder}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.webPlaceholderText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <View style={styles.root}>
        <NavigationTree />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    ...(Platform.OS === 'web' && { minHeight: '100vh' as any }),
  },
  webPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' && { minHeight: '100vh' as any }),
  },
  webPlaceholderText: {
    color: '#a0a0a0',
    marginTop: 12,
    fontSize: 16,
  },
});
