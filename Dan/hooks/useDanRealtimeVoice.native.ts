// hooks/useDanRealtimeVoice.native.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { RTCPeerConnection, mediaDevices, RTCSessionDescription } from 'react-native-webrtc';

type VoiceStatus = 'idle' | 'requesting_token' | 'connecting' | 'connected' | 'error';

type UseDanRealtimeVoiceOptions = {
  apiBaseUrl?: string;
  ownerId?: string;
};

type UseDanRealtimeVoiceResult = {
  status: VoiceStatus;
  error: string | null;
  startSession: () => Promise<void>;
  stopSession: () => void;
};

export function useDanRealtimeVoice(
  options: UseDanRealtimeVoiceOptions,
): UseDanRealtimeVoiceResult {
  const { apiBaseUrl, ownerId } = options;

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {
        console.warn('Error cerrando RTCPeerConnection', e);
      }
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startSession = useCallback(async () => {
    if (!apiBaseUrl) {
      setError('Falta configurar EXPO_PUBLIC_API_URL.');
      setStatus('error');
      return;
    }

    try {
      setError(null);
      setStatus('requesting_token');

      // 1) Pedir sesión Realtime (ephemeral key) a tu backend
      const resp = await fetch(`${apiBaseUrl}/api/realtime/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: ownerId }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data?.message || 'No se pudo crear sesión de voz.');
      }

      const ephemeralKey: string | undefined = data?.client_secret?.value;
      const model: string =
        data?.model || 'gpt-4o-realtime-preview-2024-12-17';

      if (!ephemeralKey) {
        throw new Error('La respuesta no incluye client_secret.value.');
      }

      setStatus('connecting');

      // 2) Crear PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      // 3) Obtener audio del micrófono
      const localStream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = localStream;

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // 4) Cuando termine ICE, mandamos la SDP a OpenAI
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          return; // todavía no terminó de juntar candidates
        }

        if (!pc.localDescription?.sdp) {
          return;
        }

        try {
          const answerResp = await fetch(
            `https://api.openai.com/v1/realtime?model=${encodeURIComponent(
              model,
            )}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${ephemeralKey}`,
                'Content-Type': 'application/sdp',
              },
              body: pc.localDescription.sdp,
            },
          );

          if (!answerResp.ok) {
            const text = await answerResp.text();
            throw new Error(text || 'Error en handshake WebRTC con OpenAI.');
          }

          const answerSdp = await answerResp.text();
          const answerDesc = new RTCSessionDescription({
            type: 'answer',
            sdp: answerSdp,
          });

          await pc.setRemoteDescription(answerDesc);
          setStatus('connected');
        } catch (err: any) {
          console.error('Error en handshake con OpenAI Realtime', err);
          setError(
            err?.message || 'Error en handshake con OpenAI Realtime.',
          );
          setStatus('error');
          cleanup();
        }
      };

      // 5) Crear oferta
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await pc.setLocalDescription(offer);
    } catch (err: any) {
      console.error('Error iniciando sesión de voz con DAN', err);
      setError(err?.message || 'Error iniciando sesión de voz con DAN.');
      setStatus('error');
      cleanup();
    }
  }, [apiBaseUrl, ownerId, cleanup]);

  const stopSession = useCallback(() => {
    cleanup();
    setStatus('idle');
    setError(null);
  }, [cleanup]);

  return {
    status,
    error,
    startSession,
    stopSession,
  };
}
