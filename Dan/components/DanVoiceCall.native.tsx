// components/DanVoiceCall.native.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DanVoiceCall() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Llamada con DAN (voz)</Text>
      <Text style={styles.text}>
        Por ahora, la llamada en tiempo real está habilitada en la versión web.
        En nativo lo dejamos preparado para integrarlo después (WebRTC / audio I/O).
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
    backgroundColor: '#111',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#fff',
  },
  text: {
    fontSize: 14,
    color: '#ddd',
  },
});
