import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { api } from '../../src/api/client';

export default function LoginScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.login({ email: email.trim(), password });
      console.log('[Login] Resposta do endpoint /v1/auth/login:', res);
      const u = res.user as { id: string; email?: string; name?: string; role?: string; emailConfirmedAt?: string | null };
      const isAdminEmail = email.trim().toLowerCase() === 'admin@carnawaze.local';
      const userToStore = {
        id: u.id,
        email: u.email ?? email.trim(),
        name: u.name ?? (isAdminEmail ? 'Admin' : ''),
        role: u.role ?? (isAdminEmail ? 'admin' : 'user'),
        emailConfirmedAt: u.emailConfirmedAt ?? null,
      };
      console.log('[Login] Objeto user que será salvo no store:', userToStore);
      setAuth(userToStore, res.token);
      router.replace('/(app)/map' as any);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === 'EMAIL_NOT_CONFIRMED') {
        router.replace({ pathname: '/(auth)/confirm-email', params: { email: email.trim() } } as any);
        return;
      }
      const msg = err?.message ?? 'Erro ao entrar.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Carnawaze</Text>
        <Text style={styles.subtitle}>Trios elétricos no Carnaval de Salvador</Text>
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          editable={!loading}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </TouchableOpacity>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={styles.linkText}>Criar conta</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e94560',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  error: {
    color: '#e94560',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#a0a0a0', fontSize: 14 },
});
