/**
 * The Tax settings preview ("Item price ₹1,000 → tax → customer pays")
 * is the one place this feature does money math — kept here rather than
 * inline in the screen, in integer minor units like every other feature.
 */
export interface TaxPreview {
  taxMinor: number;
  customerPaysMinor: number;
}

export function calculateTaxPreview(sampleMinor: number, ratePercent: number, enabled: boolean, inclusive: boolean): TaxPreview {
  const taxMinor = Math.round((sampleMinor * ratePercent) / 100);
  const customerPaysMinor = enabled && !inclusive ? sampleMinor + taxMinor : sampleMinor;
  return { taxMinor, customerPaysMinor };
}
