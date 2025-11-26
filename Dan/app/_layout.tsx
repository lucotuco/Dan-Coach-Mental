import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '@/components/AuthContext';
import { NavigationHistoryProvider } from '@/components/NavigationHistoryContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { createSharedHeaderOptions, withoutBackButton } from '@/constants/navigation';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const sharedHeaderOptions = useMemo(
    () => createSharedHeaderOptions(theme),
    [theme],
  );

  return (
    
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <NavigationHistoryProvider>
          <Stack screenOptions={sharedHeaderOptions}>
            <Stack.Screen
              name="index"
              options={{ gestureEnabled: false, ...withoutBackButton }}
            />
            <Stack.Screen
              name="introVideo"
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="signup"
              options={{ gestureEnabled: false, ...withoutBackButton }}
            />
            <Stack.Screen
              name="bienvenida"
              options={{ gestureEnabled: false, ...withoutBackButton }}
            />
            <Stack.Screen name="cargarInfo" options={{ gestureEnabled: false }} />
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </NavigationHistoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
