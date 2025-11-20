import React from 'react';
import { Image, StyleSheet, Platform, View, useWindowDimensions } from 'react-native';
import '../assets/images/DAN_coach_mental_sin_fondo_v3.png';

const logoSource = require('../assets/images/DAN_coach_mental_sin_fondo_v3.png');
// The source asset is 1024x121 px which gives the right ratio for the web fallback.
const FALLBACK_LOGO_ASPECT_RATIO = 920 / 121;

const getLogoAspectRatio = () => {
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
// Limit the logo size to what a ~380px wide device would display so the
// experience matches iOS/Android even when the app runs on large web screens.
const TARGET_MOBILE_WIDTH = 380;
const MAX_LOGO_WIDTH = TARGET_MOBILE_WIDTH * 0.5;


export default function MedioLogo() {
  const { width } = useWindowDimensions();
  const effectiveWidth = width || TARGET_MOBILE_WIDTH;
  const responsiveLogoWidth = effectiveWidth * 0.5;
  const logoWidth = Math.min(responsiveLogoWidth, MAX_LOGO_WIDTH);
  const logoHeight = (logoWidth / LOGO_ASPECT_RATIO) * 0.7;
  

  return (
    <View style={styles.container}>
      <Image
        accessibilityRole="image"
        accessibilityLabel="Dan Coach Mental Deportivo logo"
        source={logoSource}
        resizeMode="contain"
        style={[styles.logo, { width: logoWidth, height: logoHeight, marginTop: -20 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
  },
});
