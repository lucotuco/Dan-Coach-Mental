import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function CheckupsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chequeos</Text>
      <Text style={styles.subtitle}>
        Aquí podrás revisar tus chequeos periódicos cuando esta sección esté
        disponible.
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
