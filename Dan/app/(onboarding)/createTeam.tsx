import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View as RNView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, useThemeColor } from '@/components/Themed';
import { useAuth } from '@/components/AuthContext';
function Field({
  icon,
  placeholder,
  value,
  onChangeText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  const mutedColor = useThemeColor({ light: '#6c728a', dark: '#a6aac4' }, 'text');
  const inputTextColor = useThemeColor({ light: '#1f2937', dark: '#f0f4ff' }, 'text');

  return (
    <RNView style={[styles.inputWrapper, { borderColor: mutedColor }]}>
      <Ionicons name={icon} size={20} color={mutedColor} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { color: inputTextColor }]}
        placeholder={placeholder}
        placeholderTextColor={mutedColor}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="characters"
      />
    </RNView>
  );
}
export default function CreateTeam() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();

  const { token, setUserData } = useAuth();

  const [name, setName] = useState('');
    const [joinCode, setJoinCode] = useState('');
      const [type, setType] = useState('');

  const handleJoinCode = async () => {
    if (!joinCode) {
      alert('Por favor ingresá un código de equipo');
      return;
    }
     if (!name) {
      alert('Por favor ingresá un nombre de equipo');
      return;
    }
    if (!API_URL) {
      alert('Falta EXPO_PUBLIC_API_URL');
      return;
    }
    if (!token) {
      alert('Sesión inválida. Volvé a iniciar sesión.');
      router.replace('/');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/teams/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, joinCode, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error ?? `Error (${response.status})`);
        return;
      }

      const meRes = await fetch(`${API_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const meData = await meRes.json();
      if (!meRes.ok) {
        alert(meData?.error ?? 'No se pudo actualizar el usuario');
        return;
      }

      setUserData(meData);

      router.replace('/gate');
    } catch (error) {
      console.error('Error al crear el equipo:', error);
      alert('Error de conexión con el servidor');
    }
  };
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Create Team (placeholder)</Text>
      <Field
        icon="key"
        placeholder="Nombre de equipo"
        value={name}
        onChangeText={setName}
      />
      <Field
        icon="key"
        placeholder="Clavo de equipo"
        value={joinCode}
        onChangeText={setJoinCode}
      />
      <Field
        icon="key"
        placeholder="Tipo de equipo (opcional)"
        value={type}
        onChangeText={setType}
      />
      <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleJoinCode}>
              <Text style={styles.primaryButtonText}>Crear equipo</Text>
            </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },

  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
    maxWidth: 480,
  },
  primaryButton: { backgroundColor: '#102d64' },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
    maxWidth: 480,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 2 },
  inputIcon: { marginRight: 12 },
});