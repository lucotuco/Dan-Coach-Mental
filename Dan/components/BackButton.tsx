+45
-0

import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationHistory } from './NavigationHistoryContext';

interface BackButtonProps {
  label?: string;
}

export default function BackButton({ label }: BackButtonProps) {
  const { canGoBack, goBack } = useNavigationHistory();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={goBack}
      disabled={!canGoBack}
      style={[styles.button, !canGoBack && styles.buttonDisabled]}
    >
      <Ionicons name="arrow-back" size={22} color="#000" />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});