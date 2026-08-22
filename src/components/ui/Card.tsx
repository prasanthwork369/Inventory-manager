/**
 * Ported from the web reference's src/components/ui/Surface.tsx — Card,
 * SectionHeader, Row, Divider, KeyValue. (Badge lives in ./Badge.tsx.)
 * Text now renders through AppText per the typography lock.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing, withOpacity } from '../../theme';
import { AppText } from './AppText';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({ title, action, onAction, style }: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <AppText size={15} weight="bold" color={colors.ink.DEFAULT}>
        {title}
      </AppText>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <AppText size={13} weight="semibold" color={colors.brand[600]}>
            {action}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

interface RowProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Row({ icon, title, subtitle, right, onPress, danger, style }: RowProps) {
  const content = (
    <>
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: danger ? colors.bad[50] : colors.ink[100] }]}>{icon}</View>
      )}
      <View style={styles.rowBody}>
        {typeof title === 'string' ? (
          <AppText size={15} weight="semibold" color={danger ? colors.bad[600] : colors.ink.DEFAULT} numberOfLines={1}>
            {title}
          </AppText>
        ) : (
          title
        )}
        {subtitle &&
          (typeof subtitle === 'string' ? (
            <AppText size={13} color={colors.ink[500]} numberOfLines={1} style={styles.rowSubtitle}>
              {subtitle}
            </AppText>
          ) : (
            subtitle
          ))}
      </View>
      {right ?? (onPress && <ChevronRight size={18} color={colors.ink[400]} />)}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.ink[50] : 'transparent' }, style]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.row, style]}>{content}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

interface KeyValueProps {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}

export function KeyValue({ label, value, strong }: KeyValueProps) {
  return (
    <View style={styles.keyValueRow}>
      <AppText size={13.5} weight={strong ? 'semibold' : 'regular'} color={strong ? colors.ink.DEFAULT : colors.ink[500]}>
        {label}
      </AppText>
      {typeof value === 'string' || typeof value === 'number' ? (
        <AppText
          size={strong ? 17 : 14}
          weight={strong ? 'bold' : 'semibold'}
          color={strong ? colors.ink.DEFAULT : colors.ink[700]}
          tabular
          style={styles.keyValueValue}
        >
          {value}
        </AppText>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: withOpacity(colors.ink[200], 70),
    backgroundColor: colors.white,
    ...shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[1],
    paddingBottom: spacing[2.5],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  rowIcon: {
    height: spacing[9],
    width: spacing[9],
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowSubtitle: { marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.ink[100] },
  keyValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[4],
    paddingVertical: spacing[2],
  },
  keyValueValue: { textAlign: 'right' },
});
