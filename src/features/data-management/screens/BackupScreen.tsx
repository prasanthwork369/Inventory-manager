/**
 * Direct port of the web reference's src/pages/data/BackupRestore.tsx.
 * See useBackup.ts for the one documented state-machine correction
 * (restoreStep's initial value).
 */
import React from 'react';
import { router } from 'expo-router';
import {
  CheckCircle2,
  DatabaseBackup,
  Download,
  FileSpreadsheet,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card, Divider, KeyValue, SectionHeader } from '@/components/ui/Card';
import { AppSheet } from '@/components/ui/AppSheet';
import { ErrorNotice, ProcessingState, Skeleton } from '@/components/ui/States';
import { Screen } from '@/components/layout/Screen';
import { dateTimeLabel, relativeTime } from '@/features/stock/utils/format';
import { useBackup } from '../hooks/useBackup';

export function BackupScreen() {
  const vm = useBackup();

  return (
    <Screen title="Backup & data" subtitle="Keep a safe copy of your business" wide>
      {vm.status === 'loading' && <BackupSkeleton />}

      {vm.status === 'error' && (
        <ErrorNotice title="Couldn't load this screen" message="Something went wrong loading your data. Try again." action="Retry" onAction={vm.refetch} />
      )}

      {vm.status === 'ready' && vm.counts && (
        <View style={styles.stack}>
          <Card style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroIcon}>
                <DatabaseBackup size={24} color={colors.brand[600]} />
              </View>
              <View style={styles.flex1}>
                <AppText size={13} weight="semibold" color={colors.ink[500]}>
                  Last backup
                </AppText>
                <AppText size={22} weight="extrabold" color={colors.ink.DEFAULT} style={styles.heroValue}>
                  {vm.lastBackup ? relativeTime(vm.lastBackup.createdAt) : 'Never'}
                </AppText>
                <AppText size={13} color={colors.ink[400]} style={styles.heroCaption}>
                  {vm.lastBackup
                    ? `${dateTimeLabel(vm.lastBackup.createdAt)} · ${vm.lastBackup.sizeLabel} · ${vm.lastBackup.entries} records`
                    : 'No backup on this device yet'}
                </AppText>
              </View>
            </View>
            <View style={styles.noteBox}>
              <AppText size={13} color={colors.ink.DEFAULT} style={styles.noteText}>
                Your business data is stored on this device. Create a backup to keep a copy you can restore later or
                move to a new phone.
              </AppText>
            </View>
            <View style={styles.heroActions}>
              <Button icon={<DatabaseBackup size={18} color={colors.white} />} onPress={vm.startCreateBackup}>
                Create Backup
              </Button>
              <Button variant="secondary" icon={<RotateCcw size={18} color={colors.ink.DEFAULT} />} onPress={vm.openRestoreSelect}>
                Restore Backup
              </Button>
            </View>
          </Card>

          <View>
            <SectionHeader title="Backup history" />
            <Card style={styles.overflowHidden}>
              {vm.backups.length === 0 ? (
                <AppText size={13.5} color={colors.ink[500]} style={styles.emptyHistory}>
                  No backups yet.
                </AppText>
              ) : (
                vm.backups.map((b, i) => (
                  <View key={b.id}>
                    {i > 0 && <Divider />}
                    <View style={styles.historyRow}>
                      <View style={styles.historyIcon}>
                        <ShieldCheck size={18} color={colors.ink[700]} />
                      </View>
                      <View style={styles.flex1}>
                        <AppText size={14} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                          {dateTimeLabel(b.createdAt)}
                        </AppText>
                        <AppText size={12.5} color={colors.ink[400]}>
                          {b.sizeLabel} · {b.entries} records
                        </AppText>
                      </View>
                      <Button size="sm" variant="secondary" onPress={() => vm.openRestorePreview(b)}>
                        Restore
                      </Button>
                    </View>
                  </View>
                ))
              )}
            </Card>
          </View>

          <View>
            <SectionHeader title="Move data in and out" />
            <View style={styles.actionGrid}>
              <DataAction
                icon={<Upload size={20} color={colors.brand[600]} />}
                title="Import products (CSV)"
                caption="Bulk-add your catalogue from a spreadsheet"
                onPress={() => router.push('/more/import')}
              />
              <DataAction
                icon={<FileSpreadsheet size={20} color={colors.brand[600]} />}
                title="Export CSV"
                caption="Products, sales, purchases and more"
                onPress={() => router.push('/more/export')}
              />
              <DataAction
                icon={<Download size={20} color={colors.brand[600]} />}
                title="Export PDF report"
                caption="Share a printable summary"
                onPress={() => router.push('/more/export')}
              />
              <DataAction
                icon={<RotateCcw size={20} color={colors.brand[600]} />}
                title="Reset demo data"
                caption="Restore the sample shop for testing"
                onPress={vm.runResetDemoData}
              />
            </View>
          </View>

          <Card style={styles.deviceCard}>
            <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.deviceHeading}>
              On this device
            </AppText>
            <KeyValue label="Products" value={String(vm.counts.products)} />
            <KeyValue label="Sales" value={String(vm.counts.sales)} />
            <KeyValue label="Purchases" value={String(vm.counts.purchases)} />
            <KeyValue label="Stock movements" value={String(vm.counts.movements)} />
            <KeyValue label="Customers" value={String(vm.counts.customers)} />
            <KeyValue label="Suppliers" value={String(vm.counts.suppliers)} />
            <Divider />
            <KeyValue label="Total records" value={String(vm.totalRecords)} strong />
          </Card>
        </View>
      )}

      <AppSheet open={vm.phase === 'working'} onClose={() => undefined} title="Creating backup">
        <ProcessingState title="Packing your data" message="Collecting products, sales, purchases and movements." />
      </AppSheet>

      <AppSheet open={vm.phase === 'done'} onClose={vm.closeCreateSheet} title="Backup created successfully">
        {vm.created && (
          <>
            <View style={styles.doneWrap}>
              <View style={styles.doneIcon}>
                <CheckCircle2 size={28} color={colors.good[600]} />
              </View>
              <AppText size={16} weight="bold" color={colors.ink.DEFAULT} style={styles.doneTitle}>
                neptune-backup-{vm.created.id.slice(-6)}.cnb
              </AppText>
              <AppText size={13} color={colors.ink[500]}>
                {dateTimeLabel(vm.created.createdAt)} · {vm.created.sizeLabel} · {vm.created.entries} records
              </AppText>
            </View>
            <Button block size="lg" style={styles.doneButton} onPress={vm.closeCreateSheet}>
              Done
            </Button>
          </>
        )}
      </AppSheet>

      <AppSheet
        open={vm.restoreStep === 'select'}
        onClose={vm.closeRestoreFlow}
        title="Restore backup"
        description="Choose the backup you want to load onto this device."
      >
        {vm.backups.length === 0 ? (
          <ErrorNotice
            title="No backups found"
            message="There is nothing to restore on this device. Create a backup first, or import a backup file."
          />
        ) : (
          <View style={styles.selectList}>
            {vm.backups.map((b) => (
              <Pressable key={b.id} onPress={() => vm.openRestorePreview(b)} style={({ pressed }) => [styles.selectRow, pressed && styles.selectRowPressed]}>
                <ShieldCheck size={18} color={colors.ink[500]} />
                <View style={styles.flex1}>
                  <AppText size={14} weight="semibold" color={colors.ink.DEFAULT}>
                    {dateTimeLabel(b.createdAt)}
                  </AppText>
                  <AppText size={12} color={colors.ink[400]}>
                    {b.sizeLabel} · {b.entries} records
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </AppSheet>

      <AppSheet
        open={vm.restoreStep === 'preview'}
        onClose={vm.closeRestoreFlow}
        title="Confirm restore"
        description="Review what will be loaded before you continue."
        footer={
          <View style={styles.previewFooter}>
            <Button variant="secondary" block onPress={vm.closeRestoreFlow}>
              Cancel
            </Button>
            <Button variant="danger" block onPress={vm.runRestore}>
              Restore backup
            </Button>
          </View>
        }
      >
        <ErrorNotice
          tone="warn"
          title="Restoring this backup may replace current data"
          message="Products, sales, purchases and stock recorded after this backup will be lost. This cannot be undone."
        />
        {vm.restoreTarget && vm.counts && (
          <View style={styles.previewDetail}>
            <KeyValue label="Backup date" value={dateTimeLabel(vm.restoreTarget.createdAt)} />
            <Divider />
            <KeyValue label="Size" value={vm.restoreTarget.sizeLabel} />
            <Divider />
            <KeyValue label="Records in backup" value={String(vm.restoreTarget.entries)} />
            <Divider />
            <KeyValue label="Records on device now" value={String(vm.totalRecords)} strong />
          </View>
        )}
      </AppSheet>

      <AppSheet open={vm.restoreStep === 'working'} onClose={() => undefined} title="Restoring backup">
        <ProcessingState title="Restoring your data" message="Please keep the app open until this finishes." />
      </AppSheet>
    </Screen>
  );
}

function DataAction({ icon, title, caption, onPress }: { icon: React.ReactNode; title: string; caption: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}>
      <View style={styles.tileIcon}>{icon}</View>
      <View style={styles.flex1}>
        <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT}>
          {title}
        </AppText>
        <AppText size={12.5} color={colors.ink[500]}>
          {caption}
        </AppText>
      </View>
    </Pressable>
  );
}

function BackupSkeleton() {
  return (
    <View style={styles.stack} accessibilityLabel="Loading" accessibilityState={{ busy: true }}>
      <Skeleton style={styles.skeletonHero} />
      <Skeleton style={styles.skeletonBlock} />
      <Skeleton style={styles.skeletonBlock} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[5] },
  flex1: { flex: 1, minWidth: 0 },
  overflowHidden: { overflow: 'hidden' },
  heroCard: { padding: spacing[5] },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[4] },
  heroIcon: {
    height: spacing[12],
    width: spacing[12],
    borderRadius: radius['2xl'],
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroValue: { marginTop: 1 },
  heroCaption: { marginTop: 1 },
  noteBox: { marginTop: spacing[4], borderRadius: radius.xl, backgroundColor: colors.ink[50], padding: spacing[3.5] },
  noteText: { lineHeight: 19 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2.5], marginTop: spacing[4] },
  emptyHistory: { textAlign: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[6] },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3.5] },
  historyIcon: { height: spacing[9], width: spacing[9], borderRadius: radius.xl, backgroundColor: colors.ink[100], alignItems: 'center', justifyContent: 'center' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2.5] },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.ink[200],
    backgroundColor: colors.white,
    padding: spacing[4],
  },
  tilePressed: { backgroundColor: colors.brand[50], borderColor: colors.brand[200] },
  tileIcon: {
    height: spacing[10],
    width: spacing[10],
    borderRadius: radius.xl,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceCard: { padding: spacing[4] },
  deviceHeading: { marginBottom: spacing[1], textTransform: 'uppercase', letterSpacing: 0.325 },
  doneWrap: { alignItems: 'center', paddingVertical: spacing[3] },
  doneIcon: {
    height: spacing[14],
    width: spacing[14],
    borderRadius: radius['2xl'],
    backgroundColor: colors.good[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: { marginTop: spacing[3], textAlign: 'center' },
  doneButton: { marginTop: spacing[2] },
  selectList: { gap: spacing[2] },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], borderRadius: radius.xl, borderWidth: 1, borderColor: colors.ink[200], padding: spacing[3] },
  selectRowPressed: { backgroundColor: colors.ink[50] },
  previewFooter: { flexDirection: 'row', gap: spacing[3] },
  previewDetail: { marginTop: spacing[3] },
  skeletonHero: { height: 190, borderRadius: radius['2xl'] },
  skeletonBlock: { height: 160, borderRadius: radius['2xl'] },
});
