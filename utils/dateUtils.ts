export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// export function todayKey(): string { return toDateKey(new Date()); }


// const DEV_FAKE_TODAY: string | null = null;
const DEV_FAKE_TODAY = '2026-04-25';
// Example: '2026-04-25'
// Set to null to disable

export function todayKey(): string {
  if (DEV_FAKE_TODAY) return DEV_FAKE_TODAY;
  return toDateKey(new Date());
}




export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isPast(dateKey: string): boolean { return dateKey < todayKey(); }
export function isToday(dateKey: string): boolean { return dateKey === todayKey(); }
export function isFuture(dateKey: string): boolean { return dateKey > todayKey(); }

export function formatDisplayDate(dateKey: string): string {
  return fromDateKey(dateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatShortDate(dateKey: string): string {
  return fromDateKey(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getFirstDayKey(year: number, month: number): string {
  return toDateKey(new Date(year, month, 1));
}
