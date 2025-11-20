import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import MedioLogo from '@/components/MedioLogo';
import { Text, View, useThemeColor } from '@/components/Themed';
import { useAuth } from '@/components/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
   const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#0b1026' }, 'background');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#141b33' }, 'background');
  const textColor = useThemeColor({ light: '#031355', dark: '#e5e9ff' }, 'tint');
  const mutedColor = useThemeColor({ light: '#6c728a', dark: '#a6aac4' }, 'text');
  const inputTextColor = useThemeColor({ light: '#1f2937', dark: '#f0f4ff' }, 'text');

  const handleLogin = async () => {
    try {
      const response = await fetch(API_URL + '/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Error al iniciar sesión');
        return;
      }

      // 👇 Acá guardamos el user en el contexto
      login(data.user);

      // y te mando a la home (ajustá la ruta a la tuya)
      router.replace('/(tabs)/homePage');
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error de conexión con el servidor');
    }
  };

  const handleCreateAccount = () => {
    router.push('/signup');
  };


  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <ScrollView
      keyboardShouldPersistTaps="handled"
       scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor }}
    >
      <View style={styles.container}>
        <View style={styles.logoWrapper}>
          <MedioLogo />
        </View>

        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.title, { color: textColor }]}>Bienvenido de vuelta</Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>Inicia sesión para continuar con tu acompañamiento.</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: mutedColor }]}>Correo electrónico</Text>
            <TextInput
              style={[styles.input, { borderColor: mutedColor, color: inputTextColor }]}
              placeholder="nombre@correo.com"
              placeholderTextColor={mutedColor}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: mutedColor }]}>Contraseña</Text>
            <TextInput
              style={[styles.input, { borderColor: mutedColor, color: inputTextColor }]}
              placeholder="Tu contraseña"
              placeholderTextColor={mutedColor}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />
          </View>

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: textColor }]} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#fff', borderColor: textColor, borderWidth: 2 }]} onPress={handleCreateAccount}>
            <Text style={[styles.secondaryButtonText, { fontSize: 16, color: textColor }]}>Crear cuenta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={[styles.secondaryButtonText, { color: textColor }]}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
</KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 32,
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    padding: 24,
    gap: 20,
    shadowColor: '#00000020',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});