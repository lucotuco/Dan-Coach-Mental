import { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, View, useThemeColor } from '@/components/Themed';

const INTRO_VIDEO_URL = require('../assets/videos/DanCoachDeporFINALEXPORT.mp4');

export default function IntroVideoScreen() {
  const router = useRouter();

  const skipBackground = useThemeColor(
    { light: '#0b164c', dark: '#e5e9ff' },
    'text'
  );
  const skipTextColor = useThemeColor(
    { light: '#ffffff', dark: '#0b164c' },
    'background'
  );

  const isWeb = Platform.OS === 'web';

  const player = useVideoPlayer(INTRO_VIDEO_URL, (p) => {
    p.loop = false;

    // 🔊 En web lo arrancamos muteado para que el autoplay no lo bloquee
    if (isWeb) {
      p.muted = true;
    }

    p.play();
  });

  const handleSkip = () => {
    // Por las dudas pausamos antes de navegar
    player?.pause();
    router.replace('/');
  };

  useEffect(() => {
    if (!player) return;

    // 👇 Evento oficial de expo-video para cuando el video llega al final
    const sub = player.addListener('playToEnd', () => {
      handleSkip();
    });

    return () => {
      sub.remove();
    };
  }, [player]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
        />

        {/* Botón de saltar (sirve en nativo y en web) */}
        <TouchableOpacity
          style={[styles.skipButton, { backgroundColor: skipBackground }]}
          onPress={handleSkip}
        >
          <Text style={[styles.skipText, { color: skipTextColor }]}>
            Saltar video
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    opacity: 0.9,
  },
  skipText: {
    fontWeight: '800',
    fontSize: 14,
  },
});
