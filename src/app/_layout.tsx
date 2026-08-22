import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppEntry } from '@/hooks/useAppEntry';
import { ToastProvider } from '@/components/ui/Toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const status = useAppEntry();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded || status === 'loading') return null;

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* No separate index/gate route: Stack.Protected controls which
              screens even exist in the navigator, so there is nothing at
              `/` to collide with (tabs)/index.tsx. While onboarding is
              incomplete, `(tabs)` isn't registered at all, so `/` isn't
              reachable and onboarding is the only accessible screen. */}
          <Stack.Protected guard={status === 'needs-onboarding'}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack.Protected>

          <Stack.Protected guard={status === 'ready'}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* Immersive: root-level fullScreenModal presentation hides the
                tab bar unconditionally, matching the web's immersive routes
                (/scan, /sales/new, /purchases/new) regardless of which tab
                they were triggered from. Guarded the same as (tabs) since
                none of them make sense before onboarding completes. */}
            <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="sales/new" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="purchases/new" options={{ presentation: 'fullScreenModal' }} />
          </Stack.Protected>
        </Stack>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
