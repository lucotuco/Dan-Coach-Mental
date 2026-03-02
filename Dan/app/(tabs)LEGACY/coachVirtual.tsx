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
import { useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import DanVoiceCall from '@/components/DanVoiceCall';
import { useAuth, getStoredToken, isUnauthorizedStatus, redirectToLogin } from '@/components/AuthContext';

const CHAT_ENDPOINT = '/api/dan/chat';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function CoachVirtualScreen() {
  const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
  const router = useRouter();

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(null);

  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { logout } = useAuth();
  const trimmedQuestion = useMemo(() => question.trim(), [question]);

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleDismissKeyboard = Platform.OS === 'web' ? undefined : Keyboard.dismiss;

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    setQuestion('');
  };

  const sendMessage = async () => {
    if (!API_URL) {
      alert('Falta configurar la URL del servidor (EXPO_PUBLIC_API_URL).');
      return;
    }
    if (!trimmedQuestion) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmedQuestion,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);
    scrollToEnd();

    try {
      const token = getStoredToken();
      if (!token) {
        redirectToLogin(router, logout);
        return;
      }

      const response = await fetch(`${API_URL}${CHAT_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: trimmedQuestion,
          conversationId: conversationId || undefined,
        }),
      });

      if (isUnauthorizedStatus(response.status)) {
        redirectToLogin(router, logout);
        return;
      }

      const contentType = response.headers.get('content-type');
      const rawBody = await response.text();
      const data = contentType?.includes('application/json') ? JSON.parse(rawBody) : { message: rawBody };

      if (!response.ok) throw new Error(data.message || 'No se pudo obtener una respuesta del coach.');

      if (data?.conversationId && !conversationId) {
        setConversationId(String(data.conversationId));
      }

      const assistantMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.message || 'No pude generar una respuesta en este momento.',
      };

      setMessages((prev) => [...prev, assistantMsg]);
      scrollToEnd();
    } catch (error: any) {
      console.error('Error al consultar al coach virtual:', error);
      alert(error?.message || 'Error al conectar con el coach virtual.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={handleDismissKeyboard} accessible={false}>
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
                Pregúntale lo que quieras a DAN por texto o mantené una charla en tiempo real por voz.
              </Text>

              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.smallBtn} onPress={newChat}>
                  <Feather name="refresh-ccw" size={16} color="#fff" />
                  <Text style={styles.smallBtnText}>Nuevo chat</Text>
                </TouchableOpacity>

                <Text style={styles.convoHint}>
                  {conversationId ? `Chat activo: ${String(conversationId).slice(-6)}` : 'Chat nuevo'}
                </Text>
              </View>
            </View>

            <View style={styles.chatWrapper}>
              {messages.length === 0 && !loading ? (
                <Text style={styles.emptyText}>
                  Aún no hay mensajes. Escribe tu consulta para iniciar la conversación.
                </Text>
              ) : (
                messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.message,
                      msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
                    ]}
                  >
                    <Text style={styles.messageRole}>{msg.role === 'user' ? 'Tú' : 'Coach DAN'}</Text>
                    <Text style={styles.messageText}>{msg.content}</Text>
                  </View>
                ))
              )}

              {loading && (
                <View style={[styles.message, styles.assistantMessage]}>
                  <Text style={styles.messageRole}>Coach DAN</Text>
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#0f1b4c" />
                    <Text style={[styles.messageText, styles.loadingText]}>Pensando...</Text>
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
            <TouchableOpacity style={styles.voiceButton} onPress={() => setIsVoiceModalVisible(true)}>
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
                  <TouchableOpacity style={styles.closeButton} onPress={() => setIsVoiceModalVisible(false)}>
                    <Feather name="x" size={20} color="#0f1b4c" />
                  </TouchableOpacity>
                </View>
                <DanVoiceCall />
              </View>
            </View>
          </Modal>

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
              style={[styles.sendButton, (!trimmedQuestion || loading) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!trimmedQuestion || loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Feather name="send" size={18} color="#fff" />}
              <Text style={styles.sendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 140 },
  header: { marginTop: 10, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f1b4c' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#4a5568' },

  headerRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0f1b4c', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  smallBtnText: { color: '#fff', fontWeight: '700' },
  convoHint: { color: '#4a5568', fontSize: 12 },

  chatWrapper: { marginTop: 10 },
  emptyText: { color: '#4a5568', fontSize: 14, marginTop: 10 },
  message: { padding: 12, borderRadius: 14, marginBottom: 10, maxWidth: '92%' },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#dbeafe' },
  assistantMessage: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  messageRole: { fontWeight: '800', marginBottom: 4, color: '#0f1b4c' },
  messageText: { color: '#111827', fontSize: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: '#4a5568' },

  voiceSection: { padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
  voiceTitle: { fontWeight: '900', color: '#0f1b4c' },
  voiceSubtitle: { marginTop: 6, color: '#4a5568' },
  voiceButton: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#6c5ce7', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 999, alignSelf: 'flex-start' },
  voiceButtonText: { color: '#fff', fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, paddingBottom: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontWeight: '900', color: '#0f1b4c', fontSize: 16 },
  closeButton: { padding: 8, borderRadius: 999, backgroundColor: '#e5e7eb' },

  inputBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  input: { flex: 1, minHeight: 44, maxHeight: 92, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', color: '#111827' },
  sendButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0f1b4c', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14 },
  sendButtonDisabled: { opacity: 0.55 },
  sendButtonText: { color: '#fff', fontWeight: '800' },
});
