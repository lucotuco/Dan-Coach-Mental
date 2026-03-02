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

export default function JoinTeam() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();

  const { token, setUserData } = useAuth();

  const [joinCode, setJoinCode] = useState('');

  const handleJoinCode = async () => {
    const code = joinCode.trim();
    if (!code) {
      alert('Por favor ingresá un código de equipo');
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
      // 1) Join
      const response = await fetch(`${API_URL}/api/teams/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ joinCode: code }),
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
      console.error('Error al ingresar al equipo:', error);
      alert('Error de conexión con el servidor');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{ marginBottom: 12 }}>Unirse a un equipo</Text>

      <Field
        icon="key"
        placeholder="Código de equipo"
        value={joinCode}
        onChangeText={setJoinCode}
      />

      <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleJoinCode}>
        <Text style={styles.primaryButtonText}>UNIRME</Text>
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