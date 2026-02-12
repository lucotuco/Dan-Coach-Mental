// app/(tabs)/coachVirtual.web.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
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

const DAN_CONVERSATIONS_ENDPOINT = '/api/dan/conversations';

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

type ConversationListItem = {
  _id: string;
  title?: string;
  pinned?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string | null;
  type?: string;
};

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

function formatDateShort(iso?: string | null) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const yr = d.getFullYear();
    return `${day}/${mon}/${yr}`;
  } catch {
    return '';
  }
}

function fallbackTitleFromDate(iso?: string | null) {
  const f = formatDateShort(iso);
  return f ? `Sesión ${f}` : 'Sesión sin título';
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

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // ✅ ActionSheet pro
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuConversationId, setMenuConversationId] = useState<string | null>(null);

  // Rename modal
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);

  // Realtime session
  const sessionRef = useRef<RealtimeSession | null>(null);
  const detachSessionHandlers = useRef<(() => void) | null>(null);

  // Transport resources
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Silent stream resources
  const silentAudioCtxRef = useRef<AudioContext | null>(null);
  const silentOscRef = useRef<OscillatorNode | null>(null);

  // Session ID para persistencia realtime transcript
  const sessionIdRef = useRef<string>(createSessionId());

  // Evitar guardar 2 veces finalize
  const finalizedRef = useRef<boolean>(false);

  // Autosave idle
  const autosaveTimerRef = useRef<any>(null);
  const lastAutosavedCharsRef = useRef<number>(0);

  const DEV_LOG = true;

  const openMenuForConversation = useCallback((id: string) => {
    setMenuConversationId(id);
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setTimeout(() => setMenuConversationId(null), 0);
  }, []);

  const findConversationById = useCallback(
    (id: string) => conversations.find((c) => String(c._id) === String(id)) || null,
    [conversations],
  );

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

  const autosaveSession = useCallback(async () => {
    if (!API_URL) return;
    if (!messages.length) return;

    const token = getStoredToken();
    if (!token) return;

    const transcript = buildTranscriptFromMessages().trim();
    if (!transcript) return;

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
          metadata: {
            platform: 'web',
            mode,
            source: 'coachVirtual.web',
            reason: 'idle_autosave',
            conversationId: activeConversationId || undefined,
          },
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
  }, [API_URL, activeConversationId, buildTranscriptFromMessages, logout, messages.length, mode, router]);

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
            conversationId: activeConversationId || undefined,
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
  }, [API_URL, activeConversationId, buildTranscriptFromMessages, logout, messages.length, mode, router]);

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void autosaveSession();
    }, 90_000);
  }, [autosaveSession]);

  useEffect(() => {
    if (!messages.length) return;
    scheduleAutosave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

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

  useEffect(() => {
    return () => {
      void finalizeSession();
      cleanupRealtime();
      try {
        const el = audioElRef.current;
        if (el && el.parentNode) el.parentNode.removeChild(el);
      } catch {}
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

  // ✅ Conversations API
  const fetchConversations = useCallback(async () => {
    if (!API_URL) return;
    const token = getStoredToken();
    if (!token) return;

    setLoadingConversations(true);
    try {
      const res = await fetch(`${API_URL}${DAN_CONVERSATIONS_ENDPOINT}?limit=50`, {
        method: 'GET',
        credentials: 'omit',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin(router, logout);
        return;
      }
      if (!res.ok) throw new Error(`GET conversations failed: ${res.status}`);

      const data = await res.json();
      const list: ConversationListItem[] = Array.isArray(data?.conversations) ? data.conversations : [];

      // ✅ opcional: pinned arriba (sin depender del backend)
      const sorted = [...list].sort((a, b) => {
        const ap = a.pinned ? 1 : 0;
        const bp = b.pinned ? 1 : 0;
        if (ap !== bp) return bp - ap;
        const ad = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
        const bd = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
        return bd - ad;
      });

      setConversations(sorted);
    } catch (e) {
      if (DEV_LOG) console.warn('[CONVERSATIONS] fetch error', e);
    } finally {
      setLoadingConversations(false);
    }
  }, [logout, router]);

  const createNewConversation = useCallback(async () => {
    if (!API_URL) return null;
    const token = getStoredToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_URL}${DAN_CONVERSATIONS_ENDPOINT}`, {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'dan_chat' }),
      });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin(router, logout);
        return null;
      }
      if (!res.ok) throw new Error(`POST conversation failed: ${res.status}`);

      const data = await res.json();
      const convoId = (data?.conversationId ?? '').toString();
      if (!convoId) return null;

      setActiveConversationId(convoId);
      setMessages([]);

      sessionIdRef.current = createSessionId();
      finalizedRef.current = false;
      lastAutosavedCharsRef.current = 0;

      cleanupRealtime();
      void fetchConversations();

      return convoId;
    } catch (e) {
      if (DEV_LOG) console.warn('[CONVERSATIONS] create error', e);
      return null;
    }
  }, [cleanupRealtime, fetchConversations, logout, router]);

  const openConversation = useCallback(
    async (conversationId: string) => {
      if (!API_URL) return;
      const token = getStoredToken();
      if (!token) return;

      try {
        const res = await fetch(
          `${API_URL}${DAN_CONVERSATIONS_ENDPOINT}/${encodeURIComponent(conversationId)}/messages?limit=60`,
          {
            method: 'GET',
            credentials: 'omit',
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (isUnauthorizedStatus(res.status)) {
          redirectToLogin(router, logout);
          return;
        }
        if (!res.ok) throw new Error(`GET messages failed: ${res.status}`);

        const data = await res.json();
        const msgs = Array.isArray(data?.messages) ? data.messages : [];

        const mapped: ChatMessage[] = msgs
          .filter((m: any) => m?.role === 'user' || m?.role === 'assistant')
          .map((m: any) => ({
            id: String(m._id ?? `${m.role}-${m.createdAt ?? Date.now()}`),
            role: m.role,
            content: String(m.text ?? ''),
          }));

        setActiveConversationId(conversationId);
        setMessages(mapped);

        sessionIdRef.current = createSessionId();
        finalizedRef.current = false;
        lastAutosavedCharsRef.current = 0;

        cleanupRealtime();
        setDrawerOpen(false);
      } catch (e) {
        if (DEV_LOG) console.warn('[CONVERSATIONS] open error', e);
      }
    },
    [cleanupRealtime, logout, router],
  );

  const patchConversation = useCallback(
    async (conversationId: string, payload: any) => {
      if (!API_URL) return false;
      const token = getStoredToken();
      if (!token) return false;

      try {
        const res = await fetch(`${API_URL}${DAN_CONVERSATIONS_ENDPOINT}/${encodeURIComponent(conversationId)}`, {
          method: 'PATCH',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (isUnauthorizedStatus(res.status)) {
          redirectToLogin(router, logout);
          return false;
        }
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          if (DEV_LOG) console.warn('[PATCH CONVO] failed', res.status, t);
          return false;
        }

        await fetchConversations();
        return true;
      } catch (e) {
        if (DEV_LOG) console.warn('[PATCH CONVO] error', e);
        return false;
      }
    },
    [fetchConversations, logout, router],
  );

  const softDeleteConversation = useCallback(
    async (conversationId: string) => {
      if (!API_URL) return false;
      const token = getStoredToken();
      if (!token) return false;

      try {
        const res = await fetch(`${API_URL}${DAN_CONVERSATIONS_ENDPOINT}/${encodeURIComponent(conversationId)}`, {
          method: 'DELETE',
          credentials: 'omit',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isUnauthorizedStatus(res.status)) {
          redirectToLogin(router, logout);
          return false;
        }
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          if (DEV_LOG) console.warn('[DELETE CONVO] failed', res.status, t);
          return false;
        }

        if (activeConversationId && String(activeConversationId) === String(conversationId)) {
          setActiveConversationId(null);
          setMessages([]);
          void createNewConversation();
        }

        await fetchConversations();
        return true;
      } catch (e) {
        if (DEV_LOG) console.warn('[DELETE CONVO] error', e);
        return false;
      }
    },
    [activeConversationId, createNewConversation, fetchConversations, logout, router],
  );

  useEffect(() => {
    if (!API_URL) return;
    if (!isBrowser()) return;

    void fetchConversations();
    if (!activeConversationId) {
      void createNewConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ✅ Persist: guardar cada mensaje en DanMessage
  const persistMessage = useCallback(
    async (role: 'user' | 'assistant', text: string) => {
      if (!API_URL) return;
      const token = getStoredToken();
      if (!token) return;
      if (!activeConversationId) return;

      try {
        const res = await fetch(
          `${API_URL}${DAN_CONVERSATIONS_ENDPOINT}/${encodeURIComponent(activeConversationId)}/messages`,
          {
            method: 'POST',
            credentials: 'omit',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ role, text }),
          },
        );

        if (isUnauthorizedStatus(res.status)) {
          redirectToLogin(router, logout);
          return;
        }

        if (!res.ok) {
          const t = await res.text().catch(() => '');
          if (DEV_LOG) console.warn('[PERSIST MSG] failed', res.status, t);
        } else {
          void fetchConversations();
        }
      } catch (e) {
        if (DEV_LOG) console.warn('[PERSIST MSG] network error', e);
      }
    },
    [activeConversationId, fetchConversations, logout, router],
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

            void persistMessage('user', transcript);

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

            void persistMessage('assistant', text);

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

            void persistMessage('assistant', transcript);

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
    [cleanupRealtime, connected, connecting, createSilentMediaStream, fetchClientSecret, logout, mode, persistMessage, router, user?._id],
  );

  const hangUp = useCallback(async () => {
    try {
      await finalizeSession();
    } finally {
      cleanupRealtime();
    }
  }, [cleanupRealtime, finalizeSession]);

  const sendTextMessage = useCallback(async () => {
    if (!trimmedQuestion) return;
    if (connecting) return;

    if (!activeConversationId) {
      const newId = await createNewConversation();
      if (!newId) return;
    }

    const textToSend = trimmedQuestion;
    setQuestion('');

    setMessages((prev) => [...prev, { id: `user-text-${Date.now()}`, role: 'user', content: textToSend }]);
    void persistMessage('user', textToSend);

    scrollToEnd();
    setAssistantThinking(true);

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
  }, [
    activeConversationId,
    connecting,
    connected,
    connectRealtime,
    createNewConversation,
    persistMessage,
    scheduleAutosave,
    scrollToEnd,
    trimmedQuestion,
  ]);

  const onPressCall = useCallback(async () => {
    if (connecting) return;

    if (!activeConversationId) {
      const newId = await createNewConversation();
      if (!newId) return;
    }

    if (connected && mode === 'audio') {
      await hangUp();
      return;
    }

    if (connected && mode === 'text') {
      cleanupRealtime();
    }

    await connectRealtime('audio');
  }, [activeConversationId, cleanupRealtime, connectRealtime, connected, connecting, createNewConversation, hangUp, mode]);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((v) => !v);
    if (!drawerOpen) void fetchConversations();
  }, [drawerOpen, fetchConversations]);

  // ✅ ActionSheet actions (usar menuConversationId)
  const actionRename = useCallback(() => {
    const id = menuConversationId;
    if (!id) return;

    const c = findConversationById(id);
    setRenamingId(String(id));
    setRenameValue(((c?.title ?? '') as string).trim());
    setRenameOpen(true);
    closeMenu();
  }, [closeMenu, findConversationById, menuConversationId]);

  const actionTogglePin = useCallback(async () => {
    const id = menuConversationId;
    if (!id) return;

    const c = findConversationById(id);
    const nextPinned = !Boolean(c?.pinned);

    // ⚠️ capturamos id antes de cerrar
    closeMenu();
    await patchConversation(String(id), { pinned: nextPinned });
  }, [closeMenu, findConversationById, menuConversationId, patchConversation]);

  const actionDelete = useCallback(async () => {
    const id = menuConversationId;
    if (!id) return;

    closeMenu();
    await softDeleteConversation(String(id));
  }, [closeMenu, menuConversationId, softDeleteConversation]);

  const submitRename = useCallback(async () => {
    if (!renamingId) return;
    const ok = await patchConversation(renamingId, { title: renameValue });
    if (ok) {
      setRenameOpen(false);
      setRenamingId(null);
    }
  }, [patchConversation, renameValue, renamingId]);

  return (
    <>
    <Stack.Screen
      options={{
        
        headerRight: () => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Abrir menú"
            onPress={toggleDrawer}
            style={styles.headerIconBtn}
          >
            <Feather name="menu" size={22} color="#000" />
          </TouchableOpacity>
        ),
      }}
    />
    <View style={styles.screen}>
      {/* Drawer overlay */}
      {drawerOpen && (
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />

          <View style={styles.drawerPanel}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Conversaciones</Text>

              <TouchableOpacity
                style={styles.drawerNewBtn}
                onPress={async () => {
                  await createNewConversation();
                  setDrawerOpen(false);
                }}
              >
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.drawerNewBtnText}>Nueva</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.drawerDivider} />

            {loadingConversations ? (
              <View style={styles.drawerLoading}>
                <ActivityIndicator />
                <Text style={styles.drawerLoadingText}>Cargando…</Text>
              </View>
            ) : (
              <ScrollView style={styles.drawerList} contentContainerStyle={{ paddingBottom: 18 }}>
                {conversations.length === 0 ? (
                  <Text style={styles.drawerEmpty}>Todavía no hay conversaciones.</Text>
                ) : (
                  conversations.map((c) => {
                    const dateBase = c.lastMessageAt || c.updatedAt || c.createdAt || null;
                    const title = (c.title ?? '').trim();
                    const shownTitle = title ? title : fallbackTitleFromDate(dateBase);
                    const isActive = activeConversationId && String(c._id) === String(activeConversationId);

                    return (
                      <View key={String(c._id)} style={[styles.drawerItem, isActive && styles.drawerItemActive]}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => void openConversation(String(c._id))}>
                          <View style={styles.drawerItemRow}>
                            <Text style={styles.drawerItemTitle} numberOfLines={1}>
                              {c.pinned ? '📌 ' : ''}
                              {shownTitle}
                            </Text>
                          </View>
                          <Text style={styles.drawerItemDate}>{formatDateShort(dateBase)}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.itemMenuBtn}
                          onPress={() => openMenuForConversation(String(c._id))}
                        >
                          <Feather name="more-vertical" size={18} color="#0f1b4c" />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>

          {/* ✅ ActionSheet PRO */}
          {menuOpen && (
            <View style={styles.actionSheetOverlay} pointerEvents="box-none">
              <Pressable style={styles.actionSheetBackdrop} onPress={closeMenu} />

              <View style={styles.actionSheetCard}>
                <TouchableOpacity style={styles.actionSheetItem} onPress={actionRename}>
                  <Text style={styles.actionSheetText}>Cambiar nombre</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionSheetItem} onPress={() => void actionTogglePin()}>
                  <Text style={styles.actionSheetText}>Pinear / Despinear</Text>
                </TouchableOpacity>

                <View style={styles.actionSheetDivider} />

                <TouchableOpacity style={styles.actionSheetItem} onPress={() => void actionDelete()}>
                  <Text style={[styles.actionSheetText, { color: '#b3261e' }]}>Borrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Rename modal */}
      <Modal transparent visible={renameOpen} animationType="fade" onRequestClose={() => setRenameOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setRenameOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Cambiar nombre</Text>
            <TextInput
              style={styles.modalInput}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Nuevo título…"
              placeholderTextColor="#6b7280"
              maxLength={80}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setRenameOpen(false)}>
                <Text style={styles.modalBtnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={() => void submitRename()}>
                <Text style={styles.modalBtnPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Header */}
      <View style={styles.fixedHeader}>
        <View style={styles.topRow}>
          <View style={{ width: 40 }} />

          <View style={{ flex: 1, alignItems: 'center' }}>
            <MedioLogo />
          </View>

          <View style={{ width: 40 }} />
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_H + GAP, paddingBottom: INPUT_H + GAP }]}
        keyboardShouldPersistTaps="never"
      >
        <View style={styles.chatWrapper}>
          {messages.length === 0 ? (
            <Text style={styles.emptyText}>Aún no hay mensajes. Escribí o iniciá llamada.</Text>
          ) : (
            messages.map((msg) => (
              <View
                key={msg.id}
                style={[styles.message, msg.role === 'user' ? styles.userMessage : styles.assistantMessage]}
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
            style={[
              styles.primaryActionButton,
              !trimmedQuestion && connected && mode === 'audio' && styles.primaryActionButtonActive,
              connecting && styles.primaryActionButtonDisabled,
            ]}
            onPress={trimmedQuestion ? sendTextMessage : onPressCall}
            disabled={connecting}
          >
            {connecting && !trimmedQuestion ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Feather
                name={
                  trimmedQuestion
                    ? 'send'
                    : connected && mode === 'audio'
                      ? 'phone-off'
                      : 'phone-call'
                }
                size={18}
                color="#fff"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {!!errorText && <Text style={styles.errorTextFixed}>{errorText}</Text>}
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerIconBtn: {
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 999,
  backgroundColor: 'transparent',
  minWidth: 44,
  alignItems: 'center',
  justifyContent: 'center',
},

  actionSheetOverlay: {
    position: 'absolute',
    inset: 0 as any,
    zIndex: 99999,
    elevation: 99999,
  },
  actionSheetBackdrop: {
    position: 'absolute',
    inset: 0 as any,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  actionSheetCard: {
    position: 'absolute',
    right: 12,
    top: 70,
    width: 240,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    paddingVertical: 6,
  },
  actionSheetItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionSheetText: {
    color: '#0f1b4c',
    fontWeight: '700',
    fontSize: 14,
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 6,
  },

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
    height: 140,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#ffffffff',
    zIndex: 30,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },

  header: { gap: 8, marginTop: 8 },
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
    height: 92,
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
    bottom: 92,
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

  primaryActionButton: {
    width: 50,
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1b4c',
    marginEnd: -3,
    marginBottom: 7
  },
  // Cuando está en llamada activa y el input está vacío, el botón representa “cortar”.
  primaryActionButtonActive: { backgroundColor: '#b3261e' },
  primaryActionButtonDisabled: { backgroundColor: '#9aa4c3' },

  // Drawer
  drawerOverlay: {
    position: 'absolute',
    inset: 0 as any,
    zIndex: 999,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawerPanel: {
    width: 340,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    paddingTop: 14,
    paddingHorizontal: 14,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f1b4c',
  },
  drawerNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#0f1b4c',
  },
  drawerNewBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  drawerDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },

  drawerLoading: { paddingVertical: 18, gap: 10, alignItems: 'center' },
  drawerLoadingText: { color: '#6b7280' },

  drawerList: { flex: 1 },
  drawerEmpty: { color: '#6b7280', paddingVertical: 10 },

  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eef2ff',
    backgroundColor: '#f8fafc',
    marginBottom: 10,
    gap: 8,
  },
  drawerItemActive: {
    borderColor: '#0f1b4c',
    backgroundColor: '#eef2ff',
  },
  drawerItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawerItemTitle: {
    color: '#0f1b4c',
    fontSize: 14,
    fontWeight: '800',
  },
  drawerItemDate: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  itemMenuBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },

  // modal rename
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: 420,
    maxWidth: '95%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#0f1b4c', marginBottom: 10 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d8dcf0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f1b4c',
    backgroundColor: '#fff',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  modalBtnGhost: { backgroundColor: '#eef2ff' },
  modalBtnGhostText: { color: '#0f1b4c', fontWeight: '800' },
  modalBtnPrimary: { backgroundColor: '#0f1b4c' },
  modalBtnPrimaryText: { color: '#fff', fontWeight: '800' },
});
