import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { RealtimeAgent, RealtimeSession, type RealtimeMessageItem } from '@openai/agents/realtime';
import { useAuth } from '@/components/AuthContext';

const REALTIME_TOKEN_ENDPOINT = '/api/realtime/client-secret';
const TOPIC_SHIFT_ENDPOINT = '/api/realtime/topic-shift';
const REALTIME_SESSION_END_ENDPOINT = '/api/realtime/session-end';

const logoSource = require('@/assets/images/Dan-Image2.jpg');

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

function createSessionId(): string {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto?.randomUUID) return crypto.randomUUID();
  } catch {}
  return `rt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildTranscript(messages: ChatMessage[]) {
  return messages.map((m) => `${m.role === 'user' ? 'Usuario' : 'DAN'}: ${m.text}`).join('\n');
}

async function applyInstructions(session: RealtimeSession, instructions: string) {
  const anySession = session as any;

  if (process.env.DEBUG) {
    console.log('==== SESSION.UPDATE (instructions) ====');
    console.log(instructions.slice(0, Number(process.env.MAX ?? 2500)));
    console.log('==== END SESSION.UPDATE ====');
  }

  if (typeof anySession.update === 'function') {
    await anySession.update({ instructions });
    return;
  }

  if (typeof anySession.send === 'function') {
    anySession.send({ type: 'session.update', session: { instructions } });
    return;
  }

  console.warn('No encontré método para session.update en este SDK');
}

export default function DanVoiceCall() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<'user' | 'assistant' | null>(null);

  const sessionRef = useRef<RealtimeSession | null>(null);
  const detachSessionHandlers = useRef<(() => void) | null>(null);

  const activeSpeakerTimeout = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>(createSessionId());
  const finalizedRef = useRef(false);

  useEffect(() => {
    return () => {
      void finalizeAndClose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markSpeaker = (role: 'user' | 'assistant') => {
    if (activeSpeakerTimeout.current) clearTimeout(activeSpeakerTimeout.current);
    setActiveSpeaker(role);
    activeSpeakerTimeout.current = setTimeout(() => setActiveSpeaker(null), 2600);
  };

  const clearActiveSpeaker = () => {
    if (activeSpeakerTimeout.current) {
      clearTimeout(activeSpeakerTimeout.current);
      activeSpeakerTimeout.current = null;
    }
    setActiveSpeaker(null);
  };

  const callTopicShift = async (text: string) => {
    try {
      if (!connected || !sessionRef.current) return;
      const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
      if (!API_URL) return;

      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      const resp = await fetch(`${API_URL}${TOPIC_SHIFT_ENDPOINT}`, {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: sessionIdRef.current, text }),
      });

      if (!resp.ok) return;
      const data = await resp.json();

      if (process.env.DEBUG) {
        console.log('==== TOPIC SHIFT DETECTED ====');
        console.log('similarity:', data?.similarity);
        console.log('new instructions:', String(data.instructions).slice(0, Number(process.env.MAX ?? 2500)));
        console.log('==== END TOPIC SHIFT ====');
      }

      if (data?.shifted && data?.instructions && sessionRef.current) {
        await applyInstructions(sessionRef.current, String(data.instructions));
      }
    } catch (e) {
      console.warn('Topic shift check failed:', e);
    }
  };

  const finalizeSession = async () => {
    if (finalizedRef.current) return;
    if (!messages.length) return;

    const transcript = buildTranscript(messages).trim();
    if (!transcript) return;

    const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
    if (!API_URL) return;

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

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
          metadata: { platform: 'web', source: 'DanVoiceCall.web' },
        }),
      });

      if (!resp.ok) {
        finalizedRef.current = false;
        const t = await resp.text().catch(() => '');
        console.warn('[DanVoiceCall finalize] failed', resp.status, t);
      }
    } catch (e) {
      finalizedRef.current = false;
      console.warn('No se pudo finalizar sesión realtime:', e);
    }
  };

  const finalizeAndClose = async () => {
    try {
      await finalizeSession();
    } finally {
      if (detachSessionHandlers.current) {
        detachSessionHandlers.current();
        detachSessionHandlers.current = null;
      }
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
      clearActiveSpeaker();
      setConnected(false);
    }
  };

  const handleConnect = async () => {
    if (Platform.OS !== 'web') {
      setError('La llamada en tiempo real solo está disponible en la versión web por ahora.');
      return;
    }

    if (connecting || connected) return;

    setError(null);
    setConnecting(true);
    setMessages([]);
    finalizedRef.current = false;
    sessionIdRef.current = createSessionId();

    try {
      const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

      const userId = user?._id;
      const qs = new URLSearchParams();
      if (userId) qs.set('userId', String(userId));
      qs.set('mode', 'audio'); // en voice call

      const res = await fetch(`${API_URL}${REALTIME_TOKEN_ENDPOINT}?${qs.toString()}`, {
        method: 'GET',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
      });

      if (!res.ok) throw new Error('No se pudo obtener el token efímero para Realtime.');

      const data = await res.json();
      const apiKey: string = data?.value ?? data?.client_secret?.value ?? data?.token ?? '';
      if (!apiKey) throw new Error('El backend no devolvió un client_secret válido.');

      const backendInstructions = data?.session?.instructions ?? '';

      if (process.env.DEBUG) {
        console.log('==== REALTIME BOOTSTRAP INSTRUCTIONS ====');
        console.log(backendInstructions.slice(0, Number(process.env.MAX ?? 2500)));
        console.log('==== END INSTRUCTIONS ====');
      }

      const agent = new RealtimeAgent({ name: 'DAN', instructions: backendInstructions });
      const session = new RealtimeSession(agent, { model: 'gpt-realtime' });
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

      addHandler('history_added', (item) => {
        if (item.type !== 'message') return;

        const msg = item as RealtimeMessageItem;
        if (msg.role === 'system') return;

        const role = msg.role === 'assistant' ? 'assistant' : 'user';

        const text = (msg.content as any[])
          .map((c) => {
            if ('text' in c && c.text) return c.text as string;
            if ('transcript' in c && c.transcript) return c.transcript as string;
            return '';
          })
          .join(' ')
          .trim();

        if (!text) return;

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === msg.itemId);
          if (exists) return prev;
          return [...prev, { id: msg.itemId, role, text }];
        });

        markSpeaker(role);

        if (role === 'user') void callTopicShift(text);
      });

      addHandler('input_audio_buffer.speech_started', () => markSpeaker('user'));
      addHandler('input_audio_buffer.speech_stopped', () => clearActiveSpeaker());

      addHandler('response.speech_started', () => markSpeaker('assistant'));
      addHandler('response.speech_stopped', () => clearActiveSpeaker());

      detachSessionHandlers.current = () => {
        unsubscribers.forEach((fn) => fn());
        unsubscribers.length = 0;
      };

      await session.connect({ apiKey });
      setConnected(true);
    } catch (e: any) {
      console.error('Error al conectar Realtime:', e);
      setError(e?.message ?? 'Error al conectar con DAN en tiempo real.');
      await finalizeAndClose();
    } finally {
      setConnecting(false);
    }
  };

  const handleHangUp = async () => {
    await finalizeAndClose();
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.notSupported}>
        <Text style={styles.notSupportedText}>
          La llamada con DAN en tiempo real está disponible solo en la versión web del MVP.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, connected ? styles.statusDotOn : styles.statusDotOff]} />
        <Text style={styles.statusText}>
          {connected ? 'Conectado (DAN te escucha)' : connecting ? 'Conectando con DAN...' : 'Desconectado'}
        </Text>
      </View>

      <View style={styles.voiceVisualizer}>
        <View style={styles.circleWrapper}>
          <View style={[styles.wave, activeSpeaker === 'assistant' ? styles.assistantWave : styles.inactiveWave]} />
          <View style={[styles.wave, styles.waveSecond, activeSpeaker === 'user' ? styles.userWave : styles.inactiveWave]} />
          <View style={[styles.circle, activeSpeaker === 'assistant' && styles.assistantCircle, activeSpeaker === 'user' && styles.userCircle]}>
            <Image accessibilityRole="image" source={logoSource} resizeMode="cover" style={[styles.circle]} />
          </View>
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={connected ? handleHangUp : handleConnect}
          disabled={connecting}
        >
          {connecting ? <ActivityIndicator /> : <Text style={styles.buttonText}>{connected ? 'Colgar' : 'Conectar con DAN'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 999, marginRight: 8 },
  statusDotOn: { backgroundColor: '#2ecc71' },
  statusDotOff: { backgroundColor: '#e74c3c' },
  statusText: { fontSize: 13, color: '#eee' },
  buttonsRow: { flexDirection: 'row', marginTop: 12 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
  },
  primaryButton: { backgroundColor: '#6c5ce7', marginRight: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  errorText: { marginTop: 8, color: '#ff7675', fontSize: 13 },
  voiceVisualizer: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2e2e3a',
    backgroundColor: '#0c0c16',
  },
  circleWrapper: { marginTop: 12, alignItems: 'center', justifyContent: 'center', height: 180 },
  wave: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.4,
  },
  waveSecond: { width: 200, height: 200 },
  assistantWave: { borderColor: '#6c5ce7', shadowColor: '#6c5ce7', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } },
  userWave: { borderColor: '#2ecc71', shadowColor: '#2ecc71', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } },
  inactiveWave: { borderColor: '#2e2e3a', shadowOpacity: 0 },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: '#1d1d27',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2e2e3a',
  },
  assistantCircle: { borderColor: '#6c5ce7', backgroundColor: '#151426' },
  userCircle: { borderColor: '#2ecc71', backgroundColor: '#12241b' },
  notSupported: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
  notSupportedText: { color: '#ddd' },
});
