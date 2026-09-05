/**
 * Ported from the web reference's src/pages/More.tsx: business name (for
 * the header subtitle) and the Alerts badge count. Reuses Stock's own
 * lowStock()/outOfStock() rules via Products — no second low-stock
 * definition — and Settings' canonical provider for the business name.
 */
import { useCallback, useEffect, useState } from 'react';
import { getProducts } from '@/features/products/data/productsProvider';
import { getSettings } from '@/features/settings/data/settingsProvider';
import { lowStock, outOfStock } from '@/features/stock/utils/metrics';

export type MoreMenuStatus = 'loading' | 'error' | 'ready';

export function useMoreMenu() {
  const [status, setStatus] = useState<MoreMenuStatus>('loading');
  const [businessName, setBusinessName] = useState('');
  const [alertCount, setAlertCount] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSettings(), getProducts()])
      .then(([settings, products]) => {
        if (cancelled) return;
        setBusinessName(settings.business.name);
        setAlertCount(lowStock(products).length + outOfStock(products).length);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => {
    setStatus('loading');
    setReloadToken((t) => t + 1);
  }, []);

  return { status, businessName, alertCount, refetch };
}
