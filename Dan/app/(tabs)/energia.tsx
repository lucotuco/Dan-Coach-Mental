+225
-18

import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import type { AudioStatus } from 'expo-audio';
import { Subscription } from 'expo-modules-core';
import { Asset } from 'expo-asset';

const formatTime = (timeInSeconds: number | null | undefined) => {
  if (typeof timeInSeconds !== 'number' || Number.isNaN(timeInSeconds)) {
    return '00:00';
  }

  const totalSeconds = Math.max(0, Math.floor(timeInSeconds));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export default function LibraryScreenEnergia() {
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<AudioStatus | null>(null);
  const [showProgressBar, setShowProgressBar] = useState(false);

  const progressPercentage = playerStatus?.duration
    ? Math.min(
        1,
        Math.max(0, (playerStatus?.currentTime ?? 0) / playerStatus.duration)
      )
    : 0;

  useEffect(() => {
    let isMounted = true;
    let statusSubscription: Subscription | null = null;

    (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
        const meditationAsset = Asset.fromModule(
          require('@/assets/audios/reliable-safe-327618.mp3')
        );
        await meditationAsset.downloadAsync();
        if (!isMounted) return;
        const uri = meditationAsset.localUri ?? meditationAsset.uri;
        const player = createAudioPlayer(uri, { updateInterval: 250 });
        playerRef.current = player;
        statusSubscription = player.addListener('playbackStatusUpdate', (status) => {
          if (!isMounted) {
            return;
          }
          setPlayerStatus(status);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setShowProgressBar(false);
          }
        });
        setAudioReady(true);
      } catch (error) {
        console.warn('No se pudo preparar el audio de energía', error);
      }
    })();

    return () => {
      isMounted = false;
      statusSubscription?.remove();
      playerRef.current?.pause();
      playerRef.current?.remove();
      playerRef.current = null;
    };
  }, []);

  const handlePlayPausePress = () => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
      return;
    }

    const finished =
      playerStatus?.didJustFinish ||
      (!!playerStatus?.duration && playerStatus.currentTime >= playerStatus.duration);

    if (!playerStatus || finished) {
      player.seekTo(0);
    }

    player.play();
    setIsPlaying(true);
    setShowProgressBar(true);
  };

  const seekBySeconds = (seconds: number) => {
    const player = playerRef.current;
    if (!player) return;

    const current = playerStatus?.currentTime ?? player.currentTime ?? 0;
    const duration = playerStatus?.duration ?? player.duration ?? 0;
    const maxTime = duration > 0 ? duration : Number.MAX_VALUE;
    const next = Math.min(maxTime, Math.max(0, current + seconds));
    player.seekTo(next);
  };

  const handleSkipBack = () => seekBySeconds(-10);
  const handleSkipForward = () => seekBySeconds(10);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <MedioLogo />
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Movilidad suave para recargar energía</Text>

        {isPlaying ? (
          <View style={styles.playbackControls}>
            <Pressable
              accessibilityRole="button"
              style={styles.skipButton}
              onPress={handleSkipBack}>
              <Ionicons name="play-back" size={30} color="#031355" />
              <Text style={styles.skipLabel}>-10s</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handlePlayPausePress}
              style={styles.controlButton}>
              <Ionicons name="pause" size={28} color="#fff" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={styles.skipButton}
              onPress={handleSkipForward}>
              <Ionicons name="play-forward" size={30} color="#031355" />
              <Text style={styles.skipLabel}>+10s</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.primaryButton, !audioReady && styles.primaryButtonDisabled]}
            onPress={handlePlayPausePress}
            accessibilityRole="button"
            disabled={!audioReady}>
            <Text style={styles.primaryButtonText}>Iniciar</Text>
          </Pressable>
        )}
        {showProgressBar && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Tiempo reproducido</Text>
            <Text style={styles.progressTime}>
              {formatTime(playerStatus?.currentTime ?? 0)}
              {playerStatus?.duration
                ? ` / ${formatTime(playerStatus?.duration)}`
                : ''}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      )}
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.infoTitle}>Respira hondo...</Text>
        <Text style={styles.infoParagraph}>
          Tu cuerpo empieza a despertarse. Activá desde la calma.
        </Text>
        <Text style={styles.infoParagraph}>Aflojá tensiones sin forzar.</Text>
        <Text style={styles.infoParagraph}>
          Liberá la carga del día y dale espacio a tu energía. Dale movilidad al centro de tu
          cuerpo para recuperar vitalidad.
        </Text>
        <Text style={styles.infoParagraph}>
          Ya activaste tu energía. Estás listo para continuar tu día con más calma y ligereza.
        </Text>
      </View>

      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#26324b',
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: '#031355',
  },
  primaryButton: {
    backgroundColor: '#031355',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: '#031355',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '33%',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#031355',
  },
  infoBlock: {
    gap: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#031355',
  },
  infoParagraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4a4f63',
  },
  progressContainer: {
    backgroundColor: '#f5f6fb',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#031355',
  },
  progressTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a4f63',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#d9dff5',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#031355',
  },
});