import React from 'react';
import { Stack } from 'expo-router';

export default function ReportsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sales" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="low-stock" />
      <Stack.Screen name="out-of-stock" />
      <Stack.Screen name="profit" />
      <Stack.Screen name="purchases" />
      <Stack.Screen name="movements" />
    </Stack>
  );
}
