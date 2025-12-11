import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { View, ViewProps, useThemeColor } from './Themed';

type CardProps = {
  children: ReactNode;
  style?: ViewProps['style'];
  lightColor?: string;
  darkColor?: string;
};

export function Card({ children, style, lightColor, darkColor }: CardProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor ?? '#ffffff', dark: darkColor ?? '#1f1f24' },
    'background'
  );
  const borderColor = useThemeColor({ light: '#e0e3eb', dark: '#2c2c33' }, 'background');

  return <View style={[styles.card, { backgroundColor, borderColor }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    boxShadowProp: {
      boxShadow: {
        offsetX: 0,
        offsetY: 6,
        blurRadius: 10,
        spreadDistance: 0,
        color: 'rgba(0, 0, 0, 0.06)',
      },
    },
    elevation: 3,
  },
});

export default Card;
