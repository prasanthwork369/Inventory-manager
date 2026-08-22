/**
 * Ported from the web reference's Dashboard.tsx Quick Actions grid tile.
 * Note: visually distinct from the FAB's QuickActionsSheet tiles (icon-
 * square-badge style) — this is the dashboard's own primary/secondary
 * button-style tile, matching the web source exactly; they only happen to
 * share some destinations (see src/constants/routes.ts).
 */
import React from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, withOpacity } from '@/theme';
import { AppText } from '@/components/ui/AppText';

interface QuickActionItemProps {
  label: string;
  Icon: LucideIcon;
  primary?: boolean;
  onPress: () => void;
}

export function QuickActionItem({ label, Icon, primary, onPress }: QuickActionItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        primary ? styles.tilePrimary : styles.tileDefault,
        pressed && (primary ? styles.tilePrimaryPressed : styles.tileDefaultPressed),
      ]}
      accessibilityRole="button"
    >
      <Icon size={20} color={primary ? colors.white : colors.brand[600]} />
      <AppText size={14.5} weight="semibold" color={primary ? colors.white : colors.ink.DEFAULT}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'flex-start',
    gap: spacing[3],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    padding: spacing[4],
  },
  tilePrimary: { borderColor: colors.brand[600], backgroundColor: colors.brand[600] },
  tilePrimaryPressed: { backgroundColor: colors.brand[700] },
  tileDefault: { borderColor: withOpacity(colors.ink[200], 70), backgroundColor: colors.white },
  tileDefaultPressed: { backgroundColor: withOpacity(colors.brand[50], 40), borderColor: colors.brand[200] },
});
