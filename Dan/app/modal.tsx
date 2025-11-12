import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View as ThemedView } from '@/components/Themed';

export default function ModalScreen() {
  return (
    <View style={styles.overlay}>
      <BlurView intensity={80} tint="default" style={styles.blurLayer} />
      <View pointerEvents="none" style={styles.backdropTint} />

      <ThemedView style={styles.content}>
        <Text style={styles.title}>Modal</Text>
        <View style={styles.separator} />
        <EditScreenInfo path="app/modal.tsx" />
      </ThemedView>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 11, 25, 0.35)',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginVertical: 4,
  },
});
