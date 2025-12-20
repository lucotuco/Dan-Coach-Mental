import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

export type DidAvatarHandle = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  speakAudioUrl: (audioUrl: string) => Promise<void>;
  speakText: (text: string) => Promise<void>;
  isConnected: () => boolean;
};

type Props = {
  agentId: string;
  clientKey: string;
  height?: number;
  /**
   * Recomendado si vas a reproducir el audio por tu lado (OpenAI Realtime).
   * Evita autoplay issues + audio duplicado.
   */
  muted?: boolean;
  onError?: (msg: string) => void;
  onConnectedChange?: (connected: boolean) => void;
};

export const DidAvatarWeb = forwardRef<DidAvatarHandle, Props>(
  ({ agentId, clientKey, height = 320, muted = true, onError, onConnectedChange }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const managerRef = useRef<any>(null);
    const srcObjectRef = useRef<MediaStream | null>(null);

    const speakQueueRef = useRef<Promise<void>>(Promise.resolve());
    const [idleUrl, setIdleUrl] = useState<string>('');
    const [connected, setConnected] = useState(false);

    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

    const safeError = (e: any, prefix: string) => {
      const msg = `${prefix}: ${e?.message ?? String(e)}`;
      console.error(msg);
      onError?.(msg);
    };

    useEffect(() => {
      if (!isWeb) return;

      let cancelled = false;

      (async () => {
        try {
          // Dynamic import para no romper bundles nativos
          const mod: any = await import('@d-id/client-sdk');
          const sdk = mod?.default ?? mod;

          const callbacks = {
            onSrcObjectReady(value: MediaStream) {
              srcObjectRef.current = value;
              if (videoRef.current) {
                videoRef.current.src = '';
                videoRef.current.srcObject = value;
              }
              return value;
            },

            onVideoStateChange(state: string) {
              // STOP => volver a idle_video (si existe)
              const v = videoRef.current;
              if (!v) return;

              if (state === 'STOP') {
                try {
                  v.srcObject = null;
                } catch {}
                if (idleUrl) v.src = idleUrl;
              } else {
                v.src = '';
                if (srcObjectRef.current) v.srcObject = srcObjectRef.current;
              }
            },

            onConnectionStateChange(_state: string) {
              // opcional: debug
            },

            onError(error: any, errorData: any) {
              const msg = `D-ID error: ${String(error)}${errorData ? ` ${JSON.stringify(errorData)}` : ''}`;
              console.error(msg);
              onError?.(msg);
            },
          };

          const streamOptions = {
            // “on/auto” depende del entorno; vos venías bien con 'on'
            compatibilityMode: 'on',
            streamWarmup: true,
          };

          const auth = { type: 'key', clientKey };
          const manager = await sdk.createAgentManager(agentId, { auth, callbacks, streamOptions });
          if (cancelled) return;

          managerRef.current = manager;

          const idle = manager?.agent?.presenter?.idle_video;
          if (typeof idle === 'string' && idle.length > 0) {
            setIdleUrl(idle);
            if (videoRef.current) {
              videoRef.current.srcObject = null;
              videoRef.current.src = idle;
            }
          }
        } catch (e: any) {
          safeError(e, 'No pude inicializar D-ID');
        }
      })();

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agentId, clientKey, isWeb]);

    const stopLocalTracks = () => {
      try {
        const v = videoRef.current;
        const ms = (v?.srcObject as MediaStream | null) ?? null;
        ms?.getTracks()?.forEach((t) => t.stop());
      } catch {}
      try {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = idleUrl || '';
        }
      } catch {}
      srcObjectRef.current = null;
    };

    useImperativeHandle(ref, () => ({
      connect: async () => {
        if (!isWeb) return;
        if (!managerRef.current) throw new Error('D-ID manager not ready');

        await managerRef.current.connect();

        // Autoplay policies: hacerlo desde el gesto del usuario (tu botón)
        const v = videoRef.current;
        if (v) {
          v.muted = !!muted;
          v.playsInline = true;
          v.autoplay = true;
          await v.play().catch(() => {});
        }

        setConnected(true);
        onConnectedChange?.(true);
      },

      disconnect: async () => {
        if (!isWeb) return;
        try {
          if (managerRef.current) await managerRef.current.disconnect();
        } finally {
          stopLocalTracks();
          setConnected(false);
          onConnectedChange?.(false);
        }
      },

      speakAudioUrl: async (audioUrl: string) => {
        if (!isWeb) return;
        if (!managerRef.current) throw new Error('D-ID manager not ready');
        if (!audioUrl) return;

        // Cola: asegura orden y evita overlap
        speakQueueRef.current = speakQueueRef.current.then(async () => {
          await managerRef.current.speak({ type: 'audio', audio_url: audioUrl });
        });

        return speakQueueRef.current;
      },

      speakText: async (text: string) => {
        if (!isWeb) return;
        if (!managerRef.current) throw new Error('D-ID manager not ready');
        const clean = (text || '').trim();
        if (!clean) return;

        speakQueueRef.current = speakQueueRef.current.then(async () => {
          await managerRef.current.speak({ type: 'text', input: clean });
        });

        return speakQueueRef.current;
      },

      isConnected: () => connected,
    }));

    if (!isWeb) return null;

    return (
      <View style={{ height, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' }}>
        <video
          ref={(el) => (videoRef.current = el)}
          autoPlay
          playsInline
          muted={muted}
          style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#000' }}
        />
      </View>
    );
  },
);
