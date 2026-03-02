import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';

export default function DanTeensScreen() {
  return (
    <View style={styles.container}>
      <MedioLogo />
      <Text style={styles.title}>Dan Teens</Text>
      <Text style={styles.subtitle}>
        Próximamente, contenido diseñado para adolescentes deportistas.
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