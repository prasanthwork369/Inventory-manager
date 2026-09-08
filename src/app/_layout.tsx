import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { retryAppEntry, useAppEntry } from '@/hooks/useAppEntry';
import { ErrorNotice } from '@/components/ui/States';
import { ToastProvider } from '@/components/ui/Toast';
import { colors, spacing } from '@/theme';

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

  // DB open/migration failed — a real (if rare) failure the user should
  // see and retry, not a raw SQL error or an indefinite blank splash.
  if (status === 'error') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.errorRoot}>
          <View style={styles.errorContent}>
            <ErrorNotice
              title="Couldn't start the app"
              message="Something went wrong preparing your data. Try again."
              action="Retry"
              onAction={retryAppEntry}
            />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

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

const styles = StyleSheet.create({
  errorRoot: { flex: 1, backgroundColor: colors.ink[50] },
  errorContent: { flex: 1, justifyContent: 'center', padding: spacing[5] },
});
