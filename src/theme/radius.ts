/**
 * Radius scale from tailwind.config.js. `xl`/`2xl`/`3xl` are overridden
 * there (not Tailwind's defaults); `sm`/`md`/`lg`/`full` are Tailwind's
 * standard values, used as-is by the reference.
 */
export const radius = {
  sm: 2,
  md: 6,
  lg: 8,
  xl: 14, // custom override, tailwind.config.js: '0.875rem'
  '2xl': 18, // custom override: '1.125rem'
  '3xl': 24, // custom override: '1.5rem'
  full: 9999,
} as const;
