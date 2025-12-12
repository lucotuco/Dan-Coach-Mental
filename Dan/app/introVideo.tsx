import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View as RNView } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View, useThemeColor } from '@/components/Themed';
import { setIntroSeen, getIntroSeen } from '@/components/introSeen';

const INTRO_VIDEO_URL = require('../assets/videos/DanCoachDeporFINALEXPORT.mp4');

export default function IntroVideoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const nextRoute = useMemo(() => {
    return typeof params.next === 'string' && params.next.length ? params.next : '/';
  }, [params.next]);

  const skipBackground = useThemeColor({ light: '#0b164c', dark: '#e5e9ff' }, 'text');
  const skipTextColor = useThemeColor({ light: '#ffffff', dark: '#0b164c' }, 'background');

  const isWeb = Platform.OS === 'web';
  const [needsTap, setNeedsTap] = useState(false);

  const player = useVideoPlayer(INTRO_VIDEO_URL, (p) => {
    p.loop = false;
    if (isWeb) p.muted = true;
  });

  // Si ya vio el intro (por ejemplo, en native si arrancás directo acá), saltealo.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const seen = await getIntroSeen();
      if (mounted && seen) router.replace(nextRoute);
    })();
    return () => { mounted = false; };
  }, [router, nextRoute]);

  const handleFinish = async () => {
    player?.pause();
    await setIntroSeen(true);
    router.replace(nextRoute);
  };

  // Play más confiable en Web: después del mount
  useEffect(() => {
    if (!player) return;

    const tryPlay = async () => {
      try {
        const r = player.play();
        if (r instanceof Promise) await r;
      } catch {
        setNeedsTap(true);
      }
    };

    const id = requestAnimationFrame(() => { void tryPlay(); });
    return () => cancelAnimationFrame(id);
  }, [player]);

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('playToEnd', () => { void handleFinish(); });
    return () => sub.remove();
  }, [player, nextRoute]);

  const handleTapToPlay = async () => {
    setNeedsTap(false);
    // si querés audio al toque:
    if (isWeb) player.muted = false;
    try {
      const r = player.play();
      if (r instanceof Promise) await r;
    } catch {
      setNeedsTap(true);
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

        {needsTap && (
          <RNView style={styles.overlay}>
            <TouchableOpacity style={styles.tapButton} onPress={handleTapToPlay}>
              <Text style={styles.tapText}>Tocar para iniciar</Text>
            </TouchableOpacity>
          </RNView>
        )}

        <TouchableOpacity
          style={[styles.skipButton, { backgroundColor: skipBackground }]}
          onPress={() => { void handleFinish(); }}
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
  video: { flex: 1, width: '100%' },
  skipButton: {
    position: 'absolute', top: 20, right: 20,
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 20, opacity: 0.9,
  },
  skipText: { fontWeight: '800', fontSize: 14 },

  overlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#00000055',
  },
  tapButton: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 18, backgroundColor: '#ffffff' },
  tapText: { fontWeight: '800', fontSize: 16, color: '#000' },
});
