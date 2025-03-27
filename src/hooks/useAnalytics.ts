import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { HabitAnalytics, Achievement, Insight, Habit } from '../../app/types/habit';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

const convertDocumentDataToHabitAnalytics = (docData: DocumentData, id: string): HabitAnalytics => {
  return {
    id,
    habitId: docData.habitId,
    userId: docData.userId,
    lastUpdated: docData.lastUpdated?.toDate() || new Date(),
    weeklyStats: docData.weeklyStats || {},
    monthlyStats: docData.monthlyStats || {},
    timeOfDayStats: docData.timeOfDayStats || {},
    consistencyScore: docData.consistencyScore || 0,
  };
};

const convertDocumentDataToAchievement = (docData: DocumentData, id: string): Achievement => {
  return {
    id,
    userId: docData.userId,
    type: docData.type,
    name: docData.name,
    description: docData.description,
    icon: docData.icon,
    unlockedAt: docData.unlockedAt?.toDate() || new Date(),
    progress: docData.progress,
    target: docData.target,
    habitId: docData.habitId,
  };
};

const convertDocumentDataToInsight = (docData: DocumentData, id: string): Insight => {
  return {
    id,
    userId: docData.userId,
    type: docData.type,
    title: docData.title,
    description: docData.description,
    generatedAt: docData.generatedAt?.toDate() || new Date(),
    relevance: docData.relevance,
    habitId: docData.habitId,
    actionItems: docData.actionItems,
    data: docData.data,
  };
};

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<HabitAnalytics[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Set up listeners for analytics
    const analyticsQuery = query(
      collection(db, 'habitAnalytics'),
      where('userId', '==', user.uid)
    );

    const unsubscribeAnalytics = onSnapshot(analyticsQuery, (snapshot) => {
      const analyticsData = snapshot.docs.map(doc => 
        convertDocumentDataToHabitAnalytics(doc.data(), doc.id)
      );
      setAnalytics(analyticsData);
    });

    // Set up listeners for achievements
    const achievementsQuery = query(
      collection(db, 'achievements'),
      where('userId', '==', user.uid),
      orderBy('unlockedAt', 'desc')
    );

    const unsubscribeAchievements = onSnapshot(achievementsQuery, (snapshot) => {
      const achievementsData = snapshot.docs.map(doc => 
        convertDocumentDataToAchievement(doc.data(), doc.id)
      );
      setAchievements(achievementsData);
    });

    // Set up listeners for insights
    const insightsQuery = query(
      collection(db, 'insights'),
      where('userId', '==', user.uid),
      orderBy('generatedAt', 'desc')
    );

    const unsubscribeInsights = onSnapshot(insightsQuery, (snapshot) => {
      const insightsData = snapshot.docs.map(doc => 
        convertDocumentDataToInsight(doc.data(), doc.id)
      );
      setInsights(insightsData);
    });

    setLoading(false);

    return () => {
      unsubscribeAnalytics();
      unsubscribeAchievements();
      unsubscribeInsights();
    };
  }, [user]);

  const updateAnalytics = async (habitId: string, completions: any[]) => {
    if (!user) return;

    const analyticsRef = doc(db, 'habitAnalytics', `${user.uid}_${habitId}`);
    const analyticsDoc = await getDocs(collection(db, 'habitAnalytics')).then(snapshot => 
      snapshot.docs.find(doc => doc.id === `${user.uid}_${habitId}`)
    );

    const now = new Date();
    const weekKey = `${now.getFullYear()}-W${Math.floor(now.getDate() / 7)}`;
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const hourKey = now.getHours().toString();

    const weeklyStats = {
      completions: completions.filter(c => {
        const completionDate = new Date(c.completedAt);
        const completionWeekKey = `${completionDate.getFullYear()}-W${Math.floor(completionDate.getDate() / 7)}`;
        return completionWeekKey === weekKey;
      }).length,
      rate: 0, // Will be calculated
      streak: 0, // Will be calculated
    };

    const monthlyStats = {
      completions: completions.filter(c => {
        const completionDate = new Date(c.completedAt);
        const completionMonthKey = `${completionDate.getFullYear()}-${completionDate.getMonth() + 1}`;
        return completionMonthKey === monthKey;
      }).length,
      rate: 0, // Will be calculated
      streak: 0, // Will be calculated
    };

    const timeOfDayStats = {
      [hourKey]: (analyticsDoc?.data()?.timeOfDayStats?.[hourKey] || 0) + 1,
    };

    const consistencyScore = calculateConsistencyScore(completions);

    const analyticsData = {
      lastUpdated: serverTimestamp(),
      weeklyStats: {
        ...analyticsDoc?.data()?.weeklyStats,
        [weekKey]: weeklyStats,
      },
      monthlyStats: {
        ...analyticsDoc?.data()?.monthlyStats,
        [monthKey]: monthlyStats,
      },
      timeOfDayStats: {
        ...analyticsDoc?.data()?.timeOfDayStats,
        ...timeOfDayStats,
      },
      consistencyScore,
    };

    if (analyticsDoc) {
      await updateDoc(analyticsRef, analyticsData);
    } else {
      await addDoc(collection(db, 'habitAnalytics'), {
        id: `${user.uid}_${habitId}`,
        habitId,
        userId: user.uid,
        ...analyticsData,
      });
    }
  };

  const checkAchievements = async (habit: Habit, completions: any[]) => {
    if (!user) return;

    // Check streak milestones
    const streakMilestones = [7, 14, 30, 60, 100, 365];
    for (const milestone of streakMilestones) {
      if (habit.streak >= milestone && !achievements.some(a => 
        a.type === 'STREAK_MILESTONE' && a.target === milestone && a.habitId === habit.id
      )) {
        await addDoc(collection(db, 'achievements'), {
          userId: user.uid,
          type: 'STREAK_MILESTONE',
          name: `${milestone} Day Streak!`,
          description: `Maintained a ${milestone}-day streak for ${habit.name}`,
          icon: 'fire',
          unlockedAt: serverTimestamp(),
          progress: habit.streak,
          target: milestone,
          habitId: habit.id,
        });
      }
    }

    // Check completion milestones
    const completionMilestones = [10, 25, 50, 100, 250, 500];
    for (const milestone of completionMilestones) {
      if (completions.length >= milestone && !achievements.some(a => 
        a.type === 'COMPLETION_MILESTONE' && a.target === milestone && a.habitId === habit.id
      )) {
        await addDoc(collection(db, 'achievements'), {
          userId: user.uid,
          type: 'COMPLETION_MILESTONE',
          name: `${milestone} Completions!`,
          description: `Completed ${habit.name} ${milestone} times`,
          icon: 'check-circle',
          unlockedAt: serverTimestamp(),
          progress: completions.length,
          target: milestone,
          habitId: habit.id,
        });
      }
    }
  };

  const generateInsights = async (habit: Habit, analytics: HabitAnalytics) => {
    if (!user) return;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate pattern recognition insights
    const patternPrompt = `Analyze this habit data and identify patterns:
      Habit: ${habit.name}
      Frequency: ${habit.frequency}
      Current Streak: ${habit.streak}
      Weekly Stats: ${JSON.stringify(analytics.weeklyStats)}
      Monthly Stats: ${JSON.stringify(analytics.monthlyStats)}
      Time of Day Stats: ${JSON.stringify(analytics.timeOfDayStats)}
      Consistency Score: ${analytics.consistencyScore}
      
      Provide insights about:
      1. Best performing times/days
      2. Patterns in completion
      3. Areas for improvement
      4. Success factors`;

    const patternResult = await model.generateContent(patternPrompt);
    const patternResponse = await patternResult.response;
    const patternText = patternResponse.text();

    await addDoc(collection(db, 'insights'), {
      userId: user.uid,
      type: 'PATTERN_RECOGNITION',
      title: `Patterns in ${habit.name}`,
      description: patternText,
      generatedAt: serverTimestamp(),
      relevance: 0.8,
      habitId: habit.id,
    });

    // Generate improvement suggestions
    const improvementPrompt = `Based on this habit data, provide specific, actionable suggestions for improvement:
      Habit: ${habit.name}
      Current Stats: ${JSON.stringify(analytics)}
      
      Focus on:
      1. Specific, actionable steps
      2. Evidence-based recommendations
      3. Personalized suggestions based on patterns
      4. Short-term and long-term improvements`;

    const improvementResult = await model.generateContent(improvementPrompt);
    const improvementResponse = await improvementResult.response;
    const improvementText = improvementResponse.text();

    await addDoc(collection(db, 'insights'), {
      userId: user.uid,
      type: 'IMPROVEMENT_SUGGESTION',
      title: `Improving ${habit.name}`,
      description: improvementText,
      generatedAt: serverTimestamp(),
      relevance: 0.9,
      habitId: habit.id,
    });
  };

  const calculateConsistencyScore = (completions: any[]): number => {
    if (completions.length < 2) return 0;

    const sortedCompletions = completions
      .map(c => new Date(c.completedAt))
      .sort((a, b) => a.getTime() - b.getTime());

    let totalGaps = 0;
    let gapCount = 0;

    for (let i = 1; i < sortedCompletions.length; i++) {
      const gap = sortedCompletions[i].getTime() - sortedCompletions[i - 1].getTime();
      totalGaps += gap;
      gapCount++;
    }

    const averageGap = totalGaps / gapCount;
    const standardDeviation = Math.sqrt(
      sortedCompletions.slice(1).reduce((acc, curr, i) => {
        const gap = curr.getTime() - sortedCompletions[i].getTime();
        return acc + Math.pow(gap - averageGap, 2);
      }, 0) / gapCount
    );

    // Lower standard deviation means more consistency
    const consistencyScore = Math.max(0, 1 - (standardDeviation / (24 * 60 * 60 * 1000)));
    return Math.round(consistencyScore * 100);
  };

  return {
    analytics,
    achievements,
    insights,
    loading,
    updateAnalytics,
    checkAchievements,
    generateInsights,
  };
}; 