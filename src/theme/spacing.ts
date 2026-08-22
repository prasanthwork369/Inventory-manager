/**
 * Tailwind's default spacing scale (1 unit = 0.25rem = 4px), plus the three
 * custom units the web reference adds in tailwind.config.js
 * (4.5: '1.125rem', 5.5: '1.375rem', 18: '4.5rem'). Only keys actually used
 * across the web screens are included.
 */
export const spacing = {
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  4.5: 18, // custom, tailwind.config.js
  5: 20,
  5.5: 22, // custom, tailwind.config.js
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  18: 72, // custom, tailwind.config.js
  20: 80,
  24: 96,
} as const;
