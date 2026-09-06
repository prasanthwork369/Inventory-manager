/**
 * Ported from the web reference's src/pages/data/ExportData.tsx.
 */
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { generateExport, getExportDatasets } from '../data/dataManagementProvider';
import type { ExportDataset, ExportFormat, ExportPhase } from '../types';

export type ExportStatus = 'loading' | 'error' | 'ready';

// web: default-selected keys on first load.
const DEFAULT_SELECTED = ['products', 'sales'];

export function useExportData() {
  const toast = useToast();
  const [status, setStatus] = useState<ExportStatus>('loading');
  const [datasets, setDatasets] = useState<ExportDataset[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [phase, setPhase] = useState<ExportPhase>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getExportDatasets()
      .then((d) => {
        if (cancelled) return;
        setDatasets(d);
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

  const toggle = useCallback((key: string) => {
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
  }, []);

  const totalRows = datasets.filter((d) => selected.includes(d.key)).reduce((sum, d) => sum + d.count, 0);

  const generate = useCallback(() => {
    if (selected.length === 0) {
      setError('Choose at least one set of data to export.');
      return;
    }
    setError('');
    setPhase('working');
    generateExport(format).then(() => {
      setPhase('done');
      toast(`Export ready as ${format.toUpperCase()}.`);
    });
  }, [selected, format, toast]);

  const closeDoneSheet = useCallback(() => setPhase('idle'), []);

  return {
    status,
    datasets,
    refetch,
    selected,
    toggle,
    format,
    setFormat,
    phase,
    error,
    totalRows,
    generate,
    closeDoneSheet,
  };
}
