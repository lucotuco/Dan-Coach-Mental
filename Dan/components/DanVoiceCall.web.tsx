import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  RealtimeAgent,
  RealtimeSession,
  type RealtimeMessageItem,
} from '@openai/agents/realtime';

const REALTIME_TOKEN_ENDPOINT = '/api/realtime/client-secret';

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
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sessionRef = useRef<RealtimeSession | null>(null);

  const agent = useMemo(
    () =>
      new RealtimeAgent({
        name: 'DAN',
        instructions:
          instructions ??
          'Sos DAN, un coach mental deportivo. Hablá en tono cercano, con preguntas cortas y concretas. Ayudá a la persona a enfocarse, regular emociones y pasar a la acción.',
      }),
    [instructions]
  );

  // Cerrar la sesión si el componente se desmonta
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
    };
  }, []);

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
      const res = await fetch(`${API_URL}${REALTIME_TOKEN_ENDPOINT}`);
      if (!res.ok) {
        throw new Error('No se pudo obtener el token efímero para Realtime.');
      }

      const data = await res.json();

      const apiKey: string =
        data?.value ?? data?.client_secret?.value ?? data?.token ?? '';

      if (!apiKey) {
        throw new Error('El backend no devolvió un client_secret válido.');
      }

      const session = new RealtimeSession(agent, {
        model: 'gpt-realtime',

        // Podés tunear acá config de audio / turn detection si querés
      });

      sessionRef.current = session;

      // Cada vez que se agrega algo al historial (usuario o asistente)
      session.on('history_added', (item) => {
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
      });

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
    setConnected(false);
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
      <Text style={styles.title}>Hablar con DAN (voz en tiempo real)</Text>

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
