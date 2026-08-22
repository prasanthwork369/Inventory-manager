/**
 * Ported from the web reference's Dashboard.tsx "Recent activity" row.
 * The avatar reproduces src/components/common/ProductThumb.tsx's
 * hashed-color-initials fallback (its only path relevant here — Dashboard
 * has no Product entity to look up an `image` for, and its aggregate
 * DashboardActivityItem already carries a resolved `productName`, so the
 * web's separate "product not found" gray-square branch doesn't apply).
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { describeMovement, formatRelativeTime } from '../utils/format';
import type { DashboardActivityItem } from '../types';

const AVATAR_PALETTES: { bg: string; text: string }[] = [
  { bg: colors.brand[50], text: colors.brand[700] },
  { bg: colors.good[50], text: colors.good[700] },
  { bg: colors.warn[50], text: colors.warn[700] },
  { bg: colors.bad[50], text: colors.bad[700] },
  { bg: colors.ink[100], text: colors.ink[700] },
  { bg: colors.brand[100], text: colors.brand[800] },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 997;
  return h;
}

function initials(name: string): string {
  const parts = name
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .split(' ')
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

interface RecentActivityRowProps {
  item: DashboardActivityItem;
  onPress: () => void;
}

export function RecentActivityRow({ item, onPress }: RecentActivityRowProps) {
  const palette = AVATAR_PALETTES[hash(item.productName) % AVATAR_PALETTES.length];
  const qtyColor = item.quantity > 0 ? colors.good[600] : item.quantity < 0 ? colors.bad[600] : colors.ink[400];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <View style={[styles.avatar, { backgroundColor: palette.bg }]}>
        <AppText size={12} weight="bold" color={palette.text} style={styles.avatarText}>
          {initials(item.productName)}
        </AppText>
      </View>
      <View style={styles.body}>
        <AppText size={14} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
          {describeMovement(item.type, item.quantity)} {item.productName}
        </AppText>
        <AppText size={12.5} color={colors.ink[400]} numberOfLines={1}>
          {item.reference} · {formatRelativeTime(item.occurredAt)}
        </AppText>
      </View>
      <AppText size={14} weight="bold" color={qtyColor} tabular>
        {item.quantity > 0 ? '+' : ''}
        {item.quantity}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  rowPressed: { backgroundColor: colors.ink[50] },
  avatar: { height: spacing[9], width: spacing[9], borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { letterSpacing: -0.3 },
  body: { flex: 1, minWidth: 0 },
});
