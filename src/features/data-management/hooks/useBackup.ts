/**
 * Ported from the web reference's src/pages/data/BackupRestore.tsx.
 *
 * One deliberate correction to the web's own state machine: its
 * `restoreStep` union is `'select' | 'preview' | 'working' | 'done'` and
 * it initializes `useState(...)` to `'select'` — but `'select'`'s Sheet is
 * gated only by `restoreStep === 'select'` with no other condition, so
 * read literally that would open the "Restore backup" sheet the instant
 * the screen mounts, before the user ever taps "Restore Backup". Every
 * close handler in that screen (the 'select' sheet's onClose, the
 * 'preview' sheet's onClose, and the end of a completed restore) resets
 * to `'done'`, and there is no Sheet gated on `restoreStep === 'done'` —
 * so 'done' is clearly the screen's intended "closed/idle" resting value,
 * and initializing to 'select' instead reads as a copy-paste slip, not a
 * deliberate design choice. This port initializes to 'done' instead,
 * which is the one-line fix that makes the sheet start closed while
 * leaving every transition identical to the web's.
 */
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { createBackup, getBackups, getDeviceDataCounts, resetDemoData, restoreBackup } from '../data/dataManagementProvider';
import type { BackupPhase, BackupRecord, DeviceDataCounts, RestoreStep } from '../types';

export type BackupStatus = 'loading' | 'error' | 'ready';

export function useBackup() {
  const toast = useToast();
  const [status, setStatus] = useState<BackupStatus>('loading');
  const [counts, setCounts] = useState<DeviceDataCounts | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const [phase, setPhase] = useState<BackupPhase>('idle');
  const [created, setCreated] = useState<BackupRecord | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [restoreStep, setRestoreStep] = useState<RestoreStep>('done');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDeviceDataCounts(), getBackups()])
      .then(([c, b]) => {
        if (cancelled) return;
        setCounts(c);
        setBackups(b);
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

  const startCreateBackup = useCallback(() => {
    setPhase('working');
    createBackup().then((record) => {
      setCreated(record);
      setBackups((b) => [record, ...b]);
      setPhase('done');
      toast('Backup created successfully.');
    });
  }, [toast]);

  const closeCreateSheet = useCallback(() => setPhase('idle'), []);

  const openRestoreSelect = useCallback(() => {
    setRestoreTarget(null);
    setRestoreStep('select');
  }, []);

  const openRestorePreview = useCallback((backup: BackupRecord) => {
    setRestoreTarget(backup);
    setRestoreStep('preview');
  }, []);

  const closeRestoreFlow = useCallback(() => setRestoreStep('done'), []);

  const runRestore = useCallback(() => {
    if (!restoreTarget) return;
    setRestoreStep('working');
    restoreBackup(restoreTarget.id).then(() => {
      setRestoreStep('done');
      toast('Backup restored to this device.');
    });
  }, [restoreTarget, toast]);

  const runResetDemoData = useCallback(() => {
    resetDemoData().then(() => toast('Demo data restored.', 'info'));
  }, [toast]);

  const totalRecords = counts
    ? counts.products + counts.sales + counts.purchases + counts.movements + counts.customers + counts.suppliers
    : 0;

  return {
    status,
    counts,
    totalRecords,
    backups,
    lastBackup: backups[0],
    refetch,
    phase,
    created,
    startCreateBackup,
    closeCreateSheet,
    restoreTarget,
    restoreStep,
    openRestoreSelect,
    openRestorePreview,
    closeRestoreFlow,
    runRestore,
    runResetDemoData,
  };
}
