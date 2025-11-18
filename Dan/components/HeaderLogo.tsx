import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions, Platform } from 'react-native';
import '../assets/images/DAN_coach_mental_sin_fondo_v1.png';

const logoSource = require('../assets/images/DAN_coach_mental_sin_fondo_v1.png');

const getLogoAspectRatio = () => {
  // En web (o si no existe resolveAssetSource), devolvemos 1 para evitar el crash
  if (Platform.OS === 'web' || typeof Image.resolveAssetSource !== 'function') {
    return 1;
  }

  const resolvedAsset = Image.resolveAssetSource(logoSource);

  if (!resolvedAsset?.height) {
    return 1;
  }

  return resolvedAsset.width / resolvedAsset.height;
};

const LOGO_ASPECT_RATIO = getLogoAspectRatio();

export default function HeaderLogo() {
  const { width } = useWindowDimensions();
  const logoWidth = Math.max(width * 0.4, 0);
  const logoHeight = logoWidth / LOGO_ASPECT_RATIO;

  return (
    <View style={styles.container}>
      <Image
        accessibilityRole="image"
        accessibilityLabel="Dan Coach Mental Deportivo logo"
        source={logoSource}
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
