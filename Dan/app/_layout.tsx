import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { NavigationHistoryProvider } from '@/components/NavigationHistoryContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { createSharedHeaderOptions, withoutBackButton } from '@/constants/navigation';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'introVideo',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const PUBLIC_ROUTES = ['/', '/signup','/introVideo'];

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

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const sharedHeaderOptions = useMemo(
    () => createSharedHeaderOptions(theme),
    [theme],
  );

  useEffect(() => {
    if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname ?? '')) {
      router.replace('/');
    }
  }, [isAuthenticated, pathname, router]);

  return (

    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NavigationHistoryProvider>
        <Stack initialRouteName="introVideo" screenOptions={sharedHeaderOptions}>
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
          <Stack.Screen
            name="cargarInfo"
            options={{ gestureEnabled: false }} />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </NavigationHistoryProvider>
    </ThemeProvider>
  );
}
