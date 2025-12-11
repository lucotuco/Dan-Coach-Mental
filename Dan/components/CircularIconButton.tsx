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
  const activeShadow = {
    boxShadowProp: {
      boxShadow: {
        offsetX: 0,
        offsetY: 8,
        blurRadius: 12,
        spreadDistance: 0,
        color: hexToRgba(activeBackground, 0.3),
      },
    },
  } as const;

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
          active && [styles.iconBadgeActive, activeShadow],
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

function hexToRgba(hex: string, alpha: number) {
  const match = hex.replace('#', '');

  if (match.length === 6) {
    const r = parseInt(match.slice(0, 2), 16);
    const g = parseInt(match.slice(2, 4), 16);
    const b = parseInt(match.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return hex;
}

export default CircularIconButton;
