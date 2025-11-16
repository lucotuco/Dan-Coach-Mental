import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text,  useThemeColor } from './Themed';

import { Feather as FeatherIcon } from '@expo/vector-icons';

type FeatherName = ComponentProps<typeof FeatherIcon>['name'];

type DashboardTileProps = {
  icon: FeatherName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  accentColor?: string;
  wrapped?: boolean;
};


export function DashboardTile({ icon, title, subtitle, onPress, accentColor, wrapped }: DashboardTileProps) {
  const backgroundColor = accentColor ? hexToRgba(accentColor, 0.35) : '#e4e7ff';
  const textColor = useThemeColor({ light: '#1d2136', dark: '#f5f6fb' }, 'text');
  const mutedColor = useThemeColor({ light: '#6c728a', dark: '#a6aac4' }, 'text');
  const iconColor = accentColor ?? '#4c6ef5';
  
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor },
        pressed && styles.pressed,
        
        wrapped ? styles.fullWidthTile : styles.halfWidthTile,
      ]}
    >
      
      <View style={[styles.iconWrap, { backgroundColor: "#fff" }]}>
        <FeatherIcon name={icon} size={30} color={iconColor} />
      </View>
      <View style={styles.textContent}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: mutedColor }]}>{subtitle}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    flex: 1,
    
    alignItems: 'center',
    minWidth: 140,
  },
    fullWidthTile: {
    flexBasis: '100%',
    flexGrow: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    
  },
  halfWidthTile: {
    width: '48%',
    maxWidth: '48%',
    flexGrow: 1,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
});

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) {
    return hex;
  }

  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default DashboardTile;
