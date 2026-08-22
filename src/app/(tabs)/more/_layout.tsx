import React from 'react';
import { Stack } from 'expo-router';

// New Purchase is deliberately NOT here — like New Sale, it lives at the
// root stack (src/app/purchases/new.tsx) as an immersive full-screen modal.
// Everything else the web reaches via its "More" screen (Operations,
// People, Data groups) lives in this tab's own stack so the bottom tab bar
// stays visible across all of it, matching the web's persistent AppShell.
export default function MoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="categories/index" />
      <Stack.Screen name="stock/index" />
      <Stack.Screen name="stock/in" />
      <Stack.Screen name="stock/out" />
      <Stack.Screen name="stock/adjust" />
      <Stack.Screen name="stock/movements" />
      <Stack.Screen name="purchases/index" />
      <Stack.Screen name="purchases/[id]" />
      <Stack.Screen name="suppliers/index" />
      <Stack.Screen name="suppliers/[id]" />
      <Stack.Screen name="customers/index" />
      <Stack.Screen name="customers/[id]" />
      <Stack.Screen name="alerts/index" />
      <Stack.Screen name="backup/index" />
      <Stack.Screen name="import" />
      <Stack.Screen name="export" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/business" />
      <Stack.Screen name="settings/tax" />
      <Stack.Screen name="settings/inventory" />
      <Stack.Screen name="settings/receipt" />
      <Stack.Screen name="settings/security" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/about" />
    </Stack>
  );
}
