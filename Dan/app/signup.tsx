import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MedioLogo from '@/components/MedioLogo';
import { Text, View, useThemeColor } from '@/components/Themed';
import { useAuth } from '@/components/AuthContext';
import { getStoredToken, isUnauthorizedStatus, redirectToLogin } from '@/components/AuthContext';

function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  returnKeyType = 'done',
  
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  returnKeyType?: 'done' | 'next' | 'go';
  
}) {
  const mutedColor = useThemeColor({ light: '#6c728a', dark: '#a6aac4' }, 'text');
  const inputTextColor = useThemeColor({ light: '#1f2937', dark: '#f0f4ff' }, 'text');

   return (
    <View style={[styles.inputWrapper, { borderColor: mutedColor }]}>
      <Ionicons name={icon} size={20} color={mutedColor} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { color: inputTextColor }]}
        placeholder={placeholder}
        placeholderTextColor={mutedColor}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        returnKeyType={returnKeyType}
      />
    </View>
  );
}

export default function SignupScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const { login } = useAuth();
  const [name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const mutedColor = useThemeColor({ light: '#6c728a', dark: '#a6aac4' }, 'text');
  const handleSignup = async () => {
  if (!name || !email || !phone || !password || !confirmPassword) {
    alert('Por favor completá todos los campos');
    return;
  }

  if (password !== confirmPassword) {
    alert('Las contraseñas no coinciden');
    return;
  }

  try {
    const token = getStoredToken();

    const response = await fetch(API_URL + '/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, phone, password }),
    });

    const data = await response.json();

    if (isUnauthorizedStatus(response.status)) {
      redirectToLogin(router);
      return;
    }

    if (!response.ok) {
      if (response.status === 409) {
        alert('Error: ' + data.message);
      } else if (response.status === 400) {
        alert('Error: ' + data.message);
        console.log('Campos que faltan:', data.missingFields);
      } else {
        console.log('Error desde el backend:', data);
        alert('Ocurrió un error creando el usuario');
      }
      return;
    }

    console.log('Usuario creado OK:', data);
    login(data.user);
     router.replace('/cargarInfo');
  } catch (error) {
    console.error('Error al crear el usuario (fetch):', error);
    alert('Error de conexión con el servidor');
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    > 
      <ScrollView  keyboardShouldPersistTaps="handled"style={{backgroundColor:'#fff'}}>
        <View style={styles.container}>
        <MedioLogo/>
        <View style={styles.card}>
          <View style={styles.formFields}>
            <Field
              icon="person"
              placeholder="Nombre y apellido"
              value={name}
              onChangeText={setFullName}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <Field
              icon="mail"
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              icon="call"
              placeholder="Teléfono"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <Field
              icon="lock-closed"
              placeholder="Contraseña"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Field
              icon="lock-closed"
              placeholder="Repetir contraseña"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSignup}
          >
            <Text style={styles.primaryButtonText}>CREAR CUENTA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.secondaryButtonText}>INICIAR SESIÓN</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgotText}>¿OLVIDASTE TU CONTRASEÑA?</Text>
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
    backgroundColor: '#f8f1eb',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#00000015',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'stretch',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 56,
    fontWeight: '900',
    color: '#c4252c',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#1c1c24',
    fontWeight: '800',
    letterSpacing: 1,
  },
  formFields: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 2,
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#102d64',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#102d64',
  },
  secondaryButtonText: {
    color: '#102d64',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  forgotText: {
    marginTop: 24,
    textAlign: 'center',
    color: '#3f3f46',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});