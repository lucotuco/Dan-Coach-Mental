import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';

export default function DanKidsScreen() {
  return (
    <View style={styles.container}>
      <MedioLogo />
      <Text style={styles.title}>Dan Kids</Text>
      <Text style={styles.subtitle}>
        Espacio lúdico para que los más chicos entrenen su mentalidad.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
});
