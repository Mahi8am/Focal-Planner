export type SlotId = 'morning' | 'afternoon' | 'evening';

export type TaskStatus = 'empty' | 'planned' | 'completed' | 'failed';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  slotId: SlotId;
  dateKey: string; // 'YYYY-MM-DD'
  createdAt: string;
  completedAt?: string;
}

export interface DayData {
  dateKey: string;
  tasks: {
    morning?: Task;
    afternoon?: Task;
    evening?: Task;
  };
}

export interface AppStorage {
  days: Record<string, DayData>;
}
