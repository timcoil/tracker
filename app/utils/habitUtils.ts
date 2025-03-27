import { Habit, HabitCompletion } from '../types/habit';

export const calculateStreak = (habit: Habit, completions: HabitCompletion[]): number => {
  if (!completions.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedCompletions = completions
    .map(c => new Date(c.completedAt))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  let currentDate = today;

  for (const completionDate of sortedCompletions) {
    completionDate.setHours(0, 0, 0, 0);
    
    // Check if the completion date matches the current date
    if (completionDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // If there's a gap, break the streak
      break;
    }
  }

  return streak;
};

export const isHabitCompletedToday = (habit: Habit, completions: HabitCompletion[]): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return completions.some(completion => {
    const completionDate = new Date(completion.completedAt);
    completionDate.setHours(0, 0, 0, 0);
    
    // Log the dates for debugging
    console.log('Comparing dates:', {
      today: today.toISOString(),
      completionDate: completionDate.toISOString(),
      isMatch: completionDate.getTime() === today.getTime()
    });
    
    return completionDate.getTime() === today.getTime();
  });
};

export const getCompletionDates = (completions: HabitCompletion[]): Date[] => {
  return completions.map(completion => {
    const date = new Date(completion.completedAt);
    date.setHours(0, 0, 0, 0);
    return date;
  });
}; 