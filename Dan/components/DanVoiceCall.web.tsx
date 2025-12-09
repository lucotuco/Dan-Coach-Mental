import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import {
  RealtimeAgent,
  RealtimeSession,
  type RealtimeMessageItem,
} from '@openai/agents/realtime';
import { useAuth } from '@/components/AuthContext'

const REALTIME_TOKEN_ENDPOINT = '/api/realtime/client-secret';
const logoSource = require('../assets/images/WhatsApp Image 2025-12-03 at 12.49.08_88d6917d.jpg');

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type DanVoiceCallProps = {
  instructions?: string;
};

export default function DanVoiceCall({ instructions }: DanVoiceCallProps) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<'user' | 'assistant' | null>(
    null,
  );

  const activeSpeakerRef = useRef<'user' | 'assistant' | null>(null);
  const activeSpeakerTimeout = useRef<NodeJS.Timeout | null>(null);
  const detachSessionHandlers = useRef<(() => void) | null>(null);

  const sessionRef = useRef<RealtimeSession | null>(null);




  // Cerrar la sesión si el componente se desmonta
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

  const handleConnect = async () => {
    if (Platform.OS !== 'web') {
      setError('La llamada en tiempo real solo está disponible en la versión web por ahora.');
      return;
    }

    if (connecting || connected) return;

    setError(null);
    setConnecting(true);
    setMessages([]);

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
      const token = typeof localStorage !== 'undefined'
        ? localStorage.getItem('token')
        : null;

      const userId = user?._id;  
      console.log('userId front:', userId);

      const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';

      const res = await fetch(`${API_URL}${REALTIME_TOKEN_ENDPOINT}${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
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

      console.log('Instrucciones desde backend:', backendInstructions);

      // 👇 Creamos el agente usando ESA string
      const agent = new RealtimeAgent({
        name: 'DAN',
        instructions: backendInstructions,
      });

      const session = new RealtimeSession(agent, {
        model: 'gpt-realtime',

        // Podés tunear acá config de audio / turn detection si querés
      });
      console.log('log instrucciones', instructions);

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

      // Cada vez que se agrega algo al historial (usuario o asistente)
      addHandler('history_added', (item) => {
        if (item.type !== 'message') return;

        const msg = item as RealtimeMessageItem;
        if (msg.role === 'system') return;

        const role = msg.role === 'assistant' ? 'assistant' : 'user';

        // Unimos texto y/o transcript (para audio)
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
      });

      // Detectar actividad de voz en vivo
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

      // En navegador, esto abre WebRTC, pide micrófono y configura audio I/O automáticamente
      await session.connect({ apiKey });

      setConnected(true);
    } catch (e: any) {
      console.error('Error al conectar Realtime:', e);
      setError(e?.message ?? 'Error al conectar con DAN en tiempo real.');
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
      if (detachSessionHandlers.current) {
        detachSessionHandlers.current();
        detachSessionHandlers.current = null;
      }
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  const handleHangUp = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (detachSessionHandlers.current) {
      detachSessionHandlers.current();
      detachSessionHandlers.current = null;
    }
    setConnected(false);
    clearActiveSpeaker();
  };

  // Si por accidente lo montás en native, muestra aviso y no rompe
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
        <View
          style={[
            styles.statusDot,
            connected ? styles.statusDotOn : styles.statusDotOff,
          ]}
        />
        <Text style={styles.statusText}>
          {connected
            ? 'Conectado (DAN te escucha)'
            : connecting
              ? 'Conectando con DAN...'
              : 'Desconectado'}
        </Text>
      </View>

      <View style={styles.voiceVisualizer}>
        <View style={styles.circleWrapper}>
          <View
            style={[
              styles.wave,
              activeSpeaker === 'assistant'
                ? styles.assistantWave
                : styles.inactiveWave,
            ]}
          />
          <View
            style={[
              styles.wave,
              styles.waveSecond,
              activeSpeaker === 'user' ? styles.userWave : styles.inactiveWave,
            ]}
          />
          <View
            style={[
              styles.circle,
              activeSpeaker === 'assistant' && styles.assistantCircle,
              activeSpeaker === 'user' && styles.userCircle,
            ]}
          >
            <Image
            accessibilityRole="image"
            source={logoSource}
            resizeMode="cover"
            style={[styles.circle]}
            />
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
          {connecting ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>
              {connected ? 'Colgar' : 'Conectar con DAN'}
            </Text>
          )}
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#fff',
  },
  subtitle: {
    marginTop: 16,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#ddd',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  statusDotOn: {
    backgroundColor: '#2ecc71',
  },
  statusDotOff: {
    backgroundColor: '#e74c3c',
  },
  statusText: {
    fontSize: 13,
    color: '#eee',
  },
  buttonsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
  },
  primaryButton: {
    backgroundColor: '#6c5ce7',
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    marginTop: 8,
    color: '#ff7675',
    fontSize: 13,
  },
  voiceVisualizer: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2e2e3a',
    backgroundColor: '#0c0c16',
  },
  visualizerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  visualizerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#b8b8c8',
  },
  circleWrapper: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  wave: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.4,
  },
  waveSecond: {
    width: 200,
    height: 200,
  },
  assistantWave: {
    borderColor: '#6c5ce7',
    shadowColor: '#6c5ce7',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  userWave: {
    borderColor: '#2ecc71',
    shadowColor: '#2ecc71',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  inactiveWave: {
    borderColor: '#2e2e3a',
    shadowOpacity: 0,
  },
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
  assistantCircle: {
    borderColor: '#6c5ce7',
    backgroundColor: '#151426',
  },
  userCircle: {
    borderColor: '#2ecc71',
    backgroundColor: '#12241b',
  },
  circleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  messagesBox: {
    maxHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 8,
    backgroundColor: '#000',
    marginTop: 8,
  },
  messageBubble: {
    padding: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2c3e50',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e272e',
  },
  messageRole: {
    fontSize: 11,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    color: '#fff',
  },
  emptyText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  notSupported: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111',
  },
  notSupportedText: {
    color: '#fff',
    fontSize: 13,
  },
});
