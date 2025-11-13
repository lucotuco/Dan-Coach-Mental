import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import RecordingButton from '@/components/AudioRecorderButton';

export default function SessionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sesiones</Text>
      
    <RecordingButton/>
     <Text style={styles.subtitle}>
        Aquí podrás grabar y reproducir tus sesiones de coaching mental deportivo. Utiliza el botón de grabación para iniciar y detener la grabación de audio. Una vez que hayas terminado, podrás reproducir la sesión grabada para revisarla cuando desees.
      </Text>
      <RecordingButton />   
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
