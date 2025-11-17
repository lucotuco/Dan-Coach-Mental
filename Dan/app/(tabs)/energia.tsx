import { Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import {
  AudioModule,
  setAudioModeAsync,
  createAudioPlayer,
} from 'expo-audio';
export default function LibraryScreenEnergia() {
  const meditacion = require('Dan\assets\audios\reliable-safe-327618.mp3')
   const player = createAudioPlayer(meditacion.uri);
  const handleStartPress = () => {
    player.play();
  };
 


  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <MedioLogo/>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Movilidad suave para recargar energía</Text>

        <Pressable style={styles.primaryButton} onPress={handleStartPress} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Iniciar</Text>

        </Pressable>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.infoTitle}>Respira hondo...</Text>
        <Text style={styles.infoParagraph}>
          Tu cuerpo empieza a despertarse. Activá desde la calma.
        </Text>
        <Text style={styles.infoParagraph}>
          Aflojá tensiones sin forzar.
        </Text>
        <Text style={styles.infoParagraph}>
          Liberá la carga del día y dale espacio a tu energía. Dale movilidad al centro de tu
          cuerpo para recuperar vitalidad.
        </Text>
        <Text style={styles.infoParagraph}>
          Ya activaste tu energía. Estás listo para continuar tu día con más calma y ligereza.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#26324b',
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: '#031355',
  },
  primaryButton: {
    backgroundColor: '#031355',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  infoBlock: {
    gap: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#031355',
  },
  infoParagraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4a4f63',
  },
});