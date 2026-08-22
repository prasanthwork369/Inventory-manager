/**
 * Central typography primitive. Every piece of text in the app should
 * render through this component (or a component that itself renders
 * through it) rather than a bare RN `Text` with inline `fontSize`.
 *
 * This exists for two reasons:
 *  1. Enforcement — `size` only accepts the pixel values in
 *     theme/typography.ts's `fontSize` scale (every value the web
 *     reference actually uses), so a screen literally cannot pass an
 *     arbitrary fontSize; TypeScript rejects anything not in that set.
 *  2. Correctness — the app loads distinct Inter weight files
 *     (Inter_400Regular ... Inter_800ExtraBold) via @expo-google-fonts/inter.
 *     RN's `fontWeight` alone does NOT select between separately-loaded
 *     font files; it just requests synthetic bolding of whatever font is
 *     already active. The actual weight must come from `fontFamily`. Every
 *     UI primitive in this project was fixed to go through here (or set
 *     `fontFamily` directly from theme/typography.ts) specifically so the
 *     loaded Inter files are the ones that actually render.
 *
 * Locked, not just defaulted: `allowFontScaling` is force-set to `false`
 * and omitted from the accepted prop type, so no call site can opt back
 * into OS-level accessibility text scaling — this app is a fixed-px port
 * of the web reference's Tailwind design, and letting the OS font-size
 * setting rescale it would silently break every hand-verified spacing/
 * layout value against that source of truth. There is deliberately no
 * in-app font-size setting either. `size`/`weight`/`fontFamily` are the
 * only ways text renders in this app, and both are constrained to the
 * theme's token sets — `size` can't accept a value outside `fontSize`,
 * and `weight` can't accept a family outside `fontFamily`.
 */
import React from 'react';
import { Text, type TextProps } from 'react-native';
import { colors, fontFamily, fontSize, tabularNums, type FontWeightToken } from '../../theme';

type SizeToken = keyof typeof fontSize;

interface AppTextProps extends Omit<TextProps, 'allowFontScaling'> {
  size?: SizeToken;
  weight?: FontWeightToken;
  color?: string;
  tabular?: boolean;
}

export function AppText({ size = 15, weight = 'regular', color = colors.ink.DEFAULT, tabular, style, ...rest }: AppTextProps) {
  return (
    <Text
      {...rest}
      allowFontScaling={false}
      style={[{ fontSize: fontSize[size], fontFamily: fontFamily[weight], color }, tabular ? tabularNums : null, style]}
    />
  );
}
