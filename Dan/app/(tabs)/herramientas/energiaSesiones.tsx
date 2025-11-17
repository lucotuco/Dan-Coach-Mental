import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import type { AudioStatus } from 'expo-audio';
import { Subscription } from 'expo-modules-core';
import { Asset } from 'expo-asset';
import { Stack, useRouter } from 'expo-router';

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
  const router = useRouter();
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const scriptScrollRef = useRef<ScrollView | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<AudioStatus | null>(null);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [scriptContainerHeight, setScriptContainerHeight] = useState(0);
  const [scriptContentHeight, setScriptContentHeight] = useState(0);

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
      scriptScrollRef.current?.scrollTo({ y: 0, animated: false });
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

  useEffect(() => {
    if (!isPlaying) return;
    const duration = playerStatus?.duration ?? 0;
    const current = playerStatus?.currentTime ?? 0;
    if (!duration || !scriptScrollRef.current) return;
    const scrollableHeight = Math.max(0, scriptContentHeight - scriptContainerHeight);
    if (scrollableHeight <= 0) return;
    const progress = Math.min(1, Math.max(0, current / duration));
    scriptScrollRef.current.scrollTo({
      y: scrollableHeight * progress,
      animated: true,
    });
  }, [isPlaying, playerStatus?.currentTime, playerStatus?.duration, scriptContentHeight, scriptContainerHeight]);

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={() => router.push('/(tabs)/herramientas/energia')}
              style={styles.headerBackButton}
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={24} color="#031355" />
            </Pressable>
          ),
        }}
      />
      <View style={styles.screen}>
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
        <View
          style={styles.scriptContainer}
          onLayout={(event) => setScriptContainerHeight(event.nativeEvent.layout.height)}
        >
          <ScrollView
            ref={scriptScrollRef}
            onContentSizeChange={(_, height) => setScriptContentHeight(height)}
            contentContainerStyle={styles.infoBlock}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.infoTitle}>Respira hondo...</Text>
            <Text style={styles.infoParagraph}>
              Bienvenido a esta breve sesión para renovar tu energía.
              Buscá una posición cómoda… relajá los hombros… y cerrá los ojos suavemente.
            </Text>
            <Text style={styles.infoParagraph}>Inhalá profundo por la nariz… 1, 2, 3, 4… sostené 1, 2… exhalá lento 1, 2, 3, 4.
              Repetí dos veces más.
            </Text>
            <Text style={styles.infoParagraph}>
              Ahora llevá tu atención al centro del pecho.
              Imaginá una luz tibia, suave, que comienza a encenderse… como una chispa interna que vuelve a tomar fuerza.
            </Text>
            <Text style={styles.infoParagraph}>
              Ya activaste tu energía. Estás listo para continuar tu día con más calma y ligereza.Cada inhalación alimenta esa chispa.
              Cada exhalación libera cansancio, tensión y pensamientos que te drenan.
            </Text>
            <Text style={styles.infoParagraph}>
              Decite internamente:
              “Mi energía vuelve a mí. Me recargo. Me renuevo.”
            </Text>
            <Text style={styles.infoParagraph}>
              Sentí cómo esa luz crece y se expande por tu cuerpo.
              Piernas, brazos, cuello… todo vuelve a activarse con armonía.
            </Text>
            <Text style={styles.infoParagraph}>
              Respirá profundo una vez más.
              Y cuando estés listo… abrí los ojos.
              Tu energía está volviendo.
            </Text>
          </ScrollView>
        </View>

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    gap: 24,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2ff',
    marginLeft: 20
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
    paddingBottom: 48,
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
  scriptContainer: {
    flex: 1,
  },
});
