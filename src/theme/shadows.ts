import { Platform } from 'react-native';
import { colors } from './colors';

/**
 * React Native's shadow model (single offset/blur/opacity + Android
 * `elevation`) cannot reproduce CSS's multi-layer box-shadow exactly, and
 * a literal per-pixel translation of the web's shadow values reads as
 * noticeably heavier on a phone screen than the same numbers do in a
 * browser. Per the shadow/elevation rule, these are deliberately toned
 * down from a literal translation — subtle borders/surface-contrast do
 * most of the hierarchy work; shadows are a light accent, not the
 * primary depth cue. Only two tiers (`fab`, `sheet`) are allowed to read
 * as "elevated" at all, matching where the web source actually uses its
 * strongest shadow (`shadow-lift`, `shadow-sheet`) on genuinely floating
 * elements — everything else, including the web's own reuse of
 * `shadow-lift` on the dashboard hero card, is intentionally softened
 * into `raised` rather than carried over at full strength.
 *
 * Source values (tailwind.config.js boxShadow):
 *   card:  '0 1px 2px rgba(15,20,33,0.04), 0 1px 3px rgba(15,20,33,0.06)'
 *   lift:  '0 8px 24px -8px rgba(15,20,33,0.16)'
 *   sheet: '0 -12px 40px -12px rgba(15,20,33,0.24)'
 */
export const shadows = {
  /** Resting surfaces: Card, KPI/quick-action tiles, buttons, form controls. */
  card: Platform.select({
    ios: {
      shadowColor: colors.ink.DEFAULT,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    default: { elevation: 1 },
  }),
  /** Mild emphasis only: Toast, the dashboard hero card. Not for FAB/modal. */
  raised: Platform.select({
    ios: {
      shadowColor: colors.ink.DEFAULT,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.09,
      shadowRadius: 6,
    },
    default: { elevation: 3 },
  }),
  /** FAB only — the one element allowed to genuinely float above content. */
  fab: Platform.select({
    ios: {
      shadowColor: colors.ink.DEFAULT,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 8,
    },
    default: { elevation: 6 },
  }),
  /** AppSheet/modal panel — shadow cast upward, separating it from the backdrop. */
  sheet: Platform.select({
    ios: {
      shadowColor: colors.ink.DEFAULT,
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
    },
    default: { elevation: 8 },
  }),
} as const;
