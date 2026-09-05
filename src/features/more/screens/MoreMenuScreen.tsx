/**
 * Direct port of the web reference's src/pages/More.tsx — the actual
 * "More" tab menu (deferred back in Phase 2's navigation shell as a
 * placeholder proving the route was reachable; now that every feature it
 * links to exists, this replaces it with the real screen).
 */
import React from 'react';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  DatabaseBackup,
  Download,
  Layers,
  PackageSearch,
  ScanLine,
  Settings as SettingsIcon,
  ShoppingCart,
  Truck,
  Upload,
  Users,
  WifiOff,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/layout/Screen';
import { ErrorNotice, Skeleton } from '@/components/ui/States';
import { useMoreMenu } from '../hooks/useMoreMenu';

interface MoreMenuItem {
  to: Parameters<typeof router.push>[0];
  label: string;
  Icon: LucideIcon;
  badge?: string;
}

export function MoreMenuScreen() {
  const { status, businessName, alertCount, refetch } = useMoreMenu();

  const groups: { label: string; items: MoreMenuItem[] }[] = [
    {
      label: 'Operations',
      items: [
        { to: '/more/stock', label: 'Stock dashboard', Icon: Layers },
        { to: '/more/purchases', label: 'Purchases', Icon: ShoppingCart },
        { to: '/more/categories', label: 'Categories', Icon: PackageSearch },
        { to: '/scan', label: 'Scan barcode', Icon: ScanLine },
      ],
    },
    {
      label: 'People',
      items: [
        { to: '/more/suppliers', label: 'Suppliers', Icon: Truck },
        { to: '/more/customers', label: 'Customers', Icon: Users },
      ],
    },
    {
      label: 'Data',
      items: [
        { to: '/more/alerts', label: 'Alerts', Icon: Bell, badge: alertCount ? String(alertCount) : undefined },
        { to: '/more/backup', label: 'Backup & restore', Icon: DatabaseBackup },
        { to: '/more/import', label: 'Import products', Icon: Upload },
        { to: '/more/export', label: 'Export data', Icon: Download },
        { to: '/more/settings', label: 'Settings', Icon: SettingsIcon },
      ],
    },
  ];

  return (
    <Screen title="More" subtitle={status === 'ready' ? businessName : undefined} back={false} wide>
      {status === 'loading' && <MoreMenuSkeleton />}

      {status === 'error' && (
        <ErrorNotice title="Couldn't load menu" message="Something went wrong loading this screen. Try again." action="Retry" onAction={refetch} />
      )}

      {status === 'ready' && (
        <View style={styles.stack}>
          {groups.map((g) => (
            <View key={g.label}>
              <AppText size={13} weight="bold" color={colors.ink[500]} style={styles.groupLabel}>
                {g.label}
              </AppText>
              <Card style={styles.overflowHidden}>
                {g.items.map((item, i) => (
                  <View key={item.label}>
                    {i > 0 && <View style={styles.divider} />}
                    <Pressable onPress={() => router.push(item.to)} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                      <View style={styles.rowIcon}>
                        <item.Icon size={18} color={colors.ink[700]} />
                      </View>
                      <AppText size={15} weight="semibold" color={colors.ink.DEFAULT} style={styles.flex1}>
                        {item.label}
                      </AppText>
                      {item.badge && (
                        <View style={styles.badge}>
                          <AppText size={11} weight="bold" color={colors.white}>
                            {item.badge}
                          </AppText>
                        </View>
                      )}
                      <ChevronRight size={18} color={colors.ink.DEFAULT} />
                    </Pressable>
                  </View>
                ))}
              </Card>
            </View>
          ))}

          <Card style={styles.infoCard}>
            <WifiOff size={18} color={colors.ink[500]} />
            <AppText size={13} color={colors.ink[500]} style={styles.flex1}>
              Your business data is stored locally on this device. Everything keeps working without an internet
              connection.
            </AppText>
          </Card>
        </View>
      )}
    </Screen>
  );
}

function MoreMenuSkeleton() {
  return (
    <View style={styles.stack} accessibilityLabel="Loading" accessibilityState={{ busy: true }}>
      <Skeleton style={styles.skeletonGroup} />
      <Skeleton style={styles.skeletonGroup} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[5] },
  flex1: { flex: 1, minWidth: 0 },
  overflowHidden: { overflow: 'hidden' },
  groupLabel: { paddingHorizontal: spacing[1], paddingBottom: spacing[2] },
  divider: { height: 1, backgroundColor: colors.ink[100] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3.5] },
  rowPressed: { backgroundColor: colors.ink[50] },
  rowIcon: { height: spacing[9], width: spacing[9], borderRadius: radius.xl, backgroundColor: colors.ink[100], alignItems: 'center', justifyContent: 'center' },
  badge: { borderRadius: radius.full, backgroundColor: colors.warn[500], paddingHorizontal: spacing[2], paddingVertical: 2 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[2.5], padding: spacing[4] },
  skeletonGroup: { height: 180, borderRadius: radius['2xl'] },
});
