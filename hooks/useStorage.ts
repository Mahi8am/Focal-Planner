import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStorage, DayData, Task, SlotId } from '../types';
import { STORAGE_KEY, SLOTS, INSTALL_DATE_KEY } from '../constants';
import { todayKey, generateId, isPast } from '../utils/dateUtils';

const defaultStorage = (): AppStorage => ({ days: {} });

export function useStorage(resetKey: number = 0) {
  const [data, setData]         = useState<AppStorage>(defaultStorage());
  const [loaded, setLoaded]     = useState(false);
  const [installDate, setInstallDate] = useState<string>('');

  useEffect(() => {
    setLoaded(false);
    setData(defaultStorage());
    load();
  }, [resetKey]);

  const load = async () => {
    try {
      let storedInstall = await AsyncStorage.getItem(INSTALL_DATE_KEY);
      if (!storedInstall) {
        storedInstall = todayKey();
        await AsyncStorage.setItem(INSTALL_DATE_KEY, storedInstall);
      }
      setInstallDate(storedInstall);

      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: AppStorage = JSON.parse(raw);
        // Do NOT auto-complete past planned tasks — let user fill or fail them
        setData(parsed);
      }
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoaded(true);
    }
  };

  const save = useCallback(async (newData: AppStorage) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setData(newData);
    } catch (e) {
      console.error('Save error:', e);
    }
  }, []);

  const getDay = useCallback((dateKey: string): DayData =>
    data.days[dateKey] ?? { dateKey, tasks: {} }, [data]);

  const addTask = useCallback(async (dateKey: string, slotId: SlotId, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const past = isPast(dateKey);
    const task: Task = {
      id: generateId(), title: trimmed,
      status: past ? 'completed' : 'planned',
      slotId, dateKey,
      createdAt: new Date().toISOString(),
      completedAt: past ? new Date().toISOString() : undefined,
    };
    const newData: AppStorage = {
      ...data,
      days: { ...data.days, [dateKey]: { dateKey, tasks: { ...(data.days[dateKey]?.tasks ?? {}), [slotId]: task } } },
    };
    await save(newData);
  }, [data, save]);

  const editTask = useCallback(async (dateKey: string, slotId: SlotId, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const existing = data.days[dateKey]?.tasks[slotId];
    // If editing a failed task, promote to completed. Otherwise keep current status.
    const newStatus = (existing?.status === 'failed') ? 'completed' : (existing?.status ?? 'completed');
    const task: Task = existing
      ? {
          ...existing,
          title: trimmed,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : existing.completedAt,
        }
      : {
          id: generateId(), title: trimmed,
          status: 'completed', slotId, dateKey,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
    const newData: AppStorage = {
      ...data,
      days: { ...data.days, [dateKey]: { dateKey, tasks: { ...(data.days[dateKey]?.tasks ?? {}), [slotId]: task } } },
    };
    await save(newData);
  }, [data, save]);

  const completeTask = useCallback(async (dateKey: string, slotId: SlotId) => {
    const existing = data.days[dateKey]?.tasks[slotId];
    if (!existing) return;
    const updated: Task = {
      ...existing,
      status: existing.status === 'completed' ? 'planned' : 'completed',
      completedAt: existing.status === 'completed' ? undefined : new Date().toISOString(),
    };
    const newData: AppStorage = {
      ...data,
      days: { ...data.days, [dateKey]: { dateKey, tasks: { ...(data.days[dateKey]?.tasks ?? {}), [slotId]: updated } } },
    };
    await save(newData);
  }, [data, save]);

  const failTask = useCallback(async (dateKey: string, slotId: SlotId) => {
    const existing = data.days[dateKey]?.tasks[slotId];
    const task: Task = existing
      ? { ...existing, status: 'failed', completedAt: undefined }
      : {
          id: generateId(),
          title: 'Task Failed',
          status: 'failed',
          slotId, dateKey,
          createdAt: new Date().toISOString(),
        };
    const newData: AppStorage = {
      ...data,
      days: { ...data.days, [dateKey]: { dateKey, tasks: { ...(data.days[dateKey]?.tasks ?? {}), [slotId]: task } } },
    };
    await save(newData);
  }, [data, save]);

  // Batch-fail all unresolved slots on a given day in a single save — prevents
  // the async race condition that caused only the last slot to be written.
  const failAllUnresolvedSlots = useCallback(async (dateKey: string) => {
    const existingDay = data.days[dateKey] ?? { dateKey, tasks: {} };
    const newTasks = { ...existingDay.tasks };
    for (const slot of SLOTS) {
      const t = newTasks[slot.id];
      if (!t || t.status === 'planned') {
        newTasks[slot.id] = t
          ? { ...t, status: 'failed', completedAt: undefined }
          : {
              id: generateId(),
              title: 'Task Failed',
              status: 'failed',
              slotId: slot.id, dateKey,
              createdAt: new Date().toISOString(),
            };
      }
    }
    const newData: AppStorage = {
      ...data,
      days: { ...data.days, [dateKey]: { dateKey, tasks: newTasks } },
    };
    await save(newData);
  }, [data, save]);

  const deleteTask = useCallback(async (dateKey: string, slotId: SlotId) => {
    const day = data.days[dateKey];
    if (!day) return;
    const newTasks = { ...day.tasks };
    delete newTasks[slotId];
    await save({ ...data, days: { ...data.days, [dateKey]: { dateKey, tasks: newTasks } } });
  }, [data, save]);

  // A day is "blocking" only if:
  //   - it is a past day (before today)
  //   - it is AFTER the install date (on or after install date — install day itself is not blocked
  //     because the user just installed; days strictly before install are never blocked)
  //   - it has at least one slot that is empty OR still 'planned'
  const getBlockingDays = useCallback((): string[] => {
    const today   = todayKey();
    // installDate may be empty string during the brief window before load() sets it.
    // Fall back to today so nothing blocks before we know the install date.
    const install = installDate || today;
    const blocking: string[] = [];
    for (const dateKey of Object.keys(data.days)) {
      if (dateKey >= today)    continue; // today or future — not blocking
      if (dateKey < install)   continue; // before install date — ignore
      const day = data.days[dateKey];
      const hasUnresolved = SLOTS.some(s => {
        const t = day.tasks[s.id];
        return !t || t.status === 'planned';
      });
      if (hasUnresolved) blocking.push(dateKey);
    }
    return blocking.sort();
  }, [data, installDate]);

  const canPlanFuture = useCallback((): boolean => getBlockingDays().length === 0, [getBlockingDays]);

  return {
    data, loaded, installDate,
    getDay, addTask, editTask, completeTask, failTask, failAllUnresolvedSlots,
    deleteTask, getBlockingDays, canPlanFuture,
  };
}
