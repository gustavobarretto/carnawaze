import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { api } from '../../src/api/client';

export default function ChangePasswordScreen() {
  const token = useAuthStore((s) => s.token)!;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError('');
    setSuccess('');
    if (!currentPassword.trim()) {
      setError('Informe a senha atual.');
      return;
    }
    if (!newPassword.trim()) {
      setError('Informe a nova senha.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A nova senha e a confirmação não conferem.');
      return;
    }
    setLoading(true);
    try {
      await api.users.updateMe(token, {
        password: newPassword,
        currentPassword: currentPassword.trim(),
      });
      setSuccess('Senha alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Erro ao alterar senha.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Senha atual</Text>
      <TextInput
        style={styles.input}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder="Senha atual"
        placeholderTextColor="#888"
        secureTextEntry
        editable={!loading}
      />
      <Text style={styles.label}>Nova senha</Text>
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Nova senha (mín. 6)"
        placeholderTextColor="#888"
        secureTextEntry
        editable={!loading}
      />
      <Text style={styles.label}>Confirmar nova senha</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Repita a nova senha"
        placeholderTextColor="#888"
        secureTextEntry
        editable={!loading}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Alterar senha</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(app)/profile' as any)}>
        <Text style={styles.backText}>Voltar ao perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#1a1a2e' },
  label: { color: '#a0a0a0', fontSize: 14, marginBottom: 4, marginTop: 12 },
  input: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, fontSize: 16, color: '#fff', marginBottom: 4 },
  error: { color: '#e94560', marginTop: 8 },
  success: { color: '#4ade80', marginTop: 8 },
  button: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600' },
  backBtn: { marginTop: 16, alignItems: 'center' },
  backText: { color: '#a0a0a0' },
});
