import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text as DefaultText, View } from 'react-native';

import { useThemeColor } from './Themed';

import { Feather as FeatherIcon } from '@expo/vector-icons';

type FeatherName = ComponentProps<typeof FeatherIcon>['name'];

type CircularIconButtonProps = {
  icon: FeatherName;
  label: string;
  active?: boolean;
  onPress?: () => void;
  accentColor?: string;
};

export function CircularIconButton({
  icon,
  label,
  active = false,
  onPress,
  accentColor,
}: CircularIconButtonProps) {
  const baseBackground = useThemeColor({ light: '#f0f1f7', dark: '#2b2d37' }, 'background');
  const activeBackground = accentColor ?? '#4c6ef5';
  const textColor = useThemeColor({ light: '#6c728a', dark: '#c7c9d9' }, 'text');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.iconBadge,
          { backgroundColor: active ? activeBackground : baseBackground },
          active && [styles.iconBadgeActive, { shadowColor: activeBackground }],
        ]}
      >
        <FeatherIcon name={icon} size={22} color={active ? '#fff' : textColor} />
      </View>
      <DefaultText style={[styles.label, { color: active ? activeBackground : textColor }]}>{label}</DefaultText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
    width: 80,
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    width: 64,
    height: 64,
  },
  iconBadgeActive: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});

export default CircularIconButton;
