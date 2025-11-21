import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigationHistory } from './NavigationHistoryContext';

interface BackButtonProps {
  label?: string;
}

export default function BackButton({ label = 'Atrás' }: BackButtonProps) {
  const { canGoBack, goBack } = useNavigationHistory();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={goBack}
      disabled={!canGoBack}
      style={[styles.button, !canGoBack && styles.buttonDisabled]}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1e3a8a',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
