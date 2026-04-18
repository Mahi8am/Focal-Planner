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
      let parsed: AppStorage = raw ? JSON.parse(raw) : defaultStorage();

      // Auto-resolve past planned tasks on load:
      // - Days on or after install date: unnamed slots → skipped, named+planned → completed
      // - Days before install date: unnamed slots stay empty, named+planned → completed
      const today   = todayKey();
      let changed   = false;
      for (const dateKey of Object.keys(parsed.days)) {
        if (dateKey >= today) continue; // today/future — skip
        const beforeInstall = dateKey < storedInstall;
        const dayTasks = { ...parsed.days[dateKey].tasks };
        for (const slot of SLOTS) {
          const t = dayTasks[slot.id];
          if (!t) {
            // Empty slot in past
            if (!beforeInstall) {
              // On or after install date → becomes skipped
              dayTasks[slot.id] = {
                id: generateId(),
                title: '',
                status: 'failed',
                slotId: slot.id, dateKey,
                createdAt: new Date().toISOString(),
              };
              changed = true;
            }
            // Before install date → leave empty (no change)
          } else if (t.status === 'planned') {
            // Named but not ticked → auto-complete
            dayTasks[slot.id] = {
              ...t,
              status: 'completed',
              completedAt: new Date().toISOString(),
            };
            changed = true;
          }
        }
        if (changed) {
          parsed = {
            ...parsed,
            days: { ...parsed.days, [dateKey]: { dateKey, tasks: dayTasks } },
          };
        }
      }

      if (changed) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      setData(parsed);
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
    const past = isPast(dateKey);

    let newStatus: Task['status'];
    if (existing?.status === 'failed') {
      // Naming a skipped task → recover to completed
      newStatus = 'completed';
    } else if (past) {
      // Past task edit → completed
      newStatus = 'completed';
    } else {
      newStatus = existing?.status ?? 'planned';
    }

    const task: Task = existing
      ? {
          ...existing,
          title: trimmed,
          status: newStatus,
          completedAt: newStatus === 'completed' ? (existing.completedAt ?? new Date().toISOString()) : existing.completedAt,
        }
      : {
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
      ? { ...existing, title: '', status: 'failed', completedAt: undefined }
      : {
          id: generateId(),
          title: '',
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

  const deleteTask = useCallback(async (dateKey: string, slotId: SlotId) => {
    const day = data.days[dateKey];
    if (!day) return;
    const newTasks = { ...day.tasks };
    delete newTasks[slotId];
    await save({ ...data, days: { ...data.days, [dateKey]: { dateKey, tasks: newTasks } } });
  }, [data, save]);

  return {
    data, loaded, installDate,
    getDay, addTask, editTask, completeTask, failTask,
    deleteTask,
  };
}
