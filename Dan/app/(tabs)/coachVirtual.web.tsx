import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
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
import {
  useAuth,
  getStoredToken,
  isUnauthorizedStatus,
  redirectToLogin,
} from '@/components/AuthContext';

import {
  RealtimeAgent,
  RealtimeSession,
  type RealtimeMessageItem,
  tool,
} from '@openai/agents/realtime';
import { z } from 'zod';

const REALTIME_TOKEN_ENDPOINT = '/api/realtime/client-secret';
const REALTIME_SAVE_SESSION_ENDPOINT = '/api/realtime/sessions';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function CoachVirtualScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Estado de voz / Realtime
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<'user' | 'assistant' | null>(
    null,
  );

  const trimmedQuestion = useMemo(() => question.trim(), [question]);
  const scrollRef = useRef<ScrollView>(null);

  const sessionRef = useRef<RealtimeSession | null>(null);
  const detachSessionHandlers = useRef<(() => void) | null>(null);
  const activeSpeakerRef = useRef<'user' | 'assistant' | null>(null);
  const activeSpeakerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismissKeyboard =
    Platform.OS === 'web' ? undefined : Keyboard.dismiss;

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (detachSessionHandlers.current) {
        detachSessionHandlers.current();
        detachSessionHandlers.current = null;
      }
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
      if (activeSpeakerTimeout.current) {
        clearTimeout(activeSpeakerTimeout.current);
        activeSpeakerTimeout.current = null;
      }
    };
  }, []);

  const markSpeaker = (role: 'user' | 'assistant') => {
    if (activeSpeakerTimeout.current) {
      clearTimeout(activeSpeakerTimeout.current);
    }

    setActiveSpeaker(role);
    activeSpeakerRef.current = role;

    activeSpeakerTimeout.current = setTimeout(() => {
      setActiveSpeaker(null);
      activeSpeakerRef.current = null;
    }, 2600);
  };

  const clearActiveSpeaker = () => {
    if (activeSpeakerTimeout.current) {
      clearTimeout(activeSpeakerTimeout.current);
      activeSpeakerTimeout.current = null;
    }
    setActiveSpeaker(null);
    activeSpeakerRef.current = null;
  };

  // -----------------------------
  // Conectar Realtime (voz + texto)
  // -----------------------------
  const handleConnectVoice = async () => {
    if (!API_URL) {
      alert('Falta configurar EXPO_PUBLIC_API_URL.');
      return;
    }

    if (connecting || connected) return;

    setVoiceError(null);
    setConnecting(true);

    try {
      const token = getStoredToken();
      if (!token) {
        redirectToLogin(router, logout);
        return;
      }

      const userId = user?._id;
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';

      const res = await fetch(`${API_URL}${REALTIME_TOKEN_ENDPOINT}${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin(router, logout);
        return;
      }

      if (!res.ok) {
        throw new Error('No se pudo obtener el token efímero para Realtime.');
      }

      const data = await res.json();

      const apiKey: string =
        data?.value ?? data?.client_secret?.value ?? data?.token ?? '';

      if (!apiKey) {
        throw new Error('El backend no devolvió un client_secret válido.');
      }

      const backendInstructions = data.session.instructions;
      console.log('Instrucciones desde backend (Realtime):', backendInstructions);

      // Tool para guardar resumen de sesión al colgar
      const saveSessionSummaryTool = tool({
        name: 'save_session_summary',
        description:
          'Guarda un resumen corto de la sesión de coaching del usuario en la base de datos. Usala UNA sola vez cuando el usuario quiera terminar la llamada.',
        parameters: z.object({
          summary: z
            .string()
            .describe(
              'Resumen en primera persona del deportista, máximo 4 frases, sobre lo que trabajaron hoy.',
            ),
          keyMoments: z
            .array(z.string())
            .max(3)
            .describe(
              'Hasta 3 momentos o ideas clave de la sesión, en bullets cortos.',
            )
            .default([]),
          nextStep: z
            .string()
            .describe(
              'Un solo próximo paso concreto que el deportista se lleva para practicar.',
            )
            .default(''),
        }),
        execute: async (input) => {
          try {
            if (!userId || !token) {
              console.warn(
                'No hay userId o token, no se puede guardar el resumen.',
              );
              return 'No pude guardar el resumen porque falta autenticación.';
            }

            const resp = await fetch(
              `${API_URL}${REALTIME_SAVE_SESSION_ENDPOINT}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  userId,
                  summary: input.summary,
                  keyMoments: input.keyMoments,
                  nextStep: input.nextStep,
                  model: data.session?.model ?? 'gpt-realtime',
                }),
              },
            );

            if (!resp.ok) {
              console.error(
                'Error guardando resumen realtime:',
                await resp.text(),
              );
              return 'No pude guardar el resumen en la base de datos.';
            }

            return 'Resumen de la sesión guardado correctamente.';
          } catch (err) {
            console.error('Error de red al guardar resumen realtime', err);
            return 'Hubo un problema de red al guardar el resumen.';
          }
        },
      });

      const agent = new RealtimeAgent({
        name: 'DAN',
        instructions: backendInstructions,
        tools: [saveSessionSummaryTool],
      });

      const session = new RealtimeSession(agent, {
        model: 'gpt-realtime',
      });

      sessionRef.current = session;

      const unsubscribers: Array<() => void> = [];
      const addHandler = (
        event: string,
        handler: (...args: any[]) => void,
      ) => {
          session.on(event, handler);
          unsubscribers.push(() => {
            if (typeof (session as any).off === 'function') {
              (session as any).off(event, handler);
            } else if (typeof (session as any).removeListener === 'function') {
              (session as any).removeListener(event, handler);
            }
          });
        };

      // Cada vez que se agrega algo al historial (usuario o asistente) en Realtime
      addHandler('history_added', (item) => {
        if (item.type !== 'message') return;

        const msg = item as RealtimeMessageItem;
        if (msg.role === 'system') return;

        const role: 'user' | 'assistant' =
          msg.role === 'assistant' ? 'assistant' : 'user';

        const text = (msg.content as any[])
          .map((c) => {
            if ('text' in c && c.text) return c.text as string;
            if ('transcript' in c && c.transcript)
              return c.transcript as string;
            return '';
          })
          .join(' ')
          .trim();

        // Evitar mostrar el prompt interno de "estás por cortar la llamada..."
        if (
          !text ||
          text.startsWith('DAN, el usuario está por cortar la llamada ahora mismo.')
        ) {
          return;
        }

        const id = (msg as any).itemId ?? msg.id;

        const newMessage: ChatMessage = {
          id,
          role,
          content: text,
        };

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === id);
          if (exists) return prev;
          return [...prev, newMessage];
        });

        markSpeaker(role);
        scrollToEnd();
      });

      // Detectar actividad de voz
      addHandler('input_audio_buffer.speech_started', () => {
        markSpeaker('user');
      });

      addHandler('input_audio_buffer.speech_stopped', () => {
        if (activeSpeakerRef.current === 'user') {
          clearActiveSpeaker();
        }
      });

      addHandler('response.speech_started', () => {
        markSpeaker('assistant');
      });

      addHandler('response.speech_stopped', () => {
        if (activeSpeakerRef.current === 'assistant') {
          clearActiveSpeaker();
        }
      });

      detachSessionHandlers.current = () => {
        unsubscribers.forEach((fn) => fn());
        unsubscribers.length = 0;
      };

      await session.connect({ apiKey });
      setConnected(true);
    } catch (e: any) {
      console.error('Error al conectar Realtime:', e);
      setVoiceError(e?.message ?? 'Error al conectar con DAN en tiempo real.');
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
      if (detachSessionHandlers.current) {
        detachSessionHandlers.current = null;
      }
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  const cleanupAndCloseSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (detachSessionHandlers.current) {
      detachSessionHandlers.current = null;
    }
    setConnected(false);
    clearActiveSpeaker();
  };

  const handleHangUpVoice = async () => {
    const session = sessionRef.current;

    if (!session) {
      cleanupAndCloseSession();
      return;
    }

    try {
      await session.sendMessage(
        `DAN, el usuario está por cortar la llamada ahora mismo.
Mirá toda la charla de esta sesión y generá un resumen breve para guardar en la base de datos, con:
- estado inicial del deportista,
- tema principal que trabajaron,
- herramientas o ejercicios que usaron,
- micro plan o siguiente paso concreto.

Usá UNA sola vez la herramienta "save_session_summary" con ese resumen.
Al usuario solamente dale un cierre corto, cálido y realista (no leas todo el resumen en voz alta).`,
      );

      setTimeout(() => {
        cleanupAndCloseSession();
      }, 1500);
    } catch (e) {
      console.error('Error al pedir resumen antes de colgar', e);
      cleanupAndCloseSession();
    }
  };

  // -----------------------------
  // Enviar mensaje de texto (MISMO cerebro Realtime)
  // -----------------------------
  const sendTextMessage = async () => {
    if (!trimmedQuestion) return;

    const session = sessionRef.current;

    if (!session || !connected) {
      alert('Primero conectate con DAN para poder escribirle o hablarle.');
      return;
    }

    const textToSend = trimmedQuestion;
    setQuestion('');

    try {
      // El mensaje de usuario entra al mismo historial de Realtime
      await session.sendMessage(textToSend);
      // No tocamos messages manualmente: history_added lo va a agregar.
    } catch (err: any) {
      console.error('Error enviando mensaje de texto por Realtime:', err);
      alert(err?.message || 'No se pudo enviar el mensaje a DAN.');
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
                En web, podés escribirle a DAN o hablarle por voz, todo en la
                misma conversación y con el mismo cerebro.
              </Text>
            </View>

            {/* CHAT UNIFICADO (texto + voz transcrita) */}
            <View style={styles.chatWrapper}>
              {messages.length === 0 ? (
                <Text style={styles.emptyText}>
                  Aún no hay mensajes. Conectate con DAN, hablale o escribile
                  para empezar.
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
            </View>

            {/* BLOQUE DE VOZ (mismo cerebro que el chat) */}
            <View style={styles.voiceSection}>
              <View style={styles.voiceHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.voiceTitle}>Hablar con DAN por voz</Text>
                  <Text style={styles.voiceSubtitle}>
                    Cuando la llamada está activa, todo lo que digas se
                    transcribe en el chat, y también podés seguir escribiendo.
                  </Text>
                </View>
                <View style={styles.voiceStatusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      connected ? styles.statusDotOn : styles.statusDotOff,
                    ]}
                  />
                  <Text style={styles.voiceStatusText}>
                    {connected
                      ? 'En llamada'
                      : connecting
                      ? 'Conectando...'
                      : 'Sin llamada'}
                  </Text>
                </View>
              </View>

              <View style={styles.voiceControlsRow}>
                <TouchableOpacity
                  style={[
                    styles.voiceButton,
                    connected && styles.voiceButtonActive,
                  ]}
                  onPress={connected ? handleHangUpVoice : handleConnectVoice}
                  disabled={connecting}
                >
                  {connecting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Feather
                      name={connected ? 'phone-off' : 'phone-call'}
                      size={18}
                      color="#fff"
                    />
                  )}
                  <Text style={styles.voiceButtonText}>
                    {connected ? 'Cortar llamada' : 'Iniciar llamada de voz'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.speakerIndicator}>
                  {activeSpeaker === 'assistant' && (
                    <Text style={styles.speakerText}>Hablando: DAN</Text>
                  )}
                  {activeSpeaker === 'user' && (
                    <Text style={styles.speakerText}>Hablando: Vos</Text>
                  )}
                  {!activeSpeaker && connected && (
                    <Text style={styles.speakerText}>En espera...</Text>
                  )}
                </View>
              </View>

              {voiceError && (
                <Text style={styles.voiceErrorText}>{voiceError}</Text>
              )}
            </View>
          </ScrollView>

          {/* INPUT TEXTO (misma sesión Realtime) */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder={
                connected
                  ? 'Escribí algo para trabajar con DAN (también podés hablarle)...'
                  : 'Primero conectate con DAN para escribirle o hablarle'
              }
              placeholderTextColor="#8a90a8"
              value={question}
              onChangeText={setQuestion}
              multiline
              maxLength={500}
              editable={connected} // solo escribís cuando hay sesión Realtime
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!trimmedQuestion || !connected) && styles.sendButtonDisabled,
              ]}
              onPress={sendTextMessage}
              disabled={!trimmedQuestion || !connected}
            >
              <Feather name="send" size={18} color="#fff" />
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
    boxShadowProp: {
      boxShadow: {
        offsetX: 0,
        offsetY: 6,
        blurRadius: 10,
        spreadDistance: 0,
        color: 'rgba(15, 27, 76, 0.0051)',
      },
    },
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

  // ---- VOZ ----
  voiceSection: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0d7ff',
    gap: 12,
  },
  voiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  voiceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f1b4c',
  },
  voiceSubtitle: {
    fontSize: 13,
    color: '#2f3c6f',
    lineHeight: 18,
    marginTop: 4,
  },
  voiceStatusRow: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginLeft: 'auto',
    marginBottom: 2,
  },
  statusDotOn: {
    backgroundColor: '#2ecc71',
  },
  statusDotOff: {
    backgroundColor: '#e74c3c',
  },
  voiceStatusText: {
    fontSize: 12,
    color: '#1f2b6c',
  },
  voiceControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0f1b4c',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  voiceButtonActive: {
    backgroundColor: '#b3261e',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  speakerIndicator: {
    flex: 1,
    alignItems: 'flex-end',
  },
  speakerText: {
    fontSize: 12,
    color: '#1f2b6c',
  },
  voiceErrorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#b3261e',
  },
});
