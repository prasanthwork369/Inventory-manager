/**
 * Ported from the web reference's src/components/layout/AppShell.tsx mobile
 * bottom nav: `primaryNav.slice(0,2)` + center FAB (opens Quick Actions) +
 * `primaryNav.slice(2)`, 5 equal columns, plus the "More" button — web
 * positions it as a floating pill (`fixed bottom-[74px] right-4`), visually
 * independent of the nav bar's own surface, only shown when not immersive;
 * here that falls out naturally since immersive routes (scan, sales/new,
 * purchases/new) live outside the Tabs navigator entirely, so this
 * component never mounts during them.
 *
 * More is a true floating overlay (`moreOverlay`), not reserved layout
 * space: it's absolutely positioned with only `right`/`bottom` set (no
 * `left`, no `width`), so it shrink-wraps to the pill's own content size
 * instead of spanning full width — that shrink-wrap is what makes it safe
 * this time; an earlier full-bounds attempt was reverted for that reason.
 * `pointerEvents="box-none"` on the wrapper means only the pill itself
 * accepts touches — everything else (scrolling, taps on content near it)
 * passes straight through. Its vertical offset is measured off the real
 * rendered height of the surface below it (`onLayout`), not guessed, so
 * it sits at the same visual spot regardless of device inset.
 *
 * Tab bar surface uses expo-blur's BlurView, matching the web's `bg-white/97
 * backdrop-blur` (Stage A originally used solid white "for reliability" —
 * revisited here since expo-blur is now a project dependency).
 * `blurMethod="dimezisBlurViewSdk31Plus"` gives real blur on Android 31+;
 * older Android falls back to a semi-transparent view (expo-blur's own
 * documented behavior, not a bug).
 *
 * Dimensions copied 1:1: FAB 56x56 (h-14 w-14), radius 18 (rounded-2xl),
 * -24 top offset (-mt-6), nav icons 22px (h-5.5), label 11px/semibold,
 * More button 40px tall (h-10), pill radius, 16px icon.
 *
 * The Tabs navigator registers 5 screens (index/products/sales/reports/more)
 * so "more" has its own nested stack and keeps this tab bar visible across
 * every secondary screen — see Phase 2 report for why. Only 4 of those are
 * rendered as icons in the strip; "more" is reached exclusively through the
 * floating button above, matching the web's IA (More is not a bottom-nav
 * icon there either).
 */
import React, { useContext, useState } from 'react';
import { router } from 'expo-router';
import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from 'expo-router/tabs';
import { BlurView } from 'expo-blur';
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
  const [surfaceHeight, setSurfaceHeight] = useState(0);
  // React Navigation only auto-measures its OWN default tab bar; a custom
  // `tabBar` render prop (like this one) is responsible for reporting its
  // real height back itself, or every consumer of useBottomTabBarHeight()/
  // BottomTabBarHeightContext (Screen.tsx's footer clearance, Dashboard's
  // scroll padding) silently falls back to React Navigation's generic
  // ~49px+inset estimate. Now that More is a floating overlay (not
  // reserved space), this height is just the real nav-strip surface —
  // content correctly gets no extra clearance for the pill, the same way
  // the web's `position: fixed` pill reserves none either.
  const reportTabBarHeight = useContext(BottomTabBarHeightCallbackContext);

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
    <View style={styles.container} onLayout={(e) => reportTabBarHeight?.(e.nativeEvent.layout.height)}>
      <BlurView
        intensity={90}
        tint="light"
        blurMethod="dimezisBlurViewSdk31Plus"
        onLayout={(e) => setSurfaceHeight(e.nativeEvent.layout.height)}
        style={[styles.surface, { paddingBottom: insets.bottom + spacing[1.5] }]}
      >
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
      </BlurView>

      {/* box-none: only the pill (a child) accepts touches — everything
          else in this wrapper's bounds passes taps/scrolls through. */}
      <View style={[styles.moreOverlay, { bottom: surfaceHeight + spacing[1.5] }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.push('/more')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="More"
          style={({ pressed }) => [styles.more, pressed && styles.morePressed]}
        >
          <MoreHorizontal size={16} color={colors.ink[700]} />
          <AppText size={13} weight="semibold" color={colors.ink[700]}>
            More
          </AppText>
        </Pressable>
      </View>

      <QuickActionsSheet open={quickOpen} onClose={() => setQuickOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'transparent' },
  surface: {
    borderTopWidth: 1,
    borderTopColor: withOpacity(colors.ink[200], 70),
    // web: bg-white/97 — near-opaque tint under the blur so it still
    // reads correctly on Android's semi-transparent-view fallback.
    backgroundColor: withOpacity(colors.white, 85),
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
    ...shadows.fab,
  },
  fabPressed: { transform: [{ scale: 0.95 }] },
  // web: fixed bottom-[74px] right-4. Absolute with only right/bottom set
  // (no left, no width) — shrink-wraps to the pill's own size, so this
  // wrapper is never wider or taller than the visible pill.
  moreOverlay: {
    position: 'absolute',
    right: spacing[4],
  },
  // h-10, rounded-full, border-ink-200. No shadow token here (unlike most
  // cards): Android's `elevation` on this rounded Pressable was rendering
  // as a rectangular grey halo instead of following the pill's own shape
  // — the border alone gives it enough definition against the surface.
  more: {
    height: spacing[10],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.ink[200],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[3.5],
  },
  morePressed: { backgroundColor: colors.ink[50] },
});
