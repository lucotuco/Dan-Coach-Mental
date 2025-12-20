// app/(tabs)/coachVirtual.web.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  tool,
  OpenAIRealtimeWebRTC,
} from '@openai/agents/realtime';
import { z } from 'zod';

const REALTIME_TOKEN_ENDPOINT = '/api/realtime/client-secret';
const REALTIME_SAVE_SESSION_ENDPOINT = '/api/realtime/sessions';
const DID_CONFIG_ENDPOINT = '/api/did/config';
const TTS_ENDPOINT = '/api/tts';

const API_URL_RAW = process.env.EXPO_PUBLIC_API_URL ?? '';
const API_URL = API_URL_RAW.replace(/\/+$/, '');

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type DidConfig = {
  clientKey: string;
  agentId: string;
};

// RN Web: elemento HTML
const HtmlVideo: any = 'video';
const isBrowser = () => typeof window !== 'undefined';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const [activeSpeaker, setActiveSpeaker] = useState<'user' | 'assistant' | null>(null);
  const activeSpeakerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // D-ID
  const [showAvatar, setShowAvatar] = useState(false);
  const [didError, setDidError] = useState<string | null>(null);

  // --- Thinking indicator (anim dots)
  const [assistantThinking, setAssistantThinking] = useState(false);
  const [thinkingDots, setThinkingDots] = useState('');

  const trimmedQuestion = useMemo(() => question.trim(), [question]);
  const scrollRef = useRef<ScrollView>(null);

  // Realtime session
  const sessionRef = useRef<RealtimeSession | null>(null);
  const detachSessionHandlers = useRef<(() => void) | null>(null);

  // OpenAI realtime transport (WebRTC)
  const openAiMicStreamRef = useRef<MediaStream | null>(null);
  const openAiAudioElRef = useRef<HTMLAudioElement | null>(null);

  // D-ID SDK
  const didVideoRef = useRef<HTMLVideoElement | null>(null);
  const didManagerRef = useRef<any>(null);
  const didIdleUrlRef = useRef<string>('');
  const didSrcObjectRef = useRef<any>(null);

  // speak queue + dedupe
  const speakQueueRef = useRef<Promise<void>>(Promise.resolve());
  const spokenIdsRef = useRef<Set<string>>(new Set());

  // Cancel/interrupt controls for our TTS->DID pipeline
  const speakGenerationRef = useRef<number>(0);
  const activeTtsAbortRef = useRef<AbortController | null>(null);

  // --- UX ordering: user first + show assistant only when avatar starts
  const pendingUserQueueRef = useRef<string[]>([]);
  const pendingAssistantTextRef = useRef<Map<string, string>>(new Map());
  const displayedAssistantIdsRef = useRef<Set<string>>(new Set());
  const didCurrentSpeakItemIdRef = useRef<string | null>(null);

  // fallback timers (if START never comes)
  const assistantFallbackTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const handleDismissKeyboard = Platform.OS === 'web' ? undefined : () => {};

  const scrollToEnd = () => {
    if (!isBrowser()) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  useEffect(() => {
    // Mantener scroll abajo cuando aparece/desaparece thinking
    scrollToEnd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantThinking, thinkingDots]);

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

  const markSpeaker = (role: 'user' | 'assistant') => {
    if (activeSpeakerTimeout.current) clearTimeout(activeSpeakerTimeout.current);
    setActiveSpeaker(role);
    activeSpeakerTimeout.current = setTimeout(() => setActiveSpeaker(null), 1800);
  };

  const stopOpenAiMic = () => {
    try {
      const ms = openAiMicStreamRef.current;
      ms?.getTracks()?.forEach((t) => t.stop());
    } catch {}
    openAiMicStreamRef.current = null;
  };

  const cleanupRealtime = () => {
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
      stopOpenAiMic();
      setAssistantThinking(false);

      setConnected(false);
      if (activeSpeakerTimeout.current) clearTimeout(activeSpeakerTimeout.current);
      activeSpeakerTimeout.current = null;
      setActiveSpeaker(null);
    }
  };

  const disconnectDid = async () => {
    try {
      const mgr = didManagerRef.current;
      if (mgr) {
        console.log('[DID] disconnect…');
        await withTimeout(mgr.disconnect(), 12000, 'D-ID disconnect');
        console.log('[DID] disconnected');
      }
    } catch (e) {
      console.warn('[DID] disconnect warning:', e);
    } finally {
      spokenIdsRef.current.clear();
      didSrcObjectRef.current = null;
      setShowAvatar(false);
      setAssistantThinking(false);
    }
  };

  useEffect(() => {
    return () => {
      cleanupRealtime();
      disconnectDid();

      try {
        const el = openAiAudioElRef.current;
        if (el && el.parentNode) el.parentNode.removeChild(el);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getOrCreateMutedOpenAiAudioEl() {
    if (!isBrowser()) return null;

    if (openAiAudioElRef.current) return openAiAudioElRef.current;

    const el = document.createElement('audio');
    // IMPORTANTÍSIMO: evita la “voz” de Realtime (audio nativo del modelo)
    el.autoplay = true;
    el.muted = true;
    el.volume = 0;
    el.setAttribute('playsinline', 'true');
    el.style.display = 'none';

    document.body.appendChild(el);

    openAiAudioElRef.current = el;
    return el;
  }

  // --- Hard stop avatar playback (local), + cancel queued speak pipeline
  const interruptAssistantAndAvatar = async (reason: string) => {
    // Cancela pipeline TTS->DID
    speakGenerationRef.current += 1;

    try {
      activeTtsAbortRef.current?.abort();
    } catch {}
    activeTtsAbortRef.current = null;

    // vaciamos cola
    speakQueueRef.current = Promise.resolve();

    // y “reset” del estado de speak actual
    didCurrentSpeakItemIdRef.current = null;

    // mientras el usuario habla, no estamos pensando
    setAssistantThinking(false);

    // Stop avatar local: volvemos a idle y cortamos srcObject (silencio inmediato)
    try {
      const video = didVideoRef.current;
      if (video) {
        try {
          video.pause?.();
        } catch {}
        try {
          (video as any).srcObject = null;
        } catch {}
        const idleUrl =
          didIdleUrlRef.current || didManagerRef.current?.agent?.presenter?.idle_video || '';
        if (idleUrl) {
          video.src = idleUrl;
          video.play?.().catch(() => {});
        }
      }
    } catch {}

    // Best-effort: si el SDK expone stop/interrupt, lo intentamos
    try {
      const mgr = didManagerRef.current;
      if (mgr?.stop && typeof mgr.stop === 'function') await mgr.stop();
      if (mgr?.interrupt && typeof mgr.interrupt === 'function') await mgr.interrupt();
    } catch {}

    console.log('[INTERRUPT]', reason);
  };

  // --- Insert user placeholder on speech start so user appears before assistant
  const pushPendingUserPlaceholder = () => {
    const id = `user-${Date.now()}`;
    pendingUserQueueRef.current.push(id);
    setMessages((prev) => [...prev, { id, role: 'user', content: '…' }]);
    scrollToEnd();
  };

  const ensureDidManager = async (token: string) => {
    if (!isBrowser()) return;
    if (didManagerRef.current) return;

    setDidError(null);

    console.log('[DID] fetching /api/did/config…');
    const resp = await fetch(`${API_URL}${DID_CONFIG_ENDPOINT}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) {
      throw new Error(`D-ID config HTTP ${resp.status}: ${await resp.text()}`);
    }

    const cfg = (await resp.json()) as any;
    const config: DidConfig = cfg?.config ?? cfg;

    if (!config?.clientKey || !config?.agentId) {
      throw new Error('D-ID config inválida (falta clientKey o agentId).');
    }

    console.log('[DID] config OK');
    console.log('[DID] dynamic import SDK…');
    const sdk = await import('@d-id/client-sdk');
    console.log('[DID] SDK loaded');

    const callbacks = {
      onSrcObjectReady: (value: any) => {
        didSrcObjectRef.current = value;
        const video = didVideoRef.current;
        if (video) {
          video.src = '';
          (video as any).srcObject = value;
          video.play?.().catch(() => {});
        }
        return value;
      },

      onVideoStateChange: (state: string) => {
        console.log('[DID] onVideoStateChange:', state);

        const video = didVideoRef.current;
        if (!video) return;

        // Cuando el avatar arranca a hablar: mostrar texto del asistente y apagar "pensando"
        if (state === 'START') {
          setAssistantThinking(false);

          const itemId = didCurrentSpeakItemIdRef.current;
          if (itemId) {
            const text = pendingAssistantTextRef.current.get(itemId);
            if (text && !displayedAssistantIdsRef.current.has(itemId)) {
              displayedAssistantIdsRef.current.add(itemId);
              pendingAssistantTextRef.current.delete(itemId);

              const t = assistantFallbackTimersRef.current.get(itemId);
              if (t) {
                clearTimeout(t);
                assistantFallbackTimersRef.current.delete(itemId);
              }

              setMessages((prev) => [...prev, { id: itemId, role: 'assistant', content: text }]);
              markSpeaker('assistant');
              scrollToEnd();
            }
          }
        }

        if (state === 'STOP') {
          didCurrentSpeakItemIdRef.current = null;

          const idleUrl =
            didIdleUrlRef.current || didManagerRef.current?.agent?.presenter?.idle_video || '';
          if (idleUrl) {
            try {
              (video as any).srcObject = null;
            } catch {}
            video.src = idleUrl;
            video.play?.().catch(() => {});
          }
        } else {
          video.src = '';
          (video as any).srcObject = didSrcObjectRef.current ?? null;
          video.play?.().catch(() => {});
        }
      },

      onConnectionStateChange: (state: string) => {
        console.log('[DID] connection state:', state);
      },

      onError: (error: any) => {
        console.error('[DID] error:', error);
        setDidError(typeof error?.message === 'string' ? error.message : JSON.stringify(error));
        // si hay error, no nos quedamos "pensando" colgados
        setAssistantThinking(false);
      },
    };

    const streamOptions = {
      compatibilityMode: 'on',
      streamWarmup: false,
    };

    console.log('[DID] createAgentManager…');
    const mgr = await sdk.createAgentManager(config.agentId, {
      auth: { type: 'key', clientKey: config.clientKey },
      callbacks,
      streamOptions,
    });

    didManagerRef.current = mgr;
    didIdleUrlRef.current = mgr?.agent?.presenter?.idle_video ?? '';
    console.log('[DID] manager ready. idle_video:', didIdleUrlRef.current ? 'OK' : '(vacío)');
  };

  const connectDid = async () => {
    if (!isBrowser()) return;
    const mgr = didManagerRef.current;
    if (!mgr) throw new Error('D-ID manager no inicializado.');

    console.log('[DID] connect…');
    await withTimeout(mgr.connect(), 25000, 'D-ID connect');
    console.log('[DID] connected');

    const video = didVideoRef.current;
    const idleUrl = didIdleUrlRef.current || mgr?.agent?.presenter?.idle_video || '';
    if (video && idleUrl) {
      try {
        (video as any).srcObject = null;
      } catch {}
      video.src = idleUrl;

      video.muted = true; // autoplay seguro
      video.playsInline = true;
      video.autoplay = true;

      video.play?.().catch(() => {});
    }

    // Desmuteamos D-ID para escuchar SOLO el avatar
    if (video) {
      await sleep(50);
      video.muted = false;
      video.play?.().catch(() => {});
    }
  };

 const requestTtsAudioUrl = async (token: string, text: string, itemId?: string) => {
  console.log('[TTS] POST /api/tts …', itemId ?? '');

  const ttsInstructions =
    'Voz masculina adulta, cálida y cercana, registro medio–grave. Ritmo conversacional con micro-pausas naturales; frases cortas y claras. Entonación suave: sube levemente al preguntar y cae al cerrar ideas. Empático y validante, con energía tranquila; transmite contención y seguridad sin autoritarismo. Dicción nítida, sin sonar robótico ni “locutor”. Español rioplatense (vos), lenguaje simple, sin tecnicismos. Puede usar muletillas suaves ocasionales (“ok”, “ajá”, “claro”, “te entiendo”) sin repetirlas. Humor muy liviano solo si alivia, nunca burlón. Evitar tono sermoneador, apurado o agresivo.'

  const resp = await fetch(`${API_URL}${TTS_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      text,
      model: 'gpt-4o-mini-tts',
      voice: 'verse',
      instructions: ttsInstructions,
      response_format: 'mp3',
      // speed: 1.0, // opcional
    }),
  });

  const raw = await resp.text();
  if (!resp.ok) throw new Error(`TTS HTTP ${resp.status}: ${raw}`);

  let data: any = {};
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('TTS devolvió respuesta no-JSON');
  }

  const audioUrl = data?.audioUrl || data?.url;
  if (!audioUrl) throw new Error('El backend TTS no devolvió audioUrl.');
  return audioUrl as string;
};

  // Encola speak; NO muestra texto hasta START del avatar
  const enqueueDidSpeak = (token: string, text: string, itemId: string) => {
    const clean = (text || '').trim();
    if (!clean) return;
    if (spokenIdsRef.current.has(itemId)) return;
    spokenIdsRef.current.add(itemId);

    // Desde acá hasta START, mostramos pensando...
    setAssistantThinking(true);

    // Guardamos texto pendiente (se mostrará en START)
    pendingAssistantTextRef.current.set(itemId, clean);

    const myGen = speakGenerationRef.current;

    // Fallback: si START no llega por algún motivo, mostramos texto y apagamos pensando
    if (!assistantFallbackTimersRef.current.has(itemId)) {
      const t = setTimeout(() => {
        if (!displayedAssistantIdsRef.current.has(itemId)) {
          const pending = pendingAssistantTextRef.current.get(itemId);
          if (pending) {
            displayedAssistantIdsRef.current.add(itemId);
            pendingAssistantTextRef.current.delete(itemId);
            assistantFallbackTimersRef.current.delete(itemId);

            setMessages((prev) => [...prev, { id: itemId, role: 'assistant', content: pending }]);
            markSpeaker('assistant');
            setAssistantThinking(false);
            scrollToEnd();
          }
        }
      }, 5000);
      assistantFallbackTimersRef.current.set(itemId, t);
    }

    speakQueueRef.current = speakQueueRef.current.then(async () => {
      try {
        if (myGen !== speakGenerationRef.current) return;

        const mgr = didManagerRef.current;
        if (!mgr) return;

        const ac = new AbortController();
        activeTtsAbortRef.current = ac;

        const audioUrl = await requestTtsAudioUrl(token, clean, itemId, ac.signal);

        if (myGen !== speakGenerationRef.current) return;

        // Este item es el próximo a “START”
        didCurrentSpeakItemIdRef.current = itemId;

        console.log('[DID] speak(audio)…', audioUrl);
        await withTimeout(mgr.speak({ type: 'audio', audio_url: audioUrl }), 45000, 'D-ID speak');
      } catch (e: any) {
        if (e?.name === 'AbortError') return;

        console.error('[DID] speak failed:', e);
        setDidError(e?.message ?? 'Error haciendo speak en D-ID');

        // si falló speak, mostramos el texto pendiente para no perderlo
        const pending = pendingAssistantTextRef.current.get(itemId);
        if (pending && !displayedAssistantIdsRef.current.has(itemId)) {
          displayedAssistantIdsRef.current.add(itemId);
          pendingAssistantTextRef.current.delete(itemId);

          const t = assistantFallbackTimersRef.current.get(itemId);
          if (t) {
            clearTimeout(t);
            assistantFallbackTimersRef.current.delete(itemId);
          }

          setMessages((prev) => [...prev, { id: itemId, role: 'assistant', content: pending }]);
          markSpeaker('assistant');
        }

        setAssistantThinking(false);
        scrollToEnd();
      } finally {
        activeTtsAbortRef.current = null;
      }
    });
  };

  const forceTextOnlyOnRealtime = async (session: RealtimeSession) => {
    const transport: any = (session as any).transport;
    if (!transport?.sendEvent) {
      console.warn('[RT] No encontré session.transport.sendEvent (no puedo mandar session.update)');
      return;
    }

    console.log('[RT] forcing TEXT ONLY via session.update…');

    await transport.sendEvent({
      type: 'session.update',
      session: {
        output_modalities: ['text'],
      },
    });
  };

  const handleConnectVoice = async () => {
    console.log('[CONNECT] start');

    if (!API_URL) {
      alert('Falta configurar EXPO_PUBLIC_API_URL.');
      return;
    }
    if (!isBrowser()) {
      alert('Esta pantalla es web.');
      return;
    }
    if (connecting || connected) return;

    setVoiceError(null);
    setDidError(null);
    setConnecting(true);

    try {
      const token = getStoredToken();
      if (!token) {
        redirectToLogin(router, logout);
        return;
      }

      setShowAvatar(true);
      await sleep(0);

      await ensureDidManager(token);
      await sleep(0);
      await connectDid();

      console.log('[CONNECT] fetch realtime client-secret…');
      const userId = user?._id;
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const res = await fetch(`${API_URL}${REALTIME_TOKEN_ENDPOINT}${query}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin(router, logout);
        return;
      }
      if (!res.ok) throw new Error(`No se pudo obtener client-secret: HTTP ${res.status}`);

      const data = await res.json();
      const apiKey: string = data?.value ?? data?.client_secret?.value ?? data?.token ?? '';
      if (!apiKey) throw new Error('El backend no devolvió un client_secret válido.');

      const backendInstructions = data?.session?.instructions ?? '';
      const model = data?.session?.model ?? 'gpt-realtime';

      const saveSessionSummaryTool = tool({
        name: 'save_session_summary',
        description:
          'Guarda un resumen corto de la sesión. Usala UNA sola vez cuando el usuario quiera terminar la llamada.',
        parameters: z.object({
          summary: z.string(),
          keyMoments: z.array(z.string()).max(3).default([]),
          nextStep: z.string().default(''),
        }),
        execute: async (input) => {
          try {
            if (!userId) return 'No pude guardar el resumen (no userId).';

            const resp = await fetch(`${API_URL}${REALTIME_SAVE_SESSION_ENDPOINT}`, {
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
                model,
              }),
            });

            if (!resp.ok) return 'No pude guardar el resumen en la base de datos.';
            return 'Resumen guardado correctamente.';
          } catch {
            return 'Problema de red al guardar resumen.';
          }
        },
      });

      const agent = new RealtimeAgent({
        name: 'DAN',
        instructions: backendInstructions,
        tools: [saveSessionSummaryTool],
      });

      // ---- Transporte WebRTC propio: AUDIO DE OPENAI MUTEADO (evita doble voz)
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } as any,
      });
      openAiMicStreamRef.current = micStream;

      const openAiAudioEl = getOrCreateMutedOpenAiAudioEl();

      const transport = new OpenAIRealtimeWebRTC({
        model,
        mediaStream: micStream,
        audioElement: openAiAudioEl ?? undefined,
      });

      const session = new RealtimeSession(agent, {
        model,
        transport,
        // @ts-ignore
        config: { output_modalities: ['text'] },
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
        if (event?.type === 'session.updated') {
          console.log('[RT] session.updated output_modalities:', event?.session?.output_modalities);
        }
        if (event?.type === 'response.created') {
          console.log(
            '[RT] response.created output_modalities:',
            event?.response?.output_modalities,
            'voice:',
            event?.response?.audio?.output?.voice,
          );
        }

        // Barge-in: usuario empieza a hablar => cortar avatar + pipeline
        if (event?.type === 'input_audio_buffer.speech_started') {
          markSpeaker('user');

          // placeholder para asegurar orden (user primero)
          pushPendingUserPlaceholder();

          interruptAssistantAndAvatar('user speech_started');
          return;
        }

        if (event?.type === 'response.cancelled') {
          console.log('[RT] response.cancelled');
          return;
        }

        // User transcript final: completa placeholder + prende "pensando..."
        if (event?.type === 'conversation.item.input_audio_transcription.completed') {
          const transcript = (event?.transcript ?? '').toString().trim();
          if (!transcript) return;

          const pendingId = pendingUserQueueRef.current.shift();
          if (pendingId) {
            setMessages((prev) =>
              prev.map((m) => (m.id === pendingId ? { ...m, content: transcript } : m)),
            );
          } else {
            const id = (event?.item_id ?? `user-${Date.now()}`).toString();
            setMessages((prev) => [...prev, { id, role: 'user', content: transcript }]);
          }

          markSpeaker('user');
          scrollToEnd();

          // Desde que el usuario terminó, hasta que el avatar arranque => "Pensando..."
          setAssistantThinking(true);
          return;
        }

        // Asistente: cuando termina el texto, disparamos TTS->DID (y mostramos texto en START)
        if (event?.type === 'response.output_text.done') {
          const id = (event?.item_id ?? `assistant-${Date.now()}`).toString();
          const text = (event?.text ?? '').toString().trim();
          if (!text) return;

          enqueueDidSpeak(token, text, id);
          return;
        }

        if (event?.type === 'response.output_audio_transcript.done') {
          const id = (event?.item_id ?? `assistant-${Date.now()}`).toString();
          const transcript = (event?.transcript ?? '').toString().trim();
          if (!transcript) return;

          enqueueDidSpeak(token, transcript, id);
          return;
        }
      });

      detachSessionHandlers.current = () => {
        unsubscribers.forEach((fn) => fn());
        unsubscribers.length = 0;
      };

      console.log('[CONNECT] session.connect…');
      await withTimeout(session.connect({ apiKey }), 25000, 'Realtime connect');
      console.log('[CONNECT] session.connected');

      await forceTextOnlyOnRealtime(session);

      setConnected(true);
      setAssistantThinking(false);
    } catch (e: any) {
      console.error('Error al conectar:', e);
      setVoiceError(e?.message ?? 'Error al conectar con DAN.');
      cleanupRealtime();
      await disconnectDid();
    } finally {
      setConnecting(false);
    }
  };

  const handleHangUpVoice = async () => {
    const session = sessionRef.current;

    try {
      if (session) {
        await session.sendMessage(
          `DAN, el usuario está por cortar la llamada ahora mismo.
Mirá toda la charla de esta sesión y generá un resumen breve para guardar en la base de datos.
Usá UNA sola vez la herramienta "save_session_summary".
Al usuario solamente dale un cierre corto y cálido.`,
        );
      }
    } catch (e) {
      console.warn('Error al pedir resumen antes de colgar:', e);
    } finally {
      cleanupRealtime();
      await disconnectDid();
    }
  };

  const sendTextMessage = async () => {
    if (!trimmedQuestion) return;

    const session = sessionRef.current;
    if (!session || !connected) {
      alert('Primero conectate con DAN.');
      return;
    }

    const textToSend = trimmedQuestion;
    setQuestion('');

    setMessages((prev) => [
      ...prev,
      { id: `user-text-${Date.now()}`, role: 'user', content: textToSend },
    ]);
    scrollToEnd();

    // para texto escrito: prendemos pensando de inmediato
    setAssistantThinking(true);

    try {
      await session.sendMessage(textToSend);
    } catch (err: any) {
      console.error('Error enviando texto por Realtime:', err);
      setAssistantThinking(false);
      alert(err?.message || 'No se pudo enviar el mensaje a DAN.');
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
                Apretá el botón de llamada para empezar. El avatar aparece solo durante la llamada.
              </Text>
            </View>

            {showAvatar && (
              <View style={styles.videoCard}>
                <View style={styles.videoFrame}>
                  <HtmlVideo
                    ref={(el: any) => (didVideoRef.current = el)}
                    autoPlay
                    playsInline
                    style={styles.videoEl}
                  />
                </View>
                {!!didError && <Text style={styles.didErrorText}>{didError}</Text>}
              </View>
            )}

            <View style={styles.chatWrapper}>
              {messages.length === 0 ? (
                <Text style={styles.emptyText}>Aún no hay mensajes. Conectate con DAN.</Text>
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

              {/* Thinking bubble (solo cuando está “pensando” y aún no arrancó START del avatar) */}
              {connected && assistantThinking && (
                <View style={[styles.message, styles.assistantMessage, styles.thinkingMessage]}>
                  <Text style={styles.messageRole}>Coach DAN</Text>
                  <Text style={styles.messageText}>{`Pensando${thinkingDots}`}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {connected && (
            <View style={styles.inlineStatusRow}>
              <View style={[styles.statusDot, styles.statusDotOn]} />
              <Text style={styles.inlineStatusText}>
                {activeSpeaker === 'assistant'
                  ? 'Hablando: DAN'
                  : activeSpeaker === 'user'
                  ? 'Hablando: Vos'
                  : assistantThinking
                  ? 'Pensando…'
                  : 'En espera…'}
              </Text>
            </View>
          )}

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder={connected ? 'Escribí algo para trabajar con DAN…' : 'Primero conectate con DAN'}
              placeholderTextColor="#8a90a8"
              value={question}
              onChangeText={setQuestion}
              multiline
              maxLength={500}
              editable={connected}
            />

            <View style={styles.inputButtons}>
              <TouchableOpacity
                style={[styles.sendButton, (!trimmedQuestion || !connected) && styles.sendButtonDisabled]}
                onPress={sendTextMessage}
                disabled={!trimmedQuestion || !connected}
              >
                <Feather name="send" size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.voiceInlineButton, connected && styles.voiceInlineButtonActive]}
                onPress={connected ? handleHangUpVoice : handleConnectVoice}
                disabled={connecting}
              >
                {connecting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Feather name={connected ? 'phone-off' : 'phone-call'} size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {!!voiceError && <Text style={styles.voiceErrorText}>{voiceError}</Text>}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#ffffffff' },
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 32 },

  header: { gap: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f1b4c' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#1f2b6c' },

  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    shadowColor: '#0f1b4c0d',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  videoFrame: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    aspectRatio: 9 / 16,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoEl: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: '#000',
  },
  didErrorText: { fontSize: 12, color: '#b3261e' },

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
  thinkingMessage: { maxWidth: '60%' },

  messageRole: { fontSize: 12, fontWeight: '700', color: '#0f1b4c', textTransform: 'uppercase' },
  messageText: { fontSize: 15, lineHeight: 22, color: '#0f1b4c' },

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
  inlineStatusText: { marginLeft: 6, fontSize: 12, color: '#1f2b6c' },
  statusDot: { width: 10, height: 10, borderRadius: 999, marginBottom: 2 },
  statusDotOn: { backgroundColor: '#2ecc71' },

  voiceErrorText: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 12,
    color: '#b3261e',
    backgroundColor: '#dde4faff',
  },
});
