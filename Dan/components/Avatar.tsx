import { Image, StyleSheet } from 'react-native';

import { Text, View, useThemeColor } from './Themed';

type AvatarProps = {
  name: string;
  size?: number;
  imageUrl?: string;
};

export function Avatar({ name, size = 48, imageUrl }: AvatarProps) {
  const backgroundColor = useThemeColor({ light: '#e4e7ff', dark: '#2f3361' }, 'background');
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        resizeMode="cover"
        style={[styles.image, { width: size, height: size }]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, backgroundColor }]}> 
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 999,
  },
  fallback: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
});

export default Avatar;
