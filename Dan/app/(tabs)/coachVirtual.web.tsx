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
      // console.log('Instrucciones desde backend (Realtime):', backendInstructions);

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

      const getSessionHistoryTool = tool({
        name: 'get_session_history',
        description:
          'Trae historial corto (resúmenes) de sesiones previas. Usala SOLO si el usuario lo pide o si menciona una charla previa y necesitás recuperar detalles.',
        parameters: z.object({
          limit: z.number().min(1).max(10).default(5),
        }),
        execute: async ({ limit }) => {
          try {
            if (!userId || !token) return 'No autenticado.';

            const qs = new URLSearchParams();
            qs.set('userId', userId);
            qs.set('limit', String(limit));
            qs.set('format', 'tool'); // recomendado (ver backend abajo)

            const resp = await fetch(`${API_URL}${REALTIME_SAVE_SESSION_ENDPOINT}?${qs.toString()}`, {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!resp.ok) return `Error al traer historial (HTTP ${resp.status}).`;

            const data = await resp.json();

            // Si el backend te devuelve "context" ya formateado:
            if (typeof data?.context === 'string') return data.context;

            // Fallback si te devuelve sessions:
            const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
            return sessions
              .slice(0, limit)
              .map((s: any, i: number) => {
                const date = s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : 's/f';
                const resumen = (s.resumen ?? '').toString().slice(0, 240);
                const paso = (s.proximoPaso ?? '').toString().slice(0, 140);
                return `#${i + 1} (${date}) Resumen: ${resumen}${paso ? ` | Próximo paso: ${paso}` : ''}`;
              })
              .join('\n');
          } catch {
            return 'Problema de red al traer historial.';
          }
        },
      });


      const agent = new RealtimeAgent({
        name: 'DAN',
        instructions: backendInstructions,
        tools: [saveSessionSummaryTool, getSessionHistoryTool],
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

      // ---- 1) Mensajes de TEXTO (input_text / text) vía history_added ----
      addHandler('history_added', (historyItem: any) => {
        // Sólo nos interesan mensajes
        if (historyItem.type !== 'message') return;
        if (historyItem.role === 'system') return;

        const msg = historyItem as RealtimeMessageItem;
        const role: 'user' | 'assistant' =
          msg.role === 'assistant' ? 'assistant' : 'user';

        const parts = (msg.content ?? []) as any[];

        // Extraemos SOLO texto explícito (no transcript acá)
        const text =
          parts
            .map((part) => {
              if (part.type === 'input_text' || part.type === 'text') {
                if (typeof part.text === 'string') return part.text;

                // Algunos casos raros del SDK vienen como objetos:
                if (
                  part.text &&
                  typeof part.text.message === 'string'
                ) {
                  return part.text.message;
                }
                if (
                  part.text &&
                  typeof part.text.response === 'string'
                ) {
                  return part.text.response;
                }
              }
              return '';
            })
            .join(' ')
            .trim() ?? '';

        // console.log(
        //   'HISTORY_ADDED >>>',
        //   JSON.stringify(historyItem, null, 2),
        // );

        if (!text) return;

        // No mostrar el mensaje interno de cierre de llamada
        if (
          text.startsWith('DAN, el usuario está por cortar la llamada ahora mismo.') ||
          text.startsWith('DAN, antes de empezar, llamá a la herramienta "get_session_history"')
        ) {
          return;
        }

        const id = (msg as any).itemId ?? msg.id;

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === id);
          if (exists) return prev;

          return [
            ...prev,
            {
              id,
              role,
              content: text,
            },
          ];
        });

        markSpeaker(role);
        scrollToEnd();
      });

      // ---- 2) Eventos crudos del Realtime API (audio + transcripción) ----
      addHandler('transport_event', (event: any) => {
        // console.log('TRANSPORT_EVENT >>>', event);

        // a) Transcripción FINAL de lo que dijo el USUARIO
        if (
          event.type ===
          'conversation.item.input_audio_transcription.completed'
        ) {
          const transcript: string = (event.transcript ?? '').trim();
          if (!transcript) return;

          const id = event.item_id as string;

          setMessages((prev) => {
            const existing = prev.find((m) => m.id === id);
            if (existing) {
              // Si ya existe, actualizamos el contenido si cambió
              if (existing.content === transcript) return prev;
              return prev.map((m) =>
                m.id === id ? { ...m, content: transcript } : m,
              );
            }

            return [
              ...prev,
              {
                id,
                role: 'user',
                content: transcript,
              },
            ];
          });

          markSpeaker('user');
          scrollToEnd();
          return;
        }

        // b) Transcripción FINAL de lo que dijo el ASISTENTE en audio
        if (
          event.type === 'response.content_part.done' &&
          event.part?.type === 'audio'
        ) {
          const transcript: string = (event.part?.transcript ?? '').trim();
          if (!transcript) return;

          const id = event.item_id as string;

          setMessages((prev) => {
            const existing = prev.find((m) => m.id === id);
            if (existing) {
              if (existing.content === transcript) return prev;
              return prev.map((m) =>
                m.id === id ? { ...m, content: transcript } : m,
              );
            }

            return [
              ...prev,
              {
                id,
                role: 'assistant',
                content: transcript,
              },
            ];
          });

          markSpeaker('assistant');
          scrollToEnd();
        }

        // Si querés, acá también podés manejar:
        // - input_audio_buffer.speech_started / speech_stopped
        // - response.audio.delta, etc.
      });


      // Detectar actividad de voz
      addHandler('input_audio_buffer.speech_started', () => {
        console.log('entre al primer handler')
        markSpeaker('user');
      });

      addHandler('input_audio_buffer.speech_stopped', () => {
        console.log('entre al segundo handler')
        if (activeSpeakerRef.current === 'user') {
          clearActiveSpeaker();
        }
      });

      addHandler('response.speech_started', () => {
        console.log('entre al tercer handler')
        markSpeaker('assistant');
      });

      addHandler('response.speech_stopped', () => {
        console.log('entre al cuarto handler')
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
                misma conversación.
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
          </ScrollView>

          {/* Indicador compacto de estado de llamada */}
          {connected && (
            <View style={styles.inlineStatusRow}>
              <View
                style={[
                  styles.statusDot,
                  connected ? styles.statusDotOn : styles.statusDotOff,
                ]}
              />
              <Text style={styles.inlineStatusText}>
                {activeSpeaker === 'assistant'
                  ? 'Hablando: DAN'
                  : activeSpeaker === 'user'
                    ? 'Hablando: Vos'
                    : 'En espera...'}
              </Text>
            </View>
          )}

          {/* INPUT TEXTO + BOTONES (Enviar + Voz) */}
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
            <View style={styles.inputButtons}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!trimmedQuestion || !connected) && styles.sendButtonDisabled,
                ]}
                onPress={sendTextMessage}
                disabled={!trimmedQuestion || !connected}
              >
                <Feather name="send" size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.voiceInlineButton,
                  connected && styles.voiceInlineButtonActive,
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
              </TouchableOpacity>
            </View>
          </View>

          {/* Error de voz, si existe */}
          {voiceError && (
            <Text style={styles.voiceErrorText}>{voiceError}</Text>
          )}
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

  // ---- BARRA INFERIOR / INPUT ----
  inputBar: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#dde4faff',
    borderTopWidth: 1,
    borderTopColor: '#d8dcf0',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    minHeight: 48,
    maxHeight: 140,
    fontSize: 15,
    lineHeight: 20,
    color: '#0f1b4c',
    borderWidth: 1,
    borderColor: '#d8dcf0',
  },
  inputButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1b4c',
  },
  sendButtonDisabled: {
    backgroundColor: '#9aa4c3',
  },
  sendButtonText: {
    display: 'none', // ya no usamos texto, sólo ícono
  },

  // ---- BOTÓN DE VOZ INLINE ----
  voiceInlineButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1b4c',
  },
  voiceInlineButtonActive: {
    backgroundColor: '#b3261e',
  },

  // ---- ESTADO DE LLAMADA COMPACTO ----
  inlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    backgroundColor: '#dde4faff',
    borderTopWidth: 1,
    borderTopColor: '#d8dcf0',
  },
  inlineStatusText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#1f2b6c',
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginBottom: 2,
  },
  statusDotOn: {
    backgroundColor: '#2ecc71',
  },
  statusDotOff: {
    backgroundColor: '#e74c3c',
  },

  voiceErrorText: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 12,
    color: '#b3261e',
    backgroundColor: '#dde4faff',
  },
});
