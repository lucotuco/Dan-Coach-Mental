import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, View, useThemeColor } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import RecordingButton from '@/components/AudioRecorderButton';
import { useAuth } from '@/components/AuthContext';
import { getStoredToken, isUnauthorizedStatus, redirectToLogin } from '@/components/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function WelcomeDreamScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [writing, setWriting] = useState(false);
  const [dream, setDream] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'texto' | 'audio' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const backgroundColor = useThemeColor({ light: '#f8fafc', dark: '#0b1026' }, 'background');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#0f172a' }, 'background');
  const primaryText = useThemeColor({ light: '#0b164c', dark: '#e5e9ff' }, 'text');
  const secondaryText = useThemeColor({ light: '#4b5563', dark: '#a6aac4' }, 'text');
  const accent = '#d5e7fb';

  const goHome = () => router.replace('/(tabs)/homePage');

  // --- API CALLS ---

  const sendTextMeta = async () => {
    const body = { texto: dream };

    const token = getStoredToken();

    if (!token) {
      redirectToLogin(router, logout);
      throw new Error('Sesión expirada');
    }

    const res = await fetch(`${API_URL}/api/users/metaTexto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (isUnauthorizedStatus(res.status)) {
      redirectToLogin(router, logout);
      throw new Error('Sesión expirada');
    }

    if (!res.ok) {
      throw new Error('Error al guardar meta de texto');
    }
  };

  const sendAudioMeta = async () => {
    if (!audioUri) return;

    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      name: 'meta.m4a',
      type: 'audio/m4a',
    } as any);

    const token = getStoredToken();

    if (!token) {
      redirectToLogin(router, logout);
      throw new Error('Sesión expirada');
    }

    const res = await fetch(`${API_URL}/api/users/metaAudio`, {
      method: 'POST',
      headers: {
        // NO pongas 'Content-Type', RN lo arma solo
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (isUnauthorizedStatus(res.status)) {
      redirectToLogin(router, logout);
      throw new Error('Sesión expirada');
    }

    if (!res.ok) {
      throw new Error('Error al guardar meta de audio');
    }
  };

  // --- HANDLERS ---

  const handleContinue = async () => {
    try {
      setErrorMsg('');
      if (loading) return;
      setLoading(true);

      // Si no eligió ni texto ni audio → podés dejar pasar o exigir algo
      if (!inputMode) {
        // acá podés simplemente ir al home sin guardar nada:
        // return goHome();
        setErrorMsg('Contame tu sueño por texto o audio antes de continuar.');
        return;
      }

      if (inputMode === 'texto') {
        if (!dream.trim()) {
          setErrorMsg('Escribí tu sueño o elegí grabarlo por audio.');
          return;
        }
        await sendTextMeta();
      }

      if (inputMode === 'audio') {
        if (!audioUri) {
          setErrorMsg('Grabá tu mensaje antes de continuar.');
          return;
        }
        await sendAudioMeta();
      }

      goHome();
    } catch (err) {
      console.error(err);
      setErrorMsg('Hubo un problema al guardar tu sueño. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWrite = () => {
    // El usuario elige texto → anulamos cualquier audio previo
    setInputMode('texto');
    setAudioUri(null);
    setWriting(true);
  };

  const handleRecordingFinished = (uri: string) => {
    // El usuario eligió audio → anulamos el texto escrito
    setInputMode('audio');
    setAudioUri(uri);
    setDream('');
  };

  const handleSendTextAndClose = () => {
    // Sólo cerramos el modal; el envío real se hace en "Continuar"
    if (!dream.trim()) return;
    setWriting(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MedioLogo />

        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.title, { color: primaryText }]}>
            Hola, soy DAN, tu Coach Mental Deportivo.
          </Text>
          <Text style={[styles.subtitle, { color: secondaryText }]}>
            Estoy acá para entrenar tu mente y acompañarte en tu camino hacia la cima deportiva.
          </Text>
        </View>

        <View style={[styles.questionCard, { backgroundColor: '#f0f6ff' }]}>
          <Text style={[styles.question, { color: primaryText }]}>
            Decime, ¿cuál es tu sueño como deportista?
          </Text>

          <View style={[styles.recordingCard, { backgroundColor: accent }]}>
            <RecordingButton
              onRecordingComplete={()=>{handleRecordingFinished}}
            />
            <View style={styles.recordingTextContainer}>
              <Text style={[styles.recordLabel, { color: primaryText }]}>Grabar mensaje</Text>
              <Text style={[styles.recordHint, { color: secondaryText }]}>
                Contame con tus palabras y luego iremos al inicio.
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.writeButton,
              { borderColor: primaryText, opacity: inputMode === 'audio' ? 0.4 : 1 },
            ]}
            onPress={handleOpenWrite}
            disabled={inputMode === 'audio'}
          >
            <Text style={[styles.writeButtonText, { color: primaryText }]}>Escribir</Text>
          </Pressable>

          {errorMsg ? (
            <Text style={{ color: 'red', marginTop: 8, fontSize: 13 }}>
              {errorMsg}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={handleContinue}
          style={[
            styles.writeButton,
            { backgroundColor: primaryText, opacity: loading ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.skipText, { color: '#fff' }]}>
            {loading ? 'Guardando...' : 'Continuar'}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={writing}
        transparent
        animationType="fade"
        onRequestClose={() => setWriting(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setWriting(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: cardColor }]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: primaryText }]}>Escribí tu sueño</Text>
            <TextInput
              value={dream}
              onChangeText={(text) => {
                setDream(text);
                setInputMode('texto');
              }}
              placeholder="Quiero llegar a..."
              placeholderTextColor={secondaryText}
              multiline
              style={[
                styles.textArea,
                { color: primaryText, borderColor: accent },
              ]}
            />

            <Pressable
              style={[styles.primaryButton, { backgroundColor: primaryText }]}
              onPress={handleSendTextAndClose}
            >
              <Text style={styles.primaryButtonText}>Listo</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, { borderColor: secondaryText }]}
              onPress={() => setWriting(false)}
            >
              <Text style={[styles.secondaryButtonText, { color: secondaryText }]}>
                Cancelar
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 20,
    paddingBottom: 48,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  questionCard: {
    borderRadius: 24,
    padding: 18,
    gap: 16,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
  },
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 14,
  },
  recordingTextContainer: {
    flex: 1,
    gap: 4,
  },
  recordLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  recordHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  writeButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  writeButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  skipLink: {
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#f9fbff',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
});