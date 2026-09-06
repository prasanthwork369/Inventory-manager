/**
 * Ported from the web reference's src/pages/Scanner.tsx.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Product } from '@/features/products/types';
import { findProductByCode, simulateScan } from '../data/scannerProvider';
import type { ScanStatus } from '../types';

export function useScanner() {
  const [status, setStatus] = useState<ScanStatus>('scanning');
  const [code, setCode] = useState('');
  const [match, setMatch] = useState<Product | undefined>(undefined);
  const [manual, setManual] = useState('');

  useEffect(() => {
    if (status !== 'scanning') return;
    let cancelled = false;
    simulateScan().then((product) => {
      if (cancelled) return;
      if (product) {
        setCode(product.barcode ?? '');
        setMatch(product);
        setStatus('found');
      } else {
        setStatus('notfound');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const scanAgain = useCallback(() => {
    setCode('');
    setMatch(undefined);
    setManual('');
    setStatus('scanning');
  }, []);

  const submitManual = useCallback(() => {
    if (!manual) return;
    findProductByCode(manual).then((product) => {
      setCode(manual);
      setMatch(product);
      setStatus(product ? 'found' : 'notfound');
    });
  }, [manual]);

  return { status, code, match, manual, setManual, scanAgain, submitManual };
}
