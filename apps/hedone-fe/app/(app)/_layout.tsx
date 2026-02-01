import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, selectIsAdmin, ADMIN_EMAIL } from '../../src/store/auth';
import { api } from '../../src/api/client';

export default function AppLayout() {
  const isAdminUser = useAuthStore(selectIsAdmin);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    // Pequeno delay para o store estar estável após login (evita race com persist/render).
    const t = setTimeout(() => {
      api.users.me(token)
        .then((res) => {
          const u = res?.user;
          // Só atualiza o store se /me retornar usuário com dados (evita sobrescrever com {}).
          if (u && (u.id || u.email)) {
            const email = (u.email ?? '').toLowerCase();
            const role = (u.role ?? '').toLowerCase();
            const isAdmin = email === ADMIN_EMAIL || role === 'admin';
            useAuthStore.setState({ user: u, isAdminUser: isAdmin });
          }
        })
        .catch(() => {});
    }, 150);
    return () => clearTimeout(t);
  }, [token]);

  return (
    <Tabs
      key={`tabs-${isAdminUser}`}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#1a1a2e' },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#a0a0a0',
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="artists"
        options={{
          href: isAdminUser ? '/artists' : null,
          title: 'Artistas',
          tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          href: isAdminUser ? '/stats' : null,
          title: 'Estatísticas',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="change-password"
        options={{
          href: null,
          title: 'Alterar senha',
        }}
      />
    </Tabs>
  );
}
