/**
 * Direct port of the web reference's src/pages/data/ImportProducts.tsx.
 */
import React from 'react';
import { router } from 'expo-router';
import { CheckCircle2, FileSpreadsheet, Upload, XCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, Divider, KeyValue, SectionHeader } from '@/components/ui/Card';
import { ErrorNotice, ProcessingState } from '@/components/ui/States';
import { Screen } from '@/components/layout/Screen';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/features/products/utils/money';
import { CURRENCY_SYMBOL, IMPORT_REQUIRED_COLUMNS } from '../constants';
import { useImportProducts } from '../hooks/useImportProducts';

export function ImportScreen() {
  const toast = useToast();
  const vm = useImportProducts();

  return (
    <Screen title="Import products" subtitle="Bring your catalogue in from a spreadsheet" wide>
      {vm.step === 'upload' && (
        <View style={styles.stack}>
          <Pressable onPress={vm.startValidation} style={({ pressed }) => [styles.uploadButton, pressed && styles.uploadButtonPressed]}>
            <View style={styles.uploadIcon}>
              <Upload size={28} color={colors.brand[600]} />
            </View>
            <AppText size={16} weight="bold" color={colors.ink.DEFAULT}>
              Choose a CSV file
            </AppText>
            <AppText size={13.5} color={colors.ink[500]} style={styles.uploadCaption}>
              Your file stays on this device. Nothing is uploaded to a server.
            </AppText>
          </Pressable>

          <Card style={styles.columnsCard}>
            <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.columnsHeading}>
              Required columns
            </AppText>
            <AppText size={13.5} color={colors.ink.DEFAULT} style={styles.columnsText}>
              {IMPORT_REQUIRED_COLUMNS}
            </AppText>
            <Button
              variant="secondary"
              style={styles.templateButton}
              icon={<FileSpreadsheet size={16} color={colors.ink.DEFAULT} />}
              onPress={() => toast('Sample CSV template saved to this device.', 'info')}
            >
              Download template
            </Button>
          </Card>
        </View>
      )}

      {vm.step === 'validating' && (
        <Card>
          <ProcessingState title="Checking your file" message="Validating 6 rows for duplicates, prices and missing fields." />
        </Card>
      )}

      {vm.step === 'preview' && (
        <View style={styles.stack}>
          <View style={styles.badgeRow}>
            <Badge tone="good">{vm.valid.length} ready to import</Badge>
            <Badge tone="bad">{vm.invalid.length} need fixing</Badge>
            <Badge tone="neutral">{vm.rows.length} rows found</Badge>
          </View>

          {vm.invalid.length > 0 && (
            <ErrorNotice
              tone="warn"
              title={`${vm.invalid.length} rows will be skipped`}
              message="Fix these rows in your spreadsheet and upload again, or import the valid rows now and add the rest manually."
              action="Upload a different file"
              onAction={vm.backToUpload}
            />
          )}

          <View>
            <SectionHeader title="Valid rows" />
            <Card style={styles.overflowHidden}>
              {vm.valid.map((r, i) => (
                <View key={r.sku}>
                  {i > 0 && <Divider />}
                  <View style={styles.rowItem}>
                    <CheckCircle2 size={18} color={colors.good[500]} />
                    <View style={styles.flex1}>
                      <AppText size={14} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                        {r.name}
                      </AppText>
                      <AppText size={12.5} color={colors.ink[400]} numberOfLines={1}>
                        SKU {r.sku} · {r.openingStock} units · cost {formatMoney(r.costMinor, CURRENCY_SYMBOL)}
                      </AppText>
                    </View>
                    <AppText size={14} weight="bold" color={colors.ink.DEFAULT} tabular>
                      {formatMoney(r.sellingMinor, CURRENCY_SYMBOL)}
                    </AppText>
                  </View>
                </View>
              ))}
            </Card>
          </View>

          <View>
            <SectionHeader title="Rows with problems" />
            <Card style={styles.overflowHidden}>
              {vm.invalid.map((r, i) => (
                <View key={`${r.sku}-${i}`}>
                  {i > 0 && <Divider />}
                  <View style={styles.problemRow}>
                    <XCircle size={18} color={colors.bad[500]} style={styles.problemIcon} />
                    <View style={styles.flex1}>
                      <AppText size={14} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                        {r.name || `Row ${i + 4} (no name)`}
                      </AppText>
                      <AppText size={12.5} weight="medium" color={colors.bad[600]}>
                        {r.error}
                      </AppText>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </View>

          <Card style={styles.summaryCard}>
            <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.summaryHeading}>
              Summary
            </AppText>
            <KeyValue label="Rows in file" value={String(vm.rows.length)} />
            <KeyValue label="Will import" value={String(vm.valid.length)} />
            <KeyValue label="Will skip" value={String(vm.invalid.length)} />
            <Divider />
            <KeyValue label="Opening stock added" value={`${vm.valid.reduce((s, r) => s + r.openingStock, 0)} units`} strong />
            <Button block size="lg" style={styles.importButton} onPress={vm.runImport}>
              Import {vm.valid.length} products
            </Button>
            <Button block variant="ghost" style={styles.chooseAnotherButton} onPress={vm.backToUpload}>
              Choose another file
            </Button>
          </Card>
        </View>
      )}

      {vm.step === 'importing' && (
        <Card>
          <ProcessingState title="Importing products" message="Adding products and opening stock to this device." />
        </Card>
      )}

      {vm.step === 'done' && (
        <Card style={styles.doneCard}>
          <View style={styles.doneIcon}>
            <CheckCircle2 size={28} color={colors.good[600]} />
          </View>
          <AppText size={19} weight="extrabold" color={colors.ink.DEFAULT} style={styles.doneTitle}>
            Import complete
          </AppText>
          <AppText size={13.5} color={colors.ink[500]} style={styles.doneCaption}>
            Your catalogue has been updated on this device.
          </AppText>
          <View style={styles.statsRow}>
            <Stat label="Imported" value={String(vm.valid.length)} color={colors.good[600]} />
            <Stat label="Skipped" value={String(vm.invalid.length)} color={colors.warn[600]} />
            <Stat label="Failed" value="0" color={colors.ink.DEFAULT} />
          </View>
          <View style={styles.doneActions}>
            <Button block variant="secondary" onPress={vm.backToUpload}>
              Import more
            </Button>
            <Button block onPress={() => router.push('/products')}>
              View products
            </Button>
          </View>
        </Card>
      )}
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <AppText size={22} weight="extrabold" color={color} tabular>
        {value}
      </AppText>
      <AppText size={12} weight="semibold" color={colors.ink[500]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1, minWidth: 0 },
  overflowHidden: { overflow: 'hidden' },
  uploadButton: {
    alignItems: 'center',
    borderRadius: radius['3xl'],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.ink[200],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[12],
  },
  uploadButtonPressed: { borderColor: colors.brand[300], backgroundColor: colors.brand[50] },
  uploadIcon: {
    height: spacing[14],
    width: spacing[14],
    borderRadius: radius['2xl'],
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  uploadCaption: { marginTop: spacing[1], textAlign: 'center', maxWidth: 280 },
  columnsCard: { padding: spacing[4] },
  columnsHeading: { textTransform: 'uppercase', letterSpacing: 0.325 },
  columnsText: { marginTop: spacing[2], lineHeight: 19 },
  templateButton: { marginTop: spacing[3], alignSelf: 'flex-start' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  problemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  problemIcon: { marginTop: 2 },
  summaryCard: { padding: spacing[4] },
  summaryHeading: { marginBottom: spacing[1], textTransform: 'uppercase', letterSpacing: 0.325 },
  importButton: { marginTop: spacing[4] },
  chooseAnotherButton: { marginTop: spacing[2] },
  doneCard: { alignItems: 'center', padding: spacing[6] },
  doneIcon: {
    height: spacing[14],
    width: spacing[14],
    borderRadius: radius['2xl'],
    backgroundColor: colors.good[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  doneTitle: { textAlign: 'center' },
  doneCaption: { marginTop: spacing[1], textAlign: 'center' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.ink[100],
    marginTop: spacing[5],
    paddingVertical: spacing[4],
  },
  stat: { alignItems: 'center' },
  doneActions: { flexDirection: 'row', gap: spacing[2.5], marginTop: spacing[5], width: '100%' },
});
