import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Redirect } from 'expo-router';
import { useAuthStore, clearAuthStorage, selectIsAdmin } from '../../src/store/auth';
import { api } from '../../src/api/client';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = useAuthStore(selectIsAdmin);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Sincroniza user do store (login + /me) para name/email locais.
  useEffect(() => {
    if (user?.name != null) setName(user.name);
    if (user?.email != null) setEmail(user.email);
  }, [user?.id, user?.name, user?.email]);

  // Ao montar: termina loading; se nome vazio mas temos token, tenta /me uma vez para preencher (segunda chance).
  useEffect(() => {
    setLoadingProfile(false);
    if (!token) return;
    const current = useAuthStore.getState().user;
    const nameMissing = !(current?.name && current.name.trim());
    if (!nameMissing) return;
    api.users.me(token)
      .then((res) => {
        const u = res?.user;
        if (u && (u.id || u.email)) {
          useAuthStore.setState({ user: u });
          if (u.name != null) setName(u.name);
          if (u.email != null) setEmail(u.email);
        }
      })
      .catch(() => {});
  }, [token]);

  async function handleSave() {
    setError('');
    setSuccess('');
    if (name.trim() === user?.name && email.trim() === user?.email) {
      setEditMode(false);
      return;
    }
    if (!name.trim() || !email.trim()) {
      setError('Nome e e-mail são obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.users.updateMe(token!, { name: name.trim(), email: email.trim() });
      useAuthStore.setState({ user: res.user });
      setSuccess('Perfil atualizado.');
      setEditMode(false);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Erro ao salvar.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace('/(auth)/login');
  }

  async function handleClearCacheAndLogout() {
    // Navigate first so (app) tree can unmount before state clears; avoids "fewer hooks" during re-render.
    router.replace('/(auth)/login');
    await clearAuthStorage();
    logout();
  }

  const displayName = (user?.name ?? name ?? '').trim() || '—';
  const displayEmail = (user?.email ?? email ?? '').trim() || '—';

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[Perfil] Estado atual — user do store:', user, 'name:', name, 'email:', email, 'displayName:', displayName, 'displayEmail:', displayEmail);
  }

  if (!token) return <Redirect href="/(auth)/login" />;

  if (loadingProfile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isAdmin && (
        <View style={styles.adminSection}>
          <Text style={styles.adminTitle}>Admin</Text>
          <TouchableOpacity style={styles.adminLink} onPress={() => router.push('/artists' as any)}>
            <Text style={styles.adminLinkText}>Gerenciar artistas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adminLink} onPress={() => router.push('/stats' as any)}>
            <Text style={styles.adminLinkText}>Estatísticas</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Seus dados</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Nome</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor="#888"
              placeholder="Seu nome"
              editable={!loading}
            />
          ) : (
            <Text style={styles.value} numberOfLines={2}>{displayName}</Text>
          )}
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>E-mail</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#888"
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          ) : (
            <Text style={styles.value} numberOfLines={2}>{displayEmail}</Text>
          )}
        </View>
        {!editMode ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => { setEditMode(true); setName(displayName); setEmail(displayEmail); }}
            accessibilityLabel="Editar nome e e-mail"
          >
            <Ionicons name="pencil" size={20} color="#e94560" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {editMode && (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditMode(false); setName(user?.name ?? name); setEmail(user?.email ?? email); setError(''); }}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.changePasswordLink} onPress={() => router.push('/(app)/change-password' as any)}>
        <Ionicons name="lock-closed" size={20} color="#a0a0a0" />
        <Text style={styles.changePasswordText}>Alterar senha</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearCacheBtn} onPress={handleClearCacheAndLogout}>
        <Text style={styles.clearCacheText}>Limpar cache e sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#1a1a2e' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#a0a0a0', marginTop: 12, fontSize: 16 },
  adminSection: { marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  adminTitle: { color: '#e94560', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  adminLink: { paddingVertical: 8 },
  adminLinkText: { color: '#a0a0a0', fontSize: 15 },
  infoCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoCardTitle: { color: '#e94560', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  infoRow: { marginBottom: 16 },
  label: { color: '#a0a0a0', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
  value: { color: '#fff', fontSize: 17, paddingVertical: 4 },
  input: { backgroundColor: '#0f3460', borderRadius: 12, padding: 14, fontSize: 16, color: '#fff', marginTop: 4 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingVertical: 8 },
  editButtonText: { color: '#e94560', fontSize: 15, fontWeight: '600' },
  error: { color: '#e94560', marginTop: 8 },
  success: { color: '#4ade80', marginTop: 8 },
  button: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600' },
  cancelBtn: { alignItems: 'center', marginTop: 12 },
  cancelText: { color: '#a0a0a0' },
  changePasswordLink: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  changePasswordText: { color: '#a0a0a0', fontSize: 15 },
  logoutBtn: { marginTop: 16, alignItems: 'center' },
  logoutText: { color: '#a0a0a0' },
  clearCacheBtn: { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
  clearCacheText: { color: '#6b7280', fontSize: 13 },
});
