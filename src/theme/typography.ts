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
 */
export const fontSize = {
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
  19: 19,
  20: 20,
  22: 22,
  24: 24,
  26: 26,
  30: 30,
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
