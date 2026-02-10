// app/(tabs)/coachVirtual.web.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
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
  tool,
  OpenAIRealtimeWebRTC,
} from '@openai/agents/realtime';
import { z } from 'zod';

const REALTIME_TOKEN_ENDPOINT = '/api/realtime/client-secret';
const REALTIME_SESSION_SAVE_ENDPOINT = '/api/realtime/session-save';
const REALTIME_SESSION_END_ENDPOINT = '/api/realtime/session-end';

const HEADER_H = 140;
const INPUT_H = 92;
const GAP = 16;

const API_URL_RAW = process.env.EXPO_PUBLIC_API_URL ?? '';
const API_URL = API_URL_RAW.replace(/\/+$/, '');

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type Mode = 'text' | 'audio';

const isBrowser = () => typeof window !== 'undefined';

function createSessionId(): string {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto?.randomUUID) return crypto.randomUUID();
  } catch {}
  return `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: any;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(`${label} timeout (${ms}ms)`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t);
  }
}

export default function CoachVirtualScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState<Mode>('text');
  const [errorText, setErrorText] = useState<string | null>(null);

  const [assistantThinking, setAssistantThinking] = useState(false);
  const [thinkingDots, setThinkingDots] = useState('');

  const trimmedQuestion = useMemo(() => question.trim(), [question]);
  const scrollRef = useRef<ScrollView>(null);

  // Realtime session
  const sessionRef = useRef<RealtimeSession | null>(null);
  const detachSessionHandlers = useRef<(() => void) | null>(null);

  // Transport resources
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Silent stream resources (para modo texto sin mic)
  const silentAudioCtxRef = useRef<AudioContext | null>(null);
  const silentOscRef = useRef<OscillatorNode | null>(null);

  // Session ID para persistencia
  const sessionIdRef = useRef<string>(createSessionId());

  // Evitar guardar 2 veces
  const finalizedRef = useRef<boolean>(false);

  // Autosave idle
  const autosaveTimerRef = useRef<any>(null);
  const lastAutosavedCharsRef = useRef<number>(0);

  const DEV_LOG = true;

  const scrollToEnd = useCallback(() => {
    if (!isBrowser()) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages.length, assistantThinking, thinkingDots, scrollToEnd]);

  useEffect(() => {
    if (!assistantThinking) {
      setThinkingDots('');
      return;
    }
    const frames = ['', '.', '..', '...'];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % frames.length;
      setThinkingDots(frames[i]);
    }, 350);
    return () => clearInterval(id);
  }, [assistantThinking]);

  function getOrCreateAudioEl() {
    if (!isBrowser()) return null;
    if (audioElRef.current) return audioElRef.current;

    const el = document.createElement('audio');
    el.autoplay = true;
    el.setAttribute('playsinline', 'true');
    el.style.display = 'none';
    document.body.appendChild(el);

    audioElRef.current = el;
    return el;
  }

  const stopTracks = useCallback(() => {
    try {
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;

    try {
      silentOscRef.current?.stop();
    } catch {}
    silentOscRef.current = null;

    try {
      silentAudioCtxRef.current?.close();
    } catch {}
    silentAudioCtxRef.current = null;
  }, []);

  const cleanupRealtime = useCallback(() => {
    try {
      if (detachSessionHandlers.current) {
        detachSessionHandlers.current();
        detachSessionHandlers.current = null;
      }
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
    } finally {
      stopTracks();
      setAssistantThinking(false);
      setConnected(false);
    }
  }, [stopTracks]);

  const buildTranscriptFromMessages = useCallback(() => {
    const lines: string[] = [];
    for (const m of messages) {
      const prefix = m.role === 'user' ? 'Usuario' : 'DAN';
      lines.push(`${prefix}: ${m.content}`);
    }
    return lines.join('\n');
  }, [messages]);

  /**
   * ✅ Autosave (NO pipeline). Se llama después de 90s idle.
   */
  const autosaveSession = useCallback(async () => {
    if (!API_URL) return;
    if (!messages.length) return;

    const token = getStoredToken();
    if (!token) return;

    const transcript = buildTranscriptFromMessages().trim();
    if (!transcript) return;

    // Evitar autosaves idénticos (reduce spam)
    const chars = transcript.length;
    if (chars <= lastAutosavedCharsRef.current) return;

    try {
      const resp = await fetch(`${API_URL}${REALTIME_SESSION_SAVE_ENDPOINT}`, {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        // @ts-ignore
        keepalive: true,
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          transcript,
          metadata: { platform: 'web', mode, source: 'coachVirtual.web', reason: 'idle_autosave' },
        }),
      });

      if (isUnauthorizedStatus(resp.status)) {
        redirectToLogin(router, logout);
        return;
      }

      if (resp.ok) {
        lastAutosavedCharsRef.current = chars;
        if (DEV_LOG) console.log('[AUTOSAVE] ok', { chars, sessionId: sessionIdRef.current });
      } else {
        const t = await resp.text().catch(() => '');
        if (DEV_LOG) console.warn('[AUTOSAVE] failed', resp.status, t);
      }
    } catch (e) {
      if (DEV_LOG) console.warn('[AUTOSAVE] network error', e);
    }
  }, [API_URL, buildTranscriptFromMessages, logout, messages.length, mode, router]);

  /**
   * ✅ Finalize (pipeline completo). NO beacon. Usa Authorization + keepalive.
   */
  const finalizeSession = useCallback(async () => {
    if (!API_URL) return;
    if (finalizedRef.current) return;
    if (!messages.length) return;

    const token = getStoredToken();
    if (!token) {
      if (DEV_LOG) console.warn('[FINALIZE] no token -> skip');
      return;
    }

    const transcript = buildTranscriptFromMessages().trim();
    if (!transcript) return;

    finalizedRef.current = true;

    try {
      const resp = await fetch(`${API_URL}${REALTIME_SESSION_END_ENDPOINT}`, {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        // @ts-ignore
        keepalive: true,
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          transcript,
          metadata: {
            platform: 'web',
            mode,
            source: 'coachVirtual.web',
            reason: 'visibility_or_unmount',
          },
        }),
      });

      if (isUnauthorizedStatus(resp.status)) {
        redirectToLogin(router, logout);
        return;
      }

      if (!resp.ok) {
        finalizedRef.current = false;
        const t = await resp.text().catch(() => '');
        if (DEV_LOG) console.warn('[FINALIZE] failed', resp.status, t);
      } else {
        if (DEV_LOG) console.log('[FINALIZE] ok', { sessionId: sessionIdRef.current });
      }
    } catch (e) {
      finalizedRef.current = false;
      if (DEV_LOG) console.warn('[FINALIZE] network error', e);
    }
  }, [API_URL, buildTranscriptFromMessages, logout, messages.length, mode, router]);

  /**
   * ✅ Programar autosave por idle 90s cada vez que cambia la conversación
   */
  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void autosaveSession();
    }, 90_000);
  }, [autosaveSession]);

  // Cada vez que se agrega un mensaje, reprogramamos autosave
  useEffect(() => {
    if (!messages.length) return;
    scheduleAutosave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  /**
   * ✅ Guardar al irse (SIN beacon)
   */
  useEffect(() => {
    if (!isBrowser()) return;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (DEV_LOG) console.log('[VISIBILITY] hidden -> finalize');
        void finalizeSession();
      }
    };

    const onPageHide = () => {
      if (DEV_LOG) console.log('[PAGEHIDE] -> finalize');
      void finalizeSession();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [finalizeSession]);

  // Limpieza total al desmontar
  useEffect(() => {
    return () => {
      // 1) intento finalize
      void finalizeSession();
      // 2) cleanup realtime
      cleanupRealtime();
      try {
        const el = audioElRef.current;
        if (el && el.parentNode) el.parentNode.removeChild(el);
      } catch {}
      // 3) timers
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createSilentMediaStream = useCallback((): MediaStream => {
    if (!isBrowser()) return new MediaStream();

    const AudioContextCtor: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new AudioContextCtor();
    silentAudioCtxRef.current = ctx;

    const destination = ctx.createMediaStreamDestination();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    gain.gain.value = 0;
    osc.frequency.value = 440;

    osc.connect(gain);
    gain.connect(destination);

    osc.start();
    silentOscRef.current = osc;

    return destination.stream;
  }, []);

  const fetchClientSecret = useCallback(
    async (token: string, targetMode: Mode) => {
      const userId = user?._id;
      const qs = new URLSearchParams();
      if (userId) qs.set('userId', userId);
      qs.set('mode', targetMode);

      const res = await fetch(`${API_URL}${REALTIME_TOKEN_ENDPOINT}?${qs.toString()}`, {
        method: 'GET',
        credentials: 'omit',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin(router, logout);
        return null;
      }
      if (!res.ok) throw new Error(`No se pudo obtener client-secret: HTTP ${res.status}`);

      const data = await res.json();

      const apiKey: string = data?.value ?? data?.client_secret?.value ?? data?.token ?? '';
      if (!apiKey) throw new Error('El backend no devolvió un client_secret válido.');

      const backendInstructions = data?.session?.instructions ?? '';
      const model = data?.session?.model ?? 'gpt-realtime';

      return { apiKey, backendInstructions, model };
    },
    [logout, router, user?._id],
  );

  const connectRealtime = useCallback(
    async (targetMode: Mode) => {
      if (!API_URL) {
        alert('Falta configurar EXPO_PUBLIC_API_URL.');
        return;
      }
      if (!isBrowser()) {
        alert('Esta pantalla es web.');
        return;
      }
      if (connecting) return;

      if (connected && sessionRef.current && mode === targetMode) return;

      if (connected && mode !== targetMode) {
        cleanupRealtime();
      }

      setErrorText(null);
      setConnecting(true);

      try {
        const token = getStoredToken();
        if (!token) {
          redirectToLogin(router, logout);
          return;
        }

        const secret = await fetchClientSecret(token, targetMode);
        if (!secret) return;

        const { apiKey, backendInstructions, model } = secret;
        const userId = user?._id;

        const getRecentCheckupsTool = tool({
          name: 'get_recent_checkups',
          description: 'Trae los últimos chequeos del usuario para personalizar. Usala cuando sume.',
          parameters: z.object({
            limit: z.number().int().min(1).max(10).default(5),
          }),
          execute: async ({ limit }) => {
            try {
              if (!userId) return 'No hay userId para traer chequeos.';
              const qs = new URLSearchParams({
                userId,
                limit: String(limit ?? 5),
                format: 'tool',
              });
              const resp = await fetch(`${API_URL}/api/realtime/checkups?${qs.toString()}`, {
                method: 'GET',
                credentials: 'omit',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!resp.ok) return 'No pude traer chequeos (HTTP error).';
              const data = await resp.json();
              return (data?.context ?? 'Sin chequeos previos.').toString();
            } catch {
              return 'Problema de red al traer chequeos.';
            }
          },
        });

        const agent = new RealtimeAgent({
          name: 'DAN',
          instructions: backendInstructions,
          tools: [getRecentCheckupsTool],
        });

        const audioEl = getOrCreateAudioEl();
        if (audioEl) {
          audioEl.muted = targetMode !== 'audio';
          audioEl.volume = targetMode === 'audio' ? 1 : 0;
        }

        const mediaStream =
          targetMode === 'audio'
            ? await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                } as any,
              })
            : createSilentMediaStream();

        streamRef.current = mediaStream;

        const transport = new OpenAIRealtimeWebRTC({
          model,
          mediaStream,
          audioElement: audioEl ?? undefined,
        });

        const session = new RealtimeSession(agent, {
          model,
          transport,
          // @ts-ignore
          config: { output_modalities: [targetMode] },
        });

        sessionRef.current = session;

        const unsubscribers: Array<() => void> = [];
        const addHandler = (event: string, handler: (...args: any[]) => void) => {
          session.on(event, handler);
          unsubscribers.push(() => {
            if (typeof (session as any).off === 'function') (session as any).off(event, handler);
            else if (typeof (session as any).removeListener === 'function')
              (session as any).removeListener(event, handler);
          });
        };

        addHandler('transport_event', (event: any) => {
          if (event?.type === 'conversation.item.input_audio_transcription.completed') {
            const transcript = (event?.transcript ?? '').toString().trim();
            if (!transcript) return;

            setMessages((prev) => [
              ...prev,
              { id: (event?.item_id ?? `user-${Date.now()}`).toString(), role: 'user', content: transcript },
            ]);
            setAssistantThinking(true);
            return;
          }

          if (event?.type === 'response.output_text.done') {
            const text = (event?.text ?? '').toString().trim();
            if (!text) return;

            setMessages((prev) => [
              ...prev,
              { id: (event?.item_id ?? `assistant-${Date.now()}`).toString(), role: 'assistant', content: text },
            ]);
            setAssistantThinking(false);
            return;
          }

          if (event?.type === 'response.output_audio_transcript.done') {
            const transcript = (event?.transcript ?? '').toString().trim();
            if (!transcript) return;

            setMessages((prev) => [
              ...prev,
              { id: (event?.item_id ?? `assistant-${Date.now()}`).toString(), role: 'assistant', content: transcript },
            ]);
            setAssistantThinking(false);
            return;
          }

          if (event?.type === 'response.failed') {
            setAssistantThinking(false);
          }

          if (
            event?.type === 'transport.closed' ||
            event?.type === 'connection.closed' ||
            event?.type === 'session.closed' ||
            event?.type === 'error'
          ) {
            setAssistantThinking(false);
            setConnected(false);
          }
        });

        addHandler('close', () => {
          setAssistantThinking(false);
          setConnected(false);
        });

        detachSessionHandlers.current = () => {
          unsubscribers.forEach((fn) => fn());
          unsubscribers.length = 0;
        };

        await withTimeout(session.connect({ apiKey }), 25000, 'Realtime connect');

        setMode(targetMode);
        setConnected(true);
        setAssistantThinking(false);
      } catch (e: any) {
        console.error('Error al conectar:', e);
        setErrorText(e?.message ?? 'Error al conectar con DAN.');
        cleanupRealtime();
      } finally {
        setConnecting(false);
      }
    },
    [cleanupRealtime, connected, connecting, createSilentMediaStream, fetchClientSecret, logout, mode, router, user?._id],
  );

  const hangUp = useCallback(async () => {
    try {
      // ✅ finaliza siempre
      await finalizeSession();
    } finally {
      cleanupRealtime();
    }
  }, [cleanupRealtime, finalizeSession]);

  const sendTextMessage = useCallback(async () => {
    if (!trimmedQuestion) return;
    if (connecting) return;

    const textToSend = trimmedQuestion;
    setQuestion('');

    setMessages((prev) => [...prev, { id: `user-text-${Date.now()}`, role: 'user', content: textToSend }]);
    scrollToEnd();
    setAssistantThinking(true);

    // Reprogramar autosave por actividad
    scheduleAutosave();

    if (!sessionRef.current || !connected) {
      await connectRealtime('text');
    }

    const session = sessionRef.current;
    if (!session) {
      setAssistantThinking(false);
      return;
    }

    try {
      await session.sendMessage(textToSend);
    } catch (err: any) {
      console.error('Error enviando texto por Realtime:', err);
      setAssistantThinking(false);
      alert(err?.message || 'No se pudo enviar el mensaje a DAN.');
    }
  }, [trimmedQuestion, connecting, connected, connectRealtime, scheduleAutosave, scrollToEnd]);

  const onPressCall = useCallback(async () => {
    if (connecting) return;

    if (connected && mode === 'audio') {
      await hangUp();
      return;
    }

    if (connected && mode === 'text') {
      cleanupRealtime();
    }

    await connectRealtime('audio');
  }, [cleanupRealtime, connectRealtime, connected, connecting, hangUp, mode]);

  return (
    <View style={styles.screen}>
      <View style={styles.fixedHeader}>
        <View style={{ marginTop: 4 }}>
          <MedioLogo />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Coach Virtual</Text>
          <Text style={styles.subtitle}>
            {connected
              ? mode === 'audio'
                ? 'Modo audio: hablás y DAN responde con voz. También podés escribir.'
                : 'Modo texto: escribís y DAN responde en texto.'
              : 'Escribí para modo texto o tocá el botón de llamada para modo audio.'}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_H + GAP, paddingBottom: INPUT_H + GAP },
        ]}
        keyboardShouldPersistTaps="never"
      >
        <View style={styles.chatWrapper}>
          {messages.length === 0 ? (
            <Text style={styles.emptyText}>Aún no hay mensajes. Escribí o iniciá llamada.</Text>
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

          {assistantThinking && (
            <View style={[styles.message, styles.assistantMessage]}>
              <Text style={styles.messageRole}>Coach DAN</Text>
              <Text style={styles.messageText}>Pensando{thinkingDots}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.fixedInputBar}>
        <TextInput
          style={styles.input}
          placeholder={
            connected
              ? mode === 'audio'
                ? 'Escribí (DAN responde con voz)…'
                : 'Escribí (DAN responde por texto)…'
              : 'Escribí para empezar en modo texto…'
          }
          placeholderTextColor="#5a5f6dff"
          value={question}
          onChangeText={setQuestion}
          multiline
          maxLength={500}
          editable={!connecting}
        />

        <View style={styles.inputButtons}>
          <TouchableOpacity
            style={[styles.sendButton, (!trimmedQuestion || connecting) && styles.sendButtonDisabled]}
            onPress={sendTextMessage}
            disabled={!trimmedQuestion || connecting}
          >
            <Feather name="send" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.voiceInlineButton, connected && mode === 'audio' && styles.voiceInlineButtonActive]}
            onPress={onPressCall}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Feather name={connected && mode === 'audio' ? 'phone-off' : 'phone-call'} size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {!!errorText && <Text style={styles.errorTextFixed}>{errorText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffffff',
    position: 'relative',
    overflow: 'hidden',
  },

  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_H,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#ffffffff',
    zIndex: 30,
  },

  header: { gap: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f1b4c' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#1f2b6c' },

  scroll: { flex: 1 },

  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
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

  emptyText: { textAlign: 'center', color: '#7a80a0', fontSize: 14 },

  message: { padding: 12, borderRadius: 12, gap: 6 },
  userMessage: { backgroundColor: '#e8f1ff', alignSelf: 'flex-end', maxWidth: '90%' },
  assistantMessage: { backgroundColor: '#f4f6fb', alignSelf: 'flex-start', maxWidth: '90%' },

  messageRole: { fontSize: 12, fontWeight: '700', color: '#0f1b4c', textTransform: 'uppercase' },
  messageText: { fontSize: 15, lineHeight: 22, color: '#0f1b4c' },

  fixedInputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: INPUT_H,
    padding: 16,
    backgroundColor: '#dde4faff',
    borderTopWidth: 1,
    borderTopColor: '#d8dcf0',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    zIndex: 40,
  },

  errorTextFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: INPUT_H,
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 12,
    color: '#b3261e',
    zIndex: 50,
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

  inputButtons: { flexDirection: 'row', gap: 8 },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1b4c',
  },
  sendButtonDisabled: { backgroundColor: '#9aa4c3' },

  voiceInlineButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1b4c',
  },
  voiceInlineButtonActive: { backgroundColor: '#b3261e' },
});
