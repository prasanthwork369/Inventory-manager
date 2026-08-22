/**
 * Colors copied verbatim from the web reference's tailwind.config.js
 * (E:\Mobile\Inventory-manager\inventory and stock manager\tailwind.config.js).
 *
 * RESOLVED: ink-300/600/800/900 are NOT defined in the source tailwind
 * config's `colors.ink` object (only DEFAULT/50/100/200/400/500/700 are),
 * yet `text-ink-300`/`text-ink-600` appear in ~15 web screens. Stage A
 * guessed interpolated hex values for these — that was wrong per this
 * project's "do not invent visual values" rule, so they were removed.
 *
 * Verified empirically, not assumed: compiled the actual web project
 * through its own tailwind.config.js + index.css using
 * `npx tailwindcss@3.4.17` (the exact version pinned in the web project's
 * package.json) and inspected the generated CSS. Result: `ink-300`,
 * `ink-600`, `ink-800`, `ink-900` produce ZERO output — Tailwind's JIT
 * silently drops any utility whose color-shade pair isn't a real theme
 * entry. No CSS rule is emitted, so no `color` is ever set by that class.
 *
 * What that means for actual rendered appearance: the element keeps
 * whatever `color` it inherits from its nearest ancestor. Tracing every
 * occurrence's DOM ancestry in the web source:
 *   - All `text-ink-300` sites (ProductRow/More/Dashboard/Settings/
 *     ReportsHome chevrons, ReceiptPage caption) sit inside elements with
 *     no explicit color of their own, so they inherit all the way up to
 *     `body { color: var(--ink) }` in index.css -> renders as ink.DEFAULT
 *     (#0f1421, near-black), NOT a muted/light gray as the class name
 *     suggests.
 *   - Same for 6 of the 7 `text-ink-600` sites (BackupRestore,
 *     ProductDetail, ProductForm, PartyDetail, ImportProducts,
 *     PurchaseDetail body copy) -> also resolves to inherited ink.DEFAULT.
 *   - The one exception: Alerts.tsx's alert-card body text
 *     (`text-ink-600`) sits inside a `<Card className={toneStyles[a.tone]}>`
 *     where toneStyles DOES set an explicit color (`text-bad-600` /
 *     `text-warn-600` / `text-brand-600`) — so that specific instance
 *     inherits the surrounding tone color, not black. Noted here for
 *     whichever later stage ports Alerts.tsx: that body text should use
 *     the card's tone color, not a synthetic "ink-600".
 *
 * Conclusion: there is no real "ink-300/600/800/900" design token to
 * copy — those shades were never resolvable in the live app. The correct
 * port is to use `ink.DEFAULT` wherever the web used one of these classes
 * (matching the actual inherited-black rendering), or the surrounding
 * tone color in the one documented exception above. No entries for
 * these shades are defined below.
 */
export const colors = {
  brand: {
    50: '#eef3ff',
    100: '#dbe4ff',
    200: '#bccdff',
    300: '#8fa9ff',
    400: '#5b7cfa',
    500: '#2f55ea',
    600: '#1e3fd0',
    700: '#1832a6',
    800: '#16297e',
    900: '#131f57',
  },
  ink: {
    50: '#f6f7f9',
    100: '#eceef2',
    200: '#d9dde5',
    400: '#828a9c',
    500: '#5b6376',
    700: '#2b3242',
    DEFAULT: '#0f1421',
  },
  good: {
    50: '#e9f8ef',
    100: '#cdeeda',
    500: '#12a150',
    600: '#0e8442',
    700: '#0a6633',
  },
  warn: {
    50: '#fff5e5',
    100: '#ffe7bf',
    500: '#e08700',
    600: '#b76c00',
    700: '#8a5200',
  },
  bad: {
    50: '#fdecec',
    100: '#f9d2d2',
    500: '#d92d2d',
    600: '#b52121',
    700: '#8c1919',
  },
  white: '#ffffff',
  black: '#000000',
} as const;

/**
 * The web reference frequently uses Tailwind's slash-opacity syntax on
 * borders/backgrounds (e.g. `border-ink-200/70`, `bg-white/95`). RN has no
 * equivalent shorthand, so callers convert a hex color + 0-100 percent here
 * instead. `opacityPercent` matches the Tailwind suffix directly (70 -> /70).
 */
export function withOpacity(hex: string, opacityPercent: number): string {
  const alpha = Math.round((opacityPercent / 100) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alpha}`;
}
