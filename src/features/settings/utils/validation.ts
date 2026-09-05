/**
 * Kept outside JSX per the phase brief. Mirrors the web's own inline
 * checks exactly (business name required; PIN must be 4 digits when
 * lock mode is 'pin').
 */
export function validateBusinessName(name: string): string | null {
  return name.trim() ? null : 'Business name cannot be empty.';
}

export function validatePin(mode: string, pin: string): string | null {
  if (mode !== 'pin') return null;
  return pin.length < 4 ? 'Enter a 4-digit PIN.' : null;
}
