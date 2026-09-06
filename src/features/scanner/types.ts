/**
 * Adapted from the web reference's src/pages/Scanner.tsx local `state`
 * union — 'scanning' | 'found' | 'notfound'. No richer scan/camera/lookup
 * types are introduced: the web has no real barcode reader, permission
 * flow, or persistence to model, so this feature reuses Products' own
 * `Product` type for a match rather than a duplicate domain model.
 */
export type ScanStatus = 'scanning' | 'found' | 'notfound';
