export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  streak: number;
  lastCompleted?: Date;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: Date;
  userId: string;
  notes?: string;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
} 