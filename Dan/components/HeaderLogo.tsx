import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions, Platform } from 'react-native';
import '../assets/images/DAN_coach_mental_sin_fondo_v1.png';

const logoSource = require('../assets/images/DAN_coach_mental_sin_fondo_v1.png');
const FALLBACK_LOGO_ASPECT_RATIO = 1;
const TARGET_MOBILE_WIDTH = 380;
const MAX_LOGO_WIDTH = TARGET_MOBILE_WIDTH * 0.6;

const getLogoAspectRatio = () => {
  // En web (o si no existe resolveAssetSource), devolvemos 1 para evitar el crash
  if (Platform.OS === 'web' || typeof Image.resolveAssetSource !== 'function') {
    return FALLBACK_LOGO_ASPECT_RATIO;
  }

  const resolvedAsset = Image.resolveAssetSource(logoSource);

  if (!resolvedAsset?.height) {
    return FALLBACK_LOGO_ASPECT_RATIO;
  }

  return resolvedAsset.width / resolvedAsset.height;
};

const LOGO_ASPECT_RATIO = getLogoAspectRatio();

export default function HeaderLogo() {
  const { width } = useWindowDimensions();
  const effectiveWidth = width || TARGET_MOBILE_WIDTH;
  const responsiveLogoWidth = effectiveWidth * 0.4;
  const logoWidth = Math.min(responsiveLogoWidth, MAX_LOGO_WIDTH);
  const logoHeight = logoWidth / LOGO_ASPECT_RATIO;

  return (
    <View style={styles.container}>
      <Image
        accessibilityRole="image"
        accessibilityLabel="Dan Coach Mental Deportivo logo"
        source={logoSource}
        resizeMode="contain"
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
  },
});
