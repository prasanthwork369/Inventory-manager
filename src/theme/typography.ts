import type { TextStyle } from 'react-native';

/**
 * Font family: Inter, matching the web reference's
 * `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800...')`
 * in index.css and `fontFamily.sans` in tailwind.config.js.
 *
 * Loaded via @expo-google-fonts/inter in src/app/_layout.tsx. These names
 * match the export names from that package and must be passed to useFonts().
 */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export type FontWeightToken = keyof typeof fontFamily;

/**
 * Web reference never uses a named type scale — every screen sets an
 * arbitrary Tailwind bracket value (text-[13px], text-[17px], ...). This is
 * every distinct size found across src/pages and src/components in the web
 * project, kept as literal numbers so screens can reference the exact same
 * pixel value the reference uses instead of rounding to a generic scale.
 *
 * `34` added during the onboarding feature port — Onboarding.tsx's splash
 * logo (`text-[34px]`) wasn't covered by the original Stage A audit (that
 * pass predates onboarding being built out). `18` added during the
 * Products feature port — ProductThumb.tsx's `lg` size (`text-[18px]`)
 * for the same reason (Products predates the original audit too). `32`
 * and `28` added during the Purchases feature port — PurchasesHome.tsx/
 * PurchaseDetail.tsx's hero totals (`text-[32px]`) and NewPurchase.tsx's
 * success-sheet amount (`text-[28px]`), same reason. `10` added during
 * the Reports feature port — SalesReport.tsx's bar-chart day labels
 * (`text-[10px]`). All purely additive: no existing entry changed, every
 * prior caller of `fontSize` is unaffected.
 */
export const fontSize = {
  10: 10,
  10.5: 10.5,
  11: 11,
  11.5: 11.5,
  12: 12,
  12.5: 12.5,
  13: 13,
  13.5: 13.5,
  14: 14,
  14.5: 14.5,
  15: 15,
  16: 16,
  17: 17,
  18: 18,
  19: 19,
  20: 20,
  22: 22,
  24: 24,
  26: 26,
  28: 28,
  30: 30,
  32: 32,
  34: 34,
  36: 36,
  38: 38,
} as const;

export type FontSizeToken = keyof typeof fontSize;

/**
 * tabular-nums equivalent — the web applies `.tabular` (font-variant-numeric:
 * tabular-nums) to every money/quantity value. RN's Text supports the same
 * CSS property directly.
 */
export const tabularNums: TextStyle = {
  fontVariant: ['tabular-nums'],
};
