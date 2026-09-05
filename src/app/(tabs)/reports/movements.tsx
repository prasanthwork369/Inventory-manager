import React from 'react';
import { MovementsScreen } from '@/features/stock/screens/MovementsScreen';

// Reuses Stock's own Movements screen (reportMode only changes the
// title) — matches the web's <Movements reportMode /> at this same
// route, per Stock's canonical movement domain/provider.
export default function StockMovementReport() {
  return <MovementsScreen reportMode />;
}
