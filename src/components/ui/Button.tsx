/**
 * Ported from the web reference's src/components/ui/Button.tsx (Button,
 * IconButton). Variant/size color and metric values are copied 1:1; RN has
 * no `:hover`, so the web's `hover:`/`active:` background shades are both
 * folded into Pressable's `pressed` state (closest touch equivalent).
 */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing, type FontSizeToken } from '../../theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

const variantStyles: Record<Variant, { bg: string; bgPressed: string; text: string; textPressed?: string; border?: string; shadow?: object }> = {
  // web: shadow-sm on the primary variant only
  primary: { bg: colors.brand[600], bgPressed: colors.brand[800], text: colors.white, shadow: shadows.card },
  secondary: { bg: colors.white, bgPressed: colors.ink[100], text: colors.ink.DEFAULT, border: colors.ink[200] },
  // web: text-ink-500 base, hover:text-ink (ink.DEFAULT) — folded into pressed
  ghost: { bg: 'transparent', bgPressed: colors.ink[100], text: colors.ink[500], textPressed: colors.ink.DEFAULT },
  danger: { bg: colors.bad[500], bgPressed: colors.bad[700], text: colors.white },
  success: { bg: colors.good[500], bgPressed: colors.good[700], text: colors.white },
};

const sizeStyles: Record<Size, { height: number; paddingHorizontal: number; fontSize: FontSizeToken; gap: number; borderRadius: number }> = {
  sm: { height: spacing[9], paddingHorizontal: spacing[3], fontSize: 13, gap: spacing[1.5], borderRadius: radius.lg },
  md: { height: spacing[11], paddingHorizontal: spacing[4], fontSize: 15, gap: spacing[2], borderRadius: radius.xl },
  lg: { height: spacing[14], paddingHorizontal: spacing[5], fontSize: 16, gap: spacing[2.5], borderRadius: radius['2xl'] },
};

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  disabled,
  icon,
  onPress,
  children,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          borderRadius: s.borderRadius,
          gap: s.gap,
          backgroundColor: pressed && !isDisabled ? v.bgPressed : v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          opacity: isDisabled ? 0.45 : 1,
          width: block ? '100%' : undefined,
          ...(v.shadow ?? null),
        },
        style,
      ]}
    >
      {({ pressed }) => (
        <>
          {loading && <ActivityIndicator size="small" color={v.text} />}
          {!loading && icon}
          {React.isValidElement(children) ? (
            children
          ) : (
            <AppText
              size={s.fontSize}
              weight="semibold"
              color={pressed && v.textPressed ? v.textPressed : v.text}
              numberOfLines={1}
            >
              {children}
            </AppText>
          )}
        </>
      )}
    </Pressable>
  );
}

interface IconButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

// Web's IconButton sets an ambient `text-ink-500` that its icon inherits via
// CSS unless the icon overrides its own color (e.g. Trash2Icon
// "text-bad-500" in ProductDetail). RN icons take an explicit `color` prop
// per instance with no CSS-style inheritance, so there is no ambient
// default to replicate here — each call site must pass the icon's color
// directly (as Header's back chevron and AppSheet's close button already
// do, matching the web instance they came from).
export function IconButton({ onPress, children, accessibilityLabel, style }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: pressed ? colors.ink[100] : 'transparent' },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    height: spacing[10],
    width: spacing[10],
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
