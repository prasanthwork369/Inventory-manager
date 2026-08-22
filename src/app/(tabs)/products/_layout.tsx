import React from 'react';
import { Stack } from 'expo-router';

// Nested stack for the Products tab — keeps the bottom tab bar visible
// while pushing list -> create/detail/edit, matching the web's persistent
// AppShell chrome on every non-immersive products route.
export default function ProductsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/edit" />
    </Stack>
  );
}
