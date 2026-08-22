import React from 'react';
import { Stack } from 'expo-router';

// New Sale is deliberately NOT here — it lives at the root stack
// (src/app/sales/new.tsx) as an immersive full-screen modal, since it must
// hide the tab bar unconditionally regardless of which tab it's triggered
// from (FAB Quick Actions, or the button inside this tab). Everything here
// is a normal, non-immersive push that keeps the tab bar visible.
export default function SalesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/return" />
      <Stack.Screen name="receipt/[id]" />
    </Stack>
  );
}
