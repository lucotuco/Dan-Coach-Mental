import type { ComponentProps } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Image,
  type ImageSourcePropType,
} from 'react-native';

import { Text, useThemeColor } from './Themed';

import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
type FontAwesome5Name = ComponentProps<typeof FontAwesome5>['name'];

type DashboardTileProps = {
  icon: FontAwesome5Name;
  title: string;
  onPress?: () => void;
  accentColor?: string;
  imageSource?: ImageSourcePropType; // 👉 solo para tiles con imagen
  hideText?: boolean;                // 👉 si true (y hay imagen), no se muestra texto ni icono
};

export function DashboardTile({
  icon,
  title,
  onPress,
  accentColor,
  imageSource,
  hideText,
}: DashboardTileProps) {
  const backgroundColor = accentColor ? hexToRgba(accentColor, 0.8) : '#e4e7ff';
  const textColor = useThemeColor({ light: '#1d2136', dark: '#f5f6fb' }, 'text');
  const iconColor = accentColor ?? '#4c6ef5';

  const isImageTile = !!imageSource && hideText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor },
        pressed && styles.pressed,
        isImageTile && styles.imageTile,
      ]}
    >
      {isImageTile ? (
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
      ) : (
        <>
          <View style={[styles.iconWrap, { backgroundColor: '#fff' }]}>
            <FontAwesome5 name={icon} size={30} color={iconColor} />
          </View>
          <View style={styles.textContent}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
              {title}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    width: '100%',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'space-between',
    boxShadowProp: {
      boxShadow: {
        offsetX: 0,
        offsetY: 8,
        blurRadius: 12,
        spreadDistance: 0,
        color: 'rgba(0, 0, 0, 0.0165)',
      },
    },
    elevation: 3,
  },
  // 👉 para tiles solo imagen (Sesiones)
  imageTile: {
    padding: 0,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadowProp: {
      boxShadow: {
        offsetX: 0,
        offsetY: 4,
        blurRadius: 8,
        spreadDistance: 0,
        color: 'rgba(0, 0, 0, 0.0094)',
      },
    },
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
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
