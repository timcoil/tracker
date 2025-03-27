export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: Frequency;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  streak: number;
  completedDates: string[];
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
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
  bestTimeOfDay?: string;
  averageCompletionTime?: string;
  consistencyScore: number;
  lastWeekCompletions: number;
  lastMonthCompletions: number;
}

export interface HabitAnalytics {
  id: string;
  habitId: string;
  userId: string;
  lastUpdated: Date;
  weeklyStats: {
    [weekKey: string]: {
      completions: number;
      rate: number;
      streak: number;
    };
  };
  monthlyStats: {
    [monthKey: string]: {
      completions: number;
      rate: number;
      streak: number;
    };
  };
  timeOfDayStats: {
    [hour: string]: number;
  };
  consistencyScore: number;
}

export interface Achievement {
  id: string;
  userId: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress: number;
  target: number;
  habitId?: string;
}

export type AchievementType = 
  | 'STREAK_MILESTONE'
  | 'COMPLETION_MILESTONE'
  | 'CONSISTENCY_MILESTONE'
  | 'SPECIAL_CHALLENGE';

export interface Insight {
  id: string;
  userId: string;
  type: InsightType;
  title: string;
  description: string;
  generatedAt: Date;
  relevance: number;
  habitId?: string;
  actionItems?: string[];
  data?: any;
}

export type InsightType = 
  | 'PATTERN_RECOGNITION'
  | 'IMPROVEMENT_SUGGESTION'
  | 'MOTIVATION'
  | 'SUCCESS_PREDICTION'
  | 'WEEKLY_SUMMARY'; 