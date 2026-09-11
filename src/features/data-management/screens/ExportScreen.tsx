/**
 * Direct port of the web reference's src/pages/data/ExportData.tsx.
 */
import React from 'react';
import { Check, CheckCircle2, Download, FileSpreadsheet, FileText } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card, Divider } from '@/components/ui/Card';
import { AppSheet } from '@/components/ui/AppSheet';
import { ErrorNotice, Skeleton, ProcessingState } from '@/components/ui/States';
import { Screen } from '@/components/layout/Screen';
import { useToast } from '@/components/ui/Toast';
import { EXPORT_FORMAT_OPTIONS } from '../constants';
import { useExportData } from '../hooks/useExportData';

const FORMAT_ICONS = { csv: FileSpreadsheet, pdf: FileText } as const;

export function ExportScreen() {
  const toast = useToast();
  const vm = useExportData();

  return (
    <Screen
      title="Export data"
      subtitle="Take a copy of your business data with you"
      wide
      footer={
        vm.status === 'ready' ? (
          <Button size="lg" block icon={<Download size={18} color={colors.white} />} onPress={vm.generate}>
            Generate export
          </Button>
        ) : undefined
      }
    >
      {vm.status === 'loading' && <Skeleton style={styles.skeletonBlock} />}

      {vm.status === 'error' && (
        <ErrorNotice title="Couldn't load this screen" message="Something went wrong loading your data. Try again." action="Retry" onAction={vm.refetch} />
      )}

      {vm.status === 'ready' && (
        <View style={styles.stack}>
          {vm.error && <ErrorNotice title="Nothing selected" message={vm.error} />}

          <View>
            <AppText size={14} weight="bold" color={colors.ink.DEFAULT} style={styles.sectionHeading}>
              What to export
            </AppText>
            <Card style={styles.overflowHidden}>
              {vm.datasets.map((d, i) => {
                const checked = vm.selected.includes(d.key);
                return (
                  <View key={d.key}>
                    {i > 0 && <Divider />}
                    <Pressable onPress={() => vm.toggle(d.key)} style={({ pressed }) => [styles.datasetRow, pressed && styles.datasetRowPressed]}>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>{checked && <Check size={14} color={colors.white} />}</View>
                      <AppText size={15} weight="semibold" color={colors.ink.DEFAULT} style={styles.flex1}>
                        {d.label}
                      </AppText>
                      <AppText size={13} color={colors.ink[400]} tabular>
                        {d.count} records
                      </AppText>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          </View>

          <View>
            <AppText size={14} weight="bold" color={colors.ink.DEFAULT} style={styles.sectionHeading}>
              Format
            </AppText>
            <View style={styles.formatGrid}>
              {EXPORT_FORMAT_OPTIONS.map((f) => {
                const selected = vm.format === f.key;
                const Icon = FORMAT_ICONS[f.key];
                return (
                  <Pressable key={f.key} onPress={() => vm.setFormat(f.key)} style={[styles.formatTile, selected ? styles.formatTileSelected : styles.formatTileDefault]}>
                    <Icon size={20} color={colors.brand[600]} />
                    <AppText size={15} weight="bold" color={colors.ink.DEFAULT} style={styles.formatTitle}>
                      {f.title}
                    </AppText>
                    <AppText size={12.5} color={colors.ink[500]}>
                      {f.caption}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Card style={styles.summaryNote}>
            <AppText size={13} color={colors.ink[500]} style={styles.summaryNoteText}>
              {vm.selected.length} sets selected · about {vm.totalRows} records. The file is generated on this device
              and saved to your downloads.
            </AppText>
          </Card>
        </View>
      )}

      <AppSheet open={vm.phase === 'working'} onClose={() => undefined} title="Generating export" dismissable={false}>
        <ProcessingState title="Preparing your file" message={`Writing ${vm.totalRows} records to ${vm.format.toUpperCase()}.`} />
      </AppSheet>

      <AppSheet open={vm.phase === 'done'} onClose={vm.closeDoneSheet} title="Export ready">
        <View style={styles.doneWrap}>
          <View style={styles.doneIcon}>
            <CheckCircle2 size={28} color={colors.good[600]} />
          </View>
          <AppText size={16} weight="bold" color={colors.ink.DEFAULT} style={styles.doneTitle}>
            neptune-export-{new Date().toISOString().slice(0, 10)}.{vm.format}
          </AppText>
          <AppText size={13} color={colors.ink[500]}>
            {vm.selected.length} data sets · {vm.totalRows} records
          </AppText>
        </View>
        <View style={styles.doneActions}>
          <Button block size="lg" onPress={() => toast('File shared.', 'info')}>
            Share file
          </Button>
          <Button block size="lg" variant="secondary" onPress={vm.closeDoneSheet}>
            Done
          </Button>
        </View>
      </AppSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1, minWidth: 0 },
  overflowHidden: { overflow: 'hidden' },
  sectionHeading: { paddingHorizontal: spacing[1], paddingBottom: spacing[2] },
  datasetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3.5] },
  datasetRowPressed: { backgroundColor: colors.ink[50] },
  checkbox: {
    height: 20,
    width: 20,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { borderColor: colors.brand[600], backgroundColor: colors.brand[600] },
  formatGrid: { flexDirection: 'row', gap: spacing[3] },
  formatTile: { flex: 1, gap: spacing[2.5], borderRadius: radius['2xl'], borderWidth: 1, padding: spacing[4] },
  formatTileSelected: { borderColor: colors.brand[600], backgroundColor: colors.brand[50] },
  formatTileDefault: { borderColor: colors.ink[200], backgroundColor: colors.white },
  formatTitle: { marginTop: spacing[0.5] },
  summaryNote: { padding: spacing[4] },
  summaryNoteText: { lineHeight: 19 },
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
  doneActions: { gap: spacing[2.5], marginTop: spacing[2] },
  skeletonBlock: { height: 300, borderRadius: radius['2xl'] },
});
