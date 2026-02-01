import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../../src/api/client';

export default function ConfirmEmailScreen() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setError('');
    if (!token.trim()) {
      setError('Informe o código recebido por e-mail.');
      return;
    }
    setLoading(true);
    try {
      await api.auth.confirmEmail({ token: token.trim() });
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Código inválido ou expirado.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.successTitle}>E-mail confirmado</Text>
          <Text style={styles.successText}>Você já pode usar o app normalmente.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Confirmar e-mail</Text>
        <Text style={styles.subtitle}>Digite o código que enviamos para seu e-mail.</Text>
        <TextInput
          style={styles.input}
          placeholder="Código"
          placeholderTextColor="#888"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          editable={!loading}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleConfirm} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirmar</Text>}
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
});
