/**
 * Ported from the web reference's src/components/common/MovementSheet.tsx.
 * Kept feature-owned (not promoted to components/common) — Stock is the
 * only feature using it so far; promote only once Sales/Purchases/Reports
 * prove real reuse, per the "don't promote on speculation" rule.
 * movementLabel/movementTone are exported alongside it (as the web
 * co-locates them) since StockDashboardScreen's recent-movements row and
 * MovementsScreen's rows both need the same badge wording/tone.
 */
import React from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppSheet } from '@/components/ui/AppSheet';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Divider, KeyValue } from '@/components/ui/Card';
import type { MovementType, StockMovement } from '../types';
import { dateTimeLabel } from '../utils/format';
import { formatSignedQuantity } from '../utils/quantity';

export const movementLabel: Record<MovementType, string> = {
  OPENING_STOCK: 'Opening Stock',
  PURCHASE: 'Purchase',
  SALE: 'Sale',
  SALE_RETURN: 'Return',
  PURCHASE_RETURN: 'Purchase Return',
  DAMAGE: 'Damage',
  MANUAL_IN: 'Stock In',
  MANUAL_OUT: 'Stock Out',
  ADJUSTMENT: 'Adjustment',
  REVERSAL: 'Reversal',
};

export const movementTone: Record<MovementType, 'good' | 'bad' | 'warn' | 'brand' | 'neutral'> = {
  OPENING_STOCK: 'good',
  PURCHASE: 'good',
  MANUAL_IN: 'good',
  SALE_RETURN: 'brand',
  SALE: 'bad',
  MANUAL_OUT: 'bad',
  DAMAGE: 'bad',
  PURCHASE_RETURN: 'warn',
  ADJUSTMENT: 'warn',
  REVERSAL: 'neutral',
};

interface MovementSheetProps {
  movement: StockMovement | null;
  onClose: () => void;
}

export function MovementSheet({ movement, onClose }: MovementSheetProps) {
  return (
    <AppSheet
      open={!!movement}
      onClose={onClose}
      title="Movement details"
      description={movement ? `${movement.reference} · ${dateTimeLabel(movement.createdAt)}` : ''}
    >
      {movement && (
        <>
          <View style={styles.summaryCard}>
            <View>
              <AppText size={13} weight="semibold" color={colors.ink[500]}>
                {movement.productName}
              </AppText>
              <Badge tone={movementTone[movement.type]} style={styles.badgeWrap}>
                {movementLabel[movement.type]}
              </Badge>
            </View>
            <AppText
              size={30}
              weight="extrabold"
              tabular
              color={movement.quantityDelta > 0 ? colors.good[600] : movement.quantityDelta < 0 ? colors.bad[600] : colors.ink[500]}
            >
              {formatSignedQuantity(movement.quantityDelta)}
            </AppText>
          </View>
          <View style={styles.detailStack}>
            <KeyValue label="Previous stock" value={`${movement.quantityBefore} units`} />
            <Divider />
            <KeyValue label="New stock" value={`${movement.quantityAfter} units`} strong />
            <Divider />
            <KeyValue label="Reason" value={movement.reason} />
            <Divider />
            <KeyValue label="Reference" value={movement.reference} />
            <Divider />
            <KeyValue label="Recorded by" value={movement.recordedBy} />
            <Divider />
            <KeyValue label="Date & time" value={dateTimeLabel(movement.createdAt)} />
          </View>
          <Button
            block
            variant="secondary"
            style={styles.openProduct}
            onPress={() => {
              onClose();
              router.push(`/products/${movement.productId}`);
            }}
          >
            Open product
          </Button>
        </>
      )}
    </AppSheet>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.ink[50],
    borderRadius: radius['2xl'],
    padding: spacing[4],
  },
  badgeWrap: { marginTop: spacing[1.5] },
  detailStack: { marginTop: spacing[2] },
  openProduct: { marginTop: spacing[4] },
});
