import React from 'react';
import { Tabs } from 'expo-router/tabs';
import { TabBar } from '@/components/navigation/TabBar';

// "more" is a real 5th tab (its own nested stack) so every secondary screen
// reached from it keeps this tab bar visible — see TabBar.tsx for why it's
// not rendered as a strip icon. New Sale/New Purchase/Scanner are NOT tabs;
// they live at the root stack as immersive full-screen modals.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="products" />
      <Tabs.Screen name="sales" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
