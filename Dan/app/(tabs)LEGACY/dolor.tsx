import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function LibraryScreenDolor() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dolor o molestias</Text>
      <Text style={styles.subtitle}>
        aca va a ir la meditacion o ejercicio guiado para aliviar el dolor o las molestias que sientas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.7,
  },
});
