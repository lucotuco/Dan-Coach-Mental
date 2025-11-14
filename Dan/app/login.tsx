import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';

import MedioLogo from '@/components/MedioLogo';
import { Text, View, useThemeColor } from '@/components/Themed';
import { login } from '@/services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const backgroundColor = useThemeColor({ light: '#f5f6fa', dark: '#0b1026' }, 'background');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#141b33' }, 'background');
  const textColor = useThemeColor({ light: '#031355', dark: '#e5e9ff' }, 'tint');
  const mutedColor = useThemeColor({ light: '#6c728a', dark: '#a6aac4' }, 'text');
  const inputTextColor = useThemeColor({ light: '#1f2937', dark: '#f0f4ff' }, 'text');
  const errorColor = useThemeColor({ light: '#c53030', dark: '#f97066' }, 'text');

  const handleLogin = async () => {
    if (isSubmitting) return;

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, ingresa tu correo electrónico y contraseña.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado. Intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
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
              onChangeText={(value) => {
                setEmail(value);
                if (errorMessage) {
                  setErrorMessage(null);
                }
              }}
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
              onChangeText={(value) => {
                setPassword(value);
                if (errorMessage) {
                  setErrorMessage(null);
                }
              }}
              secureTextEntry
              textContentType="password"
            />
          </View>

          {errorMessage ? (
            <View style={[styles.errorContainer, { borderColor: errorColor, backgroundColor: `${errorColor}20` }]}>
              <Text style={[styles.errorText, { color: errorColor }]}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: textColor, opacity: isSubmitting ? 0.7 : 1 },
            ]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={[styles.secondaryButtonText, { color: textColor }]}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
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
  },
  logoWrapper: {
    alignItems: 'center',
  },
  card: {
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
  errorContainer: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
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
