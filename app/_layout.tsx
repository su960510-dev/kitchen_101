import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppThemeProvider, useTheme } from '@/design-system';
import { AppStateProvider, useAppState } from '@/hooks/app-state';
import { onNotificationOpened } from '@/infrastructure/notifications/local-notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Navigator() {
  const { ready, failed, settings } = useAppState();
  const { colors: c, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (ready || failed) SplashScreen.hideAsync().catch(() => {});
  }, [ready, failed]);

  useEffect(() => {
    if (!ready || settings.onboardingDone) return;
    if ((segments[0] as string | undefined) !== 'onboarding') router.replace('/onboarding');
  }, [ready, settings.onboardingDone, segments, router]);

  useEffect(() => onNotificationOpened((id) => router.push({ pathname: '/inventory/[id]', params: { id } })), [router]);

  if (failed) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: c.background }}>
        <Text style={{ color: c.ink, fontSize: 16, textAlign: 'center' }}>저장소를 열지 못했어요. 앱을 다시 실행해 주세요.</Text>
      </View>
    );
  }
  if (!ready) return <View style={{ flex: 1, backgroundColor: c.background }} />;

  const base = isDark ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...base, colors: { ...base.colors, background: c.background, card: c.surface, text: c.ink, primary: c.green, border: c.line } }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
    </ThemeProvider>
  );
}

function ThemedRoot() {
  const { settings } = useAppState();
  return (
    <AppThemeProvider mode={settings.theme}>
      <Navigator />
    </AppThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <ThemedRoot />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
