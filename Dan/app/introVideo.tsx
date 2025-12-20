import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View as RNView } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View, useThemeColor } from '@/components/Themed';

const INTRO_VIDEO_URL = require('../assets/videos/DanCoachDeporFINALEXPORT.mp4');
const INTRO_KEY = 'dan_intro_seen_session_v1';

export default function IntroVideoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();

  const nextRoute = useMemo(() => {
    return typeof params.next === 'string' && params.next.length ? params.next : '/';
  }, [params.next]);

  const skipBackground = useThemeColor({ light: '#0b164c', dark: '#e5e9ff' }, 'text');
  const skipTextColor = useThemeColor({ light: '#ffffff', dark: '#0b164c' }, 'background');

  const isWeb = Platform.OS === 'web';
  const [started, setStarted] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);

  const player = useVideoPlayer(INTRO_VIDEO_URL, (p) => {
    p.loop = false;
    if (isWeb) p.muted = true; // el usuario habilita sonido al tocar play
  });

  const markSeen = () => {
    if (isWeb && typeof window !== 'undefined') {
      window.sessionStorage.setItem(INTRO_KEY, '1');
    }
  };

  const handleFinish = () => {
    markSeen();
    router.replace(nextRoute);
  };

  const handleSkip = () => {
    try {
      player?.pause();
    } catch {}
    handleFinish();
  };

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('playToEnd', () => handleFinish());
    return () => sub.remove();
  }, [player, nextRoute]);

  const handlePlay = async () => {
    setPlayError(null);
    try {
      if (isWeb) player.muted = false; // gesto del usuario => habilita audio
      const r = player.play();
      if (r instanceof Promise) await r;
      setStarted(true);
    } catch (e: any) {
      setPlayError(e?.message ?? 'No se pudo reproducir el video.');
      setStarted(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
        />

        {!started && (
          <RNView style={styles.overlay}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Reproducir video"
              activeOpacity={0.9}
              style={styles.playButton}
              onPress={handlePlay}
            >
              <RNView style={styles.playTriangle} />
            </TouchableOpacity>

            {!!playError && (
              <Text style={styles.errorText}>{String(playError)}</Text>
            )}
          </RNView>
        )}

        <TouchableOpacity
          style={[styles.skipButton, { backgroundColor: skipBackground }]}
          onPress={handleSkip}
        >
          <Text style={[styles.skipText, { color: skipTextColor }]}>Saltar video</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },

  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    opacity: 0.9,
  },
  skipText: { fontWeight: '800', fontSize: 14 },

  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000066',
    paddingHorizontal: 24,
  },

  // Botón circular de play
  playButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Triángulo "play" (CSS-like con borders)
  playTriangle: {
    marginLeft: 6, // centra visualmente el triángulo
    width: 0,
    height: 0,
    borderTopWidth: 14,
    borderBottomWidth: 14,
    borderLeftWidth: 22,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#000',
  },

  errorText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#fff',
    opacity: 0.85,
    fontSize: 12,
  },
});
