/**
 * Ported from the web reference's src/components/layout/AppShell.tsx
 * `quickActions` array + the Sheet it opens (title "Quick actions",
 * description "Jump straight into your most common tasks.", 2-column
 * tile grid). Same icons, labels, tone colors, and destinations (`to`)
 * as the web source. Routing itself is a single `router.push(a.to)` here —
 * no per-destination logic is duplicated; each destination screen owns
 * whatever happens once it's reached.
 */
import React from 'react';
import { router, type Href } from 'expo-router';
import { ArrowDownToLine, ArrowUpFromLine, PackagePlus, ReceiptIndianRupee, ScanLine, ShoppingCart } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, withOpacity } from '../../theme';
import { AppSheet } from '../ui/AppSheet';
import { AppText } from '../ui/AppText';

interface QuickAction {
  label: string;
  Icon: typeof ReceiptIndianRupee;
  iconBg: string;
  iconColor: string;
  to: Href;
}

const quickActions: QuickAction[] = [
  { label: 'New Sale', Icon: ReceiptIndianRupee, iconBg: colors.brand[600], iconColor: colors.white, to: '/sales/new' },
  { label: 'Stock In', Icon: ArrowDownToLine, iconBg: colors.good[50], iconColor: colors.good[700], to: '/more/stock/in' },
  { label: 'Stock Out', Icon: ArrowUpFromLine, iconBg: colors.warn[50], iconColor: colors.warn[700], to: '/more/stock/out' },
  { label: 'Add Product', Icon: PackagePlus, iconBg: colors.ink[100], iconColor: colors.ink[700], to: '/products/new' },
  { label: 'New Purchase', Icon: ShoppingCart, iconBg: colors.ink[100], iconColor: colors.ink[700], to: '/purchases/new' },
  { label: 'Scan Barcode', Icon: ScanLine, iconBg: colors.ink[100], iconColor: colors.ink[700], to: '/scan' },
];

interface QuickActionsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function QuickActionsSheet({ open, onClose }: QuickActionsSheetProps) {
  return (
    <AppSheet open={open} onClose={onClose} title="Quick actions" description="Jump straight into your most common tasks.">
      <View style={styles.grid}>
        {quickActions.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => {
              onClose();
              router.push(a.to);
            }}
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          >
            <View style={[styles.iconWrap, { backgroundColor: a.iconBg }]}>
              <a.Icon size={20} color={a.iconColor} />
            </View>
            <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT}>
              {a.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </AppSheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  tile: {
    width: '47%',
    flexGrow: 1,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: withOpacity(colors.ink[200], 70),
    padding: spacing[4],
    gap: spacing[3],
  },
  tilePressed: { backgroundColor: withOpacity(colors.brand[50], 50), borderColor: colors.brand[200] },
  iconWrap: {
    height: spacing[10],
    width: spacing[10],
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
