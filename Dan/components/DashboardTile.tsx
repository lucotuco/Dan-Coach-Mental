import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text,  useThemeColor } from './Themed';

import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
type FontAwesome5 = ComponentProps<typeof FontAwesome5>['name'];

type DashboardTileProps = {
  icon: FontAwesome5;
  title: string;
  onPress?: () => void;
  accentColor?: string;
  wrapped?: boolean;
};


export function DashboardTile({ icon, title, onPress, accentColor, wrapped }: DashboardTileProps) {
  const backgroundColor = accentColor ? hexToRgba(accentColor, 0.8) : '#e4e7ff';
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
      
      <View style={[styles.iconWrap, { backgroundColor: '#fff' }]}>
        <FontAwesome5 name={icon} size={30} color={iconColor} />
      </View>
      <View style={styles.textContent}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 18,
    padding: 16,
    gap: 10,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'space-between',
    shadowColor: '#00000015',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  fullWidthTile: {
    width: '100%',
    flexGrow: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',

  },
  halfWidthTile: {
    width: '100%',
    flexGrow: 1,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00000010',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  textContent: {
    flex: 1,
    gap: 3,
    alignItems: 'center',
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
