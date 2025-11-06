import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';

const LOGO_URI =
  'https://coachdan.es/wp-content/uploads/2020/08/LOGO-DAN-COACH-DEPORTE-900px.png';
const LOGO_ASPECT_RATIO = 944 / 533;

export default function HeaderLogo() {
  const { width } = useWindowDimensions();
  const logoWidth = Math.max(width * 0.2, 0);
  const logoHeight = logoWidth / LOGO_ASPECT_RATIO;

  return (
    <View style={styles.container}>
      <Image
        accessibilityRole="image"
        accessibilityLabel="Dan Coach Mental Deportivo logo"
        source={{ uri: LOGO_URI }}
        style={[styles.logo, { width: logoWidth, height: logoHeight }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    resizeMode: 'contain',
  },
});
