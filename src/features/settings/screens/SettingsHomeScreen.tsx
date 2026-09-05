/**
 * Direct port of the web reference's src/pages/settings/Settings.tsx.
 */
import React from 'react';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  DatabaseBackup,
  Info,
  Layers,
  LockKeyhole,
  Percent,
  ReceiptText,
  Store,
  WifiOff,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/layout/Screen';
import { ErrorNotice, Skeleton } from '@/components/ui/States';
import { useSettingsHome } from '../hooks/useSettingsHome';
import type { AppSettings } from '../types';

interface SettingsItem {
  to: Parameters<typeof router.push>[0];
  Icon: LucideIcon;
  label: string;
  caption: string;
}

export function SettingsHomeScreen() {
  const { status, settings, refetch } = useSettingsHome();

  return (
    <Screen title="Settings" subtitle={settings?.business.name} back={false} wide>
      {status === 'loading' && <SettingsHomeSkeleton />}

      {status === 'error' && (
        <ErrorNotice title="Couldn't load settings" message="Something went wrong loading your settings. Try again." action="Retry" onAction={refetch} />
      )}

      {status === 'ready' && settings && <SettingsHomeContent settings={settings} />}
    </Screen>
  );
}

function SettingsHomeContent({ settings }: { settings: AppSettings }) {
  const groups: { label: string; items: SettingsItem[] }[] = [
    {
      label: 'Business',
      items: [
        { to: '/more/settings/business', Icon: Store, label: 'Business profile', caption: settings.business.name },
        {
          to: '/more/settings/tax',
          Icon: Percent,
          label: 'Tax',
          caption: settings.tax.enabled ? `${settings.tax.ratePercent}% · ${settings.tax.inclusive ? 'inclusive' : 'exclusive'}` : 'Disabled',
        },
        { to: '/more/settings/inventory', Icon: Layers, label: 'Inventory', caption: `Low stock at ${settings.inventory.lowStockThreshold} units` },
        { to: '/more/settings/receipt', Icon: ReceiptText, label: 'Receipts', caption: `Next receipt ${settings.receipt.prefix}-${settings.receipt.nextNumber}` },
      ],
    },
    {
      label: 'Device',
      items: [
        {
          to: '/more/settings/security',
          Icon: LockKeyhole,
          label: 'Security',
          caption: settings.security.mode === 'none' ? 'No lock set' : settings.security.mode === 'pin' ? 'PIN enabled' : 'Biometric enabled',
        },
        {
          to: '/more/settings/notifications',
          Icon: Bell,
          label: 'Notifications',
          caption: settings.notifications.lowStockAlerts ? 'Low stock alerts on' : 'Alerts off',
        },
        { to: '/more/backup', Icon: DatabaseBackup, label: 'Backup & data', caption: 'Backup, restore, import, export' },
        { to: '/more/settings/about', Icon: Info, label: 'About', caption: 'Version, privacy and support' },
      ],
    },
  ];

  return (
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
                  <View style={styles.flex1}>
                    <AppText size={15} weight="semibold" color={colors.ink.DEFAULT}>
                      {item.label}
                    </AppText>
                    <AppText size={12.5} color={colors.ink[500]} numberOfLines={1}>
                      {item.caption}
                    </AppText>
                  </View>
                  <ChevronRight size={18} color={colors.ink.DEFAULT} />
                </Pressable>
              </View>
            ))}
          </Card>
        </View>
      ))}

      <Card style={styles.infoCard}>
        <WifiOff size={18} color={colors.ink[500]} style={styles.infoIcon} />
        <AppText size={13} color={colors.ink[500]} style={styles.infoText}>
          <AppText size={13} weight="semibold" color={colors.ink.DEFAULT}>
            Offline first.
          </AppText>{' '}
          Your business data is stored locally on this device and never leaves it. Optional cloud sync will arrive in a
          future update.
        </AppText>
      </Card>
    </View>
  );
}

function SettingsHomeSkeleton() {
  return (
    <View style={styles.stack} accessibilityLabel="Loading settings" accessibilityState={{ busy: true }}>
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
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2.5], padding: spacing[4] },
  infoIcon: { marginTop: 2 },
  infoText: { flex: 1, lineHeight: 19.5 },
  skeletonGroup: { height: 220, borderRadius: radius['2xl'] },
});
