import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import { useAuth } from '@/components/AuthContext';
import DanVoiceCall from '@/components/DanVoiceCall';

const CHAT_ENDPOINT = '/api/dan/chat';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function CoachVirtualScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { user, isAuthenticated, logout } = useAuth();

  const trimmedQuestion = useMemo(() => question.trim(), [question]);

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleDismissKeyboard =
    Platform.OS === 'web' ? undefined : Keyboard.dismiss;

  const sendMessage = async () => {
    if (!API_URL) {
      alert('Falta configurar la URL del servidor (EXPO_PUBLIC_API_URL).');
      return;
    }

    if (!trimmedQuestion) {
      return;
    }

    const newMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmedQuestion,
    };

    setMessages((prev) => [...prev, newMessage]);
    setQuestion('');
    setLoading(true);
    scrollToEnd();

    try {
      const response = await fetch(`${API_URL}${CHAT_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          userId: user?._id,
          message: trimmedQuestion,
        }),
      });

      const contentType = response.headers.get('content-type');
      const rawBody = await response.text();
      const data = contentType?.includes('application/json')
        ? JSON.parse(rawBody)
        : { message: rawBody };

      if (!response.ok) {
        throw new Error(
          data.message || 'No se pudo obtener una respuesta del coach.',
        );
      }

      const answer: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content:
          data.reply ||
          data.response ||
          data.message ||
          'No pude generar una respuesta en este momento.',
      };

      setMessages((prev) => [...prev, answer]);
      scrollToEnd();
    } catch (error: any) {
      console.error('Error al consultar al coach virtual:', error);
      alert(error?.message || 'Error al conectar con el coach virtual.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback
        onPress={handleDismissKeyboard}
        accessible={false}
      >
        <View style={styles.container}>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="never"
          >
            <View style={{ marginTop: 4 }}>
              <MedioLogo />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Coach Virtual</Text>
              <Text style={styles.subtitle}>
                Pregúntale lo que quieras a DAN por texto o mantené una charla
                en tiempo real por voz.
              </Text>
            </View>

            {/* BLOQUE DE CHAT TEXTO */}
            <View style={styles.chatWrapper}>
              {messages.length === 0 && !loading ? (
                <Text style={styles.emptyText}>
                  Aún no hay mensajes. Escribe tu consulta para iniciar la
                  conversación.
                </Text>
              ) : (
                messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.message,
                      msg.role === 'user'
                        ? styles.userMessage
                        : styles.assistantMessage,
                    ]}
                  >
                    <Text style={styles.messageRole}>
                      {msg.role === 'user' ? 'Tú' : 'Coach DAN'}
                    </Text>
                    <Text style={styles.messageText}>{msg.content}</Text>
                  </View>
                ))
              )}

              {loading && (
                <View style={[styles.message, styles.assistantMessage]}>
                  <Text style={styles.messageRole}>Coach DAN</Text>
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#0f1b4c" />
                    <Text style={[styles.messageText, styles.loadingText]}>
                      Pensando...
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
          <View style={styles.voiceSection}>
            <Text style={styles.voiceTitle}>Hablar con DAN por llamada</Text>
            <Text style={styles.voiceSubtitle}>
              Abrí el módulo de llamada para charlar por voz con DAN en tiempo real.
            </Text>
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={() => setIsVoiceModalVisible(true)}
            >
              <Feather name="phone-call" size={18} color="#fff" />
              <Text style={styles.voiceButtonText}>Iniciar llamada de voz</Text>
            </TouchableOpacity>
          </View>

          <Modal
            visible={isVoiceModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setIsVoiceModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Llamada con DAN</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setIsVoiceModalVisible(false)}
                  >
                    <Feather name="x" size={20} color="#0f1b4c" />
                  </TouchableOpacity>
                </View>
                <DanVoiceCall />
              </View>
            </View>
          </Modal>

          {/* INPUT TEXTO */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu pregunta"
              placeholderTextColor="#8a90a8"
              value={question}
              onChangeText={setQuestion}
              multiline
              maxLength={500}
              editable={!loading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!trimmedQuestion || loading) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!trimmedQuestion || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Feather name="send" size={18} color="#fff" />
              )}
              <Text style={styles.sendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f1b4c',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2b6c',
  },
  chatWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#0f1b4c0d',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#7a80a0',
    fontSize: 14,
  },
  message: {
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  userMessage: {
    backgroundColor: '#e8f1ff',
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  assistantMessage: {
    backgroundColor: '#f4f6fb',
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f1b4c',
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#0f1b4c',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#4a5070',
  },
  inputBar: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#dde4faff',
    borderTopWidth: 1,
    borderTopColor: '#d8dcf0',
    gap: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    minHeight: 60,
    maxHeight: 140,
    fontSize: 15,
    lineHeight: 20,
    color: '#0f1b4c',
    borderWidth: 1,
    borderColor: '#d8dcf0',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f1b4c',
    paddingVertical: 12,
    borderRadius: 14,
  },
  sendButtonDisabled: {
    backgroundColor: '#9aa4c3',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  voiceSection: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0d7ff',
    gap: 8,
  },
  voiceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f1b4c',
  },
  voiceSubtitle: {
    fontSize: 14,
    color: '#2f3c6f',
    lineHeight: 20,
  },
  voiceButton: {
    marginTop: 4,
    backgroundColor: '#0f1b4c',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f1b4c',
  },
  closeButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
  },
});