/**
 * Ported from the web reference's src/pages/data/ImportProducts.tsx. The
 * web validates a fixed `sampleRows` array regardless of what file the
 * user "picks" (there is no real file input in that screen) — this hook
 * reproduces the same behavior via getSampleImportRows().
 */
import { useCallback, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { getSampleImportRows, importProducts } from '../data/dataManagementProvider';
import type { ImportRow, ImportStep } from '../types';

export function useImportProducts() {
  const toast = useToast();
  const [step, setStep] = useState<ImportStep>('upload');
  const [rows, setRows] = useState<ImportRow[]>([]);

  const valid = useMemo(() => rows.filter((r) => !r.error), [rows]);
  const invalid = useMemo(() => rows.filter((r) => r.error), [rows]);

  const startValidation = useCallback(() => {
    setStep('validating');
    getSampleImportRows().then((sampleRows) => {
      setRows(sampleRows);
      setStep('preview');
    });
  }, []);

  const backToUpload = useCallback(() => setStep('upload'), []);

  const runImport = useCallback(() => {
    setStep('importing');
    importProducts(valid).then((count) => {
      setStep('done');
      toast(`${count} products imported.`);
    });
  }, [valid, toast]);

  return { step, rows, valid, invalid, startValidation, backToUpload, runImport };
}
