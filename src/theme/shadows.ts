import { Platform } from 'react-native';
import { colors } from './colors';

/**
 * React Native's shadow model (single offset/blur/opacity + Android
 * `elevation`) cannot reproduce CSS's multi-layer box-shadow exactly.
 * These are the closest single-layer approximation of each preset from
 * tailwind.config.js `boxShadow`, using the dominant (most visible) layer's
 * offset/blur and the shared shadow color (rgba(15,20,33,*) -> ink.DEFAULT).
 *
 * Source values:
 *   card:  '0 1px 2px rgba(15,20,33,0.04), 0 1px 3px rgba(15,20,33,0.06)'
 *   lift:  '0 8px 24px -8px rgba(15,20,33,0.16)'
 *   sheet: '0 -12px 40px -12px rgba(15,20,33,0.24)'
 */
export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: colors.ink.DEFAULT,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 3,
    },
    default: { elevation: 2 },
  }),
  lift: Platform.select({
    ios: {
      shadowColor: colors.ink.DEFAULT,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
    },
    default: { elevation: 8 },
  }),
  sheet: Platform.select({
    ios: {
      shadowColor: colors.ink.DEFAULT,
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.22,
      shadowRadius: 20,
    },
    default: { elevation: 16 },
  }),
} as const;
