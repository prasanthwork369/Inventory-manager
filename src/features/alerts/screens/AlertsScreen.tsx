/**
 * Direct port of the web reference's src/pages/Alerts.tsx. `lg:grid-cols-2`
 * is desktop-only; single column at mobile width. No "backup" alert card
 * — see types.ts for why.
 */
import React from 'react';
import { router } from 'expo-router';
import { Bell, CheckCircle2, PackageX, TriangleAlert } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { useAlerts } from '../hooks/useAlerts';
import type { AlertFilter, InventoryAlert } from '../types';

// web: alert body text is `text-ink-600`, which emits no CSS and inherits
// the surrounding tone-colored Card's own text color, not near-black.
const TONE_STYLES: Record<InventoryAlert['tone'], { border: string; bg: string; icon: string; text: string }> = {
  bad: { border: colors.bad[100], bg: colors.bad[50], icon: colors.bad[600], text: colors.bad[600] },
  warn: { border: colors.warn[100], bg: colors.warn[50], icon: colors.warn[600], text: colors.warn[600] },
};

function actionHref(alert: InventoryAlert): Parameters<typeof router.push>[0] {
  return alert.kind === 'large-adjustment' ? '/more/stock/movements' : '/more/stock/in';
}

export function AlertsScreen() {
  const { status, items, filter, setFilter, outCount, lowCount, refetch } = useAlerts();

  return (
    <Screen title="Alerts" subtitle={status === 'ready' ? `${items.length} need your attention` : undefined} wide>
      <View style={styles.filterRow}>
        <Segmented<AlertFilter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `All (${outCount + lowCount})` },
            { value: 'out', label: `Out (${outCount})` },
            { value: 'low', label: `Low (${lowCount})` },
            { value: 'other', label: 'Other' },
          ]}
        />
      </View>

      {status === 'loading' && <ListSkeleton rows={4} />}

      {status === 'error' && (
        <ErrorNotice title="Couldn't load alerts" message="Something went wrong loading your alerts. Try again." action="Retry" onAction={refetch} />
      )}

      {status === 'ready' && items.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 size={28} color={colors.brand[600]} />}
          title="Everything looks healthy"
          message="No stock warnings right now. We will tell you as soon as something needs restocking."
          actionLabel="Go to dashboard"
          onAction={() => router.push('/')}
        />
      )}

      {status === 'ready' && items.length > 0 && (
        <View style={styles.grid}>
          {items.map((alert) => {
            const tone = TONE_STYLES[alert.tone];
            return (
              <Card key={alert.id} style={[styles.alertCard, { borderColor: tone.border, backgroundColor: tone.bg }]}>
                <View style={styles.alertIcon}>
                  {alert.kind === 'out-of-stock' ? (
                    <PackageX size={20} color={tone.icon} />
                  ) : (
                    <TriangleAlert size={20} color={tone.icon} />
                  )}
                </View>
                <View style={styles.flex1}>
                  <Pressable onPress={() => router.push(`/products/${alert.productId}`)}>
                    <AppText size={14.5} weight="bold" color={colors.ink.DEFAULT}>
                      {alert.title}
                    </AppText>
                    <AppText size={13} color={tone.text} style={styles.alertBody}>
                      {alert.body}
                    </AppText>
                  </Pressable>
                  <View style={styles.alertActions}>
                    <Button size="sm" onPress={() => router.push(actionHref(alert))}>
                      {alert.actionLabel}
                    </Button>
                    <Button size="sm" variant="secondary" onPress={() => router.push(`/products/${alert.productId}`)}>
                      Open
                    </Button>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <Pressable onPress={() => router.push('/more/settings/notifications')} style={({ pressed }) => [styles.settingsRow, pressed && styles.settingsRowPressed]}>
        <Bell size={20} color={colors.ink[500]} />
        <View style={styles.flex1}>
          <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT}>
            Alert settings
          </AppText>
          <AppText size={12.5} color={colors.ink[500]}>
            Choose which alerts you want to see
          </AppText>
        </View>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  filterRow: { marginBottom: spacing[4] },
  grid: { gap: spacing[2.5] },
  alertCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], borderWidth: 1, padding: spacing[4] },
  alertIcon: { height: spacing[10], width: spacing[10], borderRadius: radius.xl, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  alertBody: { marginTop: 2, lineHeight: 19.5 },
  alertActions: { marginTop: spacing[2.5], flexDirection: 'row', gap: spacing[2] },
  settingsRow: {
    marginTop: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink[200],
    padding: spacing[4],
  },
  settingsRowPressed: { backgroundColor: colors.white },
});
