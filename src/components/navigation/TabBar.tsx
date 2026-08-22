/**
 * Ported from the web reference's src/components/layout/AppShell.tsx mobile
 * bottom nav: `primaryNav.slice(0,2)` + center FAB (opens Quick Actions) +
 * `primaryNav.slice(2)`, 5 equal columns, plus the floating "More" button
 * (`fixed bottom-[74px] right-4`, only shown when not immersive — here that
 * falls out naturally since immersive routes (scan, sales/new, purchases/new)
 * live outside the Tabs navigator entirely, so this component never mounts
 * during them). Web's `bg-white/97 backdrop-blur` is solid white here (see
 * Stage A summary). Dimensions copied 1:1: FAB 56x56 (h-14 w-14), radius 18
 * (rounded-2xl), -24 top offset (-mt-6), nav icons 22px (h-5.5), label
 * 11px/semibold, More button 40px tall (h-10), pill radius, 16px icon.
 *
 * The Tabs navigator registers 5 screens (index/products/sales/reports/more)
 * so "more" has its own nested stack and keeps this tab bar visible across
 * every secondary screen — see Phase 2 report for why. Only 4 of those are
 * rendered as icons in the strip; "more" is reached exclusively through the
 * floating button below, matching the web's IA (More is not a bottom-nav
 * icon there either).
 */
import React, { useState } from 'react';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { BoxesIcon, ChartNoAxesColumn, Home, MoreHorizontal, Plus, ReceiptIndianRupee } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, withOpacity } from '../../theme';
import { AppText } from '../ui/AppText';
import { QuickActionsSheet } from './QuickActionsSheet';

const VISIBLE_TABS = ['index', 'products', 'sales', 'reports'] as const;

const icons: Record<(typeof VISIBLE_TABS)[number], typeof Home> = {
  index: Home,
  products: BoxesIcon,
  sales: ReceiptIndianRupee,
  reports: ChartNoAxesColumn,
};

const labels: Record<(typeof VISIBLE_TABS)[number], string> = {
  index: 'Home',
  products: 'Products',
  sales: 'Sales',
  reports: 'Reports',
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [quickOpen, setQuickOpen] = useState(false);

  // Only the 4 primary destinations render as strip icons — "more" is a
  // real registered tab (so its stack keeps this bar visible) but is
  // reached solely via the floating More button, matching the web.
  const visibleRoutes = VISIBLE_TABS.map((name) => state.routes.find((r) => r.name === name)).filter(
    (r): r is NonNullable<typeof r> => Boolean(r)
  );
  const midpoint = Math.ceil(visibleRoutes.length / 2);
  const leftRoutes = visibleRoutes.slice(0, midpoint);
  const rightRoutes = visibleRoutes.slice(midpoint);

  const renderItem = (route: (typeof visibleRoutes)[number]) => {
    const name = route.name as (typeof VISIBLE_TABS)[number];
    const isFocused = state.index === state.routes.indexOf(route);
    const Icon = icons[name];
    const label = labels[name];
    const color = isFocused ? colors.brand[600] : colors.ink[400];

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable key={route.key} onPress={onPress} style={styles.navItem} accessibilityRole="button" accessibilityLabel={label}>
        <Icon size={22} color={color} />
        <AppText size={11} weight="semibold" color={color}>
          {label}
        </AppText>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing[1.5] }]}>
      <View style={styles.row}>
        {leftRoutes.map(renderItem)}
        <View style={styles.fabColumn}>
          <Pressable
            onPress={() => setQuickOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Quick actions"
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          >
            <Plus size={24} color={colors.white} />
          </Pressable>
        </View>
        {rightRoutes.map(renderItem)}
      </View>
      <Pressable
        onPress={() => router.push('/more')}
        accessibilityRole="button"
        accessibilityLabel="More"
        style={({ pressed }) => [styles.more, pressed && styles.morePressed, { bottom: '100%', marginBottom: spacing[2] }]}
      >
        <MoreHorizontal size={16} color={colors.ink[700]} />
        <AppText size={13} weight="semibold" color={colors.ink[700]}>
          More
        </AppText>
      </Pressable>
      <QuickActionsSheet open={quickOpen} onClose={() => setQuickOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: withOpacity(colors.ink[200], 70),
    backgroundColor: colors.white,
    paddingTop: spacing[1.5],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[2],
    width: '100%',
    maxWidth: 512, // web: mx-auto max-w-lg
    alignSelf: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    borderRadius: radius.xl,
  },
  fabColumn: { flex: 1, alignItems: 'center' },
  fab: {
    marginTop: -spacing[6],
    height: spacing[14],
    width: spacing[14],
    borderRadius: radius['2xl'],
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lift,
  },
  fabPressed: { transform: [{ scale: 0.95 }] },
  // web: fixed bottom-[74px] right-4, h-10, rounded-full, border-ink-200
  more: {
    position: 'absolute',
    right: spacing[4],
    height: spacing[10],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.ink[200],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[3.5],
    ...shadows.card,
  },
  morePressed: { backgroundColor: colors.ink[50] },
});
