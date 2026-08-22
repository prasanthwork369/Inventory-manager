/**
 * Ported from the web reference's src/components/common/ProductThumb.tsx.
 * Lives in components/common (not features/products) matching the web
 * source's own structure — Dashboard already needed this exact hash+
 * initials logic for its Recent Activity avatars (independently
 * re-implemented there since Products didn't exist yet at that phase;
 * this is the canonical version for anything built from here on).
 *
 * No `image` prop/branch: Product has no image field in this project's
 * approved schema (product photo persistence is deferred, decided back in
 * the Dashboard phase) — every thumb is the hashed-color-initials avatar.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../../theme';
import { AppText } from '../ui/AppText';

const PALETTES: { bg: string; text: string }[] = [
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

type ThumbSize = 'sm' | 'md' | 'lg' | 'xl';

// web: font-bold tracking-tight on every size -> letterSpacing scales with
// font size (-0.025em each), not a single flat value across all sizes.
const SIZES: Record<ThumbSize, { box: number; radius: number; fontSize: 12 | 14 | 18 | 26; letterSpacing: number }> = {
  sm: { box: 36, radius: radius.lg, fontSize: 12, letterSpacing: -0.3 },
  md: { box: 48, radius: radius.xl, fontSize: 14, letterSpacing: -0.35 },
  lg: { box: 64, radius: radius['2xl'], fontSize: 18, letterSpacing: -0.45 },
  xl: { box: 96, radius: radius['2xl'], fontSize: 26, letterSpacing: -0.65 },
};

interface ProductThumbProps {
  product: { name: string; categoryId: string | null };
  size?: ThumbSize;
  style?: StyleProp<ViewStyle>;
}

export function ProductThumb({ product, size = 'md', style }: ProductThumbProps) {
  const dims = SIZES[size];
  const palette = PALETTES[hash(product.categoryId || product.name) % PALETTES.length];

  return (
    <View
      style={[
        styles.base,
        { height: dims.box, width: dims.box, borderRadius: dims.radius, backgroundColor: palette.bg },
        style,
      ]}
    >
      <AppText size={dims.fontSize} weight="bold" color={palette.text} style={{ letterSpacing: dims.letterSpacing }}>
        {initials(product.name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
