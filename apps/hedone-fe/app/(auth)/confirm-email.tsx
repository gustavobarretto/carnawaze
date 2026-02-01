import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../src/api/client';
import { useAuthStore } from '../../src/store/auth';

export default function ConfirmEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? '';
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  async function handleConfirm() {
    setError('');
    if (!code.trim()) {
      setError('Informe o código recebido por e-mail.');
      return;
    }
    setLoading(true);
    try {
      await api.auth.confirmEmail({ token: code.trim() });
      setSuccess(true);
      if (token) {
        const out = await api.users.me(token);
        const u = (out as { user?: { id: string; email?: string; name?: string; role?: string; emailConfirmedAt?: string | null } }).user;
        if (u) {
          setAuth(
            {
              id: u.id,
              email: u.email ?? email,
              name: u.name ?? '',
              role: u.role ?? 'user',
              emailConfirmedAt: u.emailConfirmedAt ?? null,
            },
            token
          );
        }
        router.replace('/(app)/map' as any);
      } else {
        router.replace('/(auth)/login' as any);
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Código inválido ou expirado.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email.trim()) {
      setError('E-mail não informado.');
      return;
    }
    setResendMessage('');
    setError('');
    setResending(true);
    try {
      await api.auth.resendConfirmation({ email: email.trim() });
      setResendMessage('Novo código enviado. Verifique seu e-mail.');
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Erro ao reenviar.';
      setError(msg);
    } finally {
      setResending(false);
    }
  }

  if (success && !token) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.successTitle}>E-mail confirmado</Text>
          <Text style={styles.successText}>Faça login para continuar.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Confirmar e-mail</Text>
        <Text style={styles.subtitle}>
          Digite o código de 6 caracteres que enviamos para {email || 'seu e-mail'}. Válido por 10 minutos.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Código"
          placeholderTextColor="#888"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loading}
          maxLength={6}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {resendMessage ? <Text style={styles.resendSuccess}>{resendMessage}</Text> : null}
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleConfirm} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirmar</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={resending || !email.trim()}>
          <Text style={styles.resendText}>{resending ? 'Enviando...' : 'Reenviar código'}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#a0a0a0', marginBottom: 24 },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  error: { color: '#e94560', fontSize: 14, marginBottom: 12 },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#4ade80', marginBottom: 8 },
  successText: { fontSize: 14, color: '#a0a0a0' },
  resendBtn: { marginTop: 16, alignItems: 'center' },
  resendText: { color: '#a0a0a0', fontSize: 14 },
  resendSuccess: { color: '#4ade80', fontSize: 13, marginTop: 8, textAlign: 'center' },
});
