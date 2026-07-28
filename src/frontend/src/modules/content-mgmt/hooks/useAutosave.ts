import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  idleDelayMs?: number; // 3000ms idle debounce
  periodicIntervalMs?: number; // 60000ms periodic timer
  enabled?: boolean;
}

export function useAutosave<T>({
  data,
  onSave,
  idleDelayMs = 3000,
  periodicIntervalMs = 60000,
  enabled = true
}: UseAutosaveOptions<T>) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const initialRender = useRef(true);
  const dataRef = useRef(data);
  dataRef.current = data;

  const triggerSave = useCallback(async () => {
    if (!hasUnsavedChanges || isSaving) return;
    try {
      setIsSaving(true);
      await onSave(dataRef.current);
      setHasUnsavedChanges(false);
      setLastSavedTime(new Date());
    } catch (e) {
      console.warn('Autosave failed:', e);
    } finally {
      setIsSaving(false);
    }
  }, [hasUnsavedChanges, isSaving, onSave]);

  // Track changes
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    setHasUnsavedChanges(true);
  }, [data]);

  // Debounced idle autosave
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      triggerSave();
    }, idleDelayMs);

    return () => clearTimeout(timer);
  }, [data, enabled, hasUnsavedChanges, idleDelayMs, triggerSave]);

  // Periodic autosave interval
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        triggerSave();
      }
    }, periodicIntervalMs);

    return () => clearInterval(interval);
  }, [enabled, hasUnsavedChanges, periodicIntervalMs, triggerSave]);

  // Browser exit prompt for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const markSaved = () => {
    setHasUnsavedChanges(false);
    setLastSavedTime(new Date());
  };

  return {
    hasUnsavedChanges,
    lastSavedTime,
    isSaving,
    markSaved,
    triggerSave
  };
}
