// components/DanVoiceCall.native.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DanVoiceCall() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Llamada con DAN (voz)</Text>
      <Text style={styles.text}>
        La llamada de voz en tiempo real con DAN todavía no está disponible en la app
        nativa. Probala desde la versión web del MVP 😊
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
  },
});
