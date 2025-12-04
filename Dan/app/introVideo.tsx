import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, View, useThemeColor } from '@/components/Themed';

const INTRO_VIDEO_URL = '../assets/videos/Dan Coach depor FINAL EXPORT.mp4';

export default function IntroVideoScreen() {
  const router = useRouter();
  const skipBackground = useThemeColor({ light: '#0b164c', dark: '#e5e9ff' }, 'text');
  const skipTextColor = useThemeColor({ light: '#ffffff', dark: '#0b164c' }, 'background');

  const player = useVideoPlayer(INTRO_VIDEO_URL, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.play();
  });

  const handleSkip = () => {
    router.replace('/');
  };

  useEffect(() => {
    const subscription = player?.addListener('statusChange', (status) => {
      if ('isLoaded' in status && status.isLoaded ) {
        handleSkip();
      }
    });

    return () => subscription?.remove();
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

        <TouchableOpacity style={[styles.skipButton, { backgroundColor: skipBackground }]} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: skipTextColor }]}>Saltar video</Text>
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