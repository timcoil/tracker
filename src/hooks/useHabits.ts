import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, getDoc, getDocs, writeBatch, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Habit, HabitCompletion, HabitAnalytics } from '../../app/types/habit';
import { useAnalytics } from './useAnalytics';

const calculateStreak = (completedDates: string[], frequency: 'daily' | 'weekly' | 'monthly'): number => {
  if (completedDates.length === 0) return 0;

  const today = new Date();
  const sortedDates = [...completedDates].sort().reverse();
  let streak = 0;
  let currentDate = new Date(today);

  for (const dateString of sortedDates) {
    const completionDate = new Date(dateString);
    const isConsecutive = (() => {
      switch (frequency) {
        case 'daily':
          return currentDate.getTime() - completionDate.getTime() <= 24 * 60 * 60 * 1000;
        case 'weekly':
          return currentDate.getTime() - completionDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
        case 'monthly':
          return currentDate.getMonth() === completionDate.getMonth() &&
                 currentDate.getFullYear() === completionDate.getFullYear();
        default:
          return false;
      }
    })();

    if (isConsecutive) {
      streak++;
      currentDate = completionDate;
    } else {
      break;
    }
  }

  return streak;
};

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

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { updateAnalytics, checkAchievements, generateInsights } = useAnalytics();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('Setting up habits listener for user:', user.uid);

    const habitsQuery = query(
      collection(db, 'habits'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
      console.log('Received habits snapshot:', snapshot.size, 'habits');
      
      // First, handle any deletions
      const deletedHabitIds = new Set<string>();
      snapshot.docChanges().forEach((change) => {
        console.log('Document change:', {
          type: change.type,
          docId: change.doc.id,
          data: change.doc.data()
        });
        
        if (change.type === 'removed') {
          deletedHabitIds.add(change.doc.id);
        }
      });
      
      // Then process all documents
      const habitsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const habit = {
          id: doc.id,
          name: data.name,
          frequency: data.frequency,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          completedDates: data.completedDates || [],
          userId: data.userId || user.uid,
          streak: calculateStreak(data.completedDates || [], data.frequency),
        } as Habit;
        console.log('Processing habit:', habit);
        return habit;
      });
      
      // Filter out any deleted habits
      const finalHabitsData = habitsData.filter(habit => !deletedHabitIds.has(habit.id));
      
      console.log('Setting habits state with:', finalHabitsData);
      setHabits(finalHabitsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching habits:', error);
      setLoading(false);
    });

    const completionsQuery = query(
      collection(db, 'habitCompletions'),
      where('userId', '==', user.uid),
      orderBy('completedAt', 'desc')
    );

    const unsubscribeCompletions = onSnapshot(completionsQuery, (snapshot) => {
      console.log('Received completions snapshot:', snapshot.size, 'completions');
      const completionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          habitId: data.habitId,
          completedAt: data.completedAt?.toDate() || new Date(),
          userId: data.userId || user.uid,
        } as HabitCompletion;
      });
      setCompletions(completionsData);
    });

    return () => {
      console.log('Cleaning up habits listeners');
      unsubscribeHabits();
      unsubscribeCompletions();
    };
  }, [user]);

  const addHabit = async (name: string, frequency: 'daily' | 'weekly' | 'monthly') => {
    if (!user) throw new Error('No user logged in');

    console.log('Adding new habit:', { name, frequency, userId: user.uid });

    const habitData = {
      name,
      frequency,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedDates: [],
      userId: user.uid,
      streak: 0,
    };

    try {
      const docRef = await addDoc(collection(db, 'habits'), habitData);
      console.log('Successfully created habit with ID:', docRef.id);
      return docRef;
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!user) {
      console.error('No user found when trying to delete habit');
      throw new Error('No user logged in');
    }

    console.log('Starting habit deletion process for habit:', habitId);

    try {
      // Get the habit document first to verify ownership
      const habitRef = doc(db, 'habits', habitId);
      const habitDoc = await getDoc(habitRef);
      
      if (!habitDoc.exists()) {
        console.error('Habit not found:', habitId);
        throw new Error('Habit not found');
      }

      const habitData = habitDoc.data();
      if (habitData.userId !== user.uid) {
        console.error('User does not own this habit:', habitId);
        throw new Error('You do not have permission to delete this habit');
      }

      // Create a batch for atomic operations
      const batch = writeBatch(db);
      
      // Delete all completions for this habit
      const completionsQuery = query(
        collection(db, 'habitCompletions'),
        where('habitId', '==', habitId),
        where('userId', '==', user.uid)
      );

      const completionsSnapshot = await getDocs(completionsQuery);
      console.log(`Found ${completionsSnapshot.size} completions to delete`);

      // Add all completion deletions to the batch
      completionsSnapshot.docs.forEach(doc => {
        console.log('Adding completion deletion to batch:', doc.id);
        batch.delete(doc.ref);
      });

      // Add habit deletion to the batch
      console.log('Adding habit deletion to batch:', habitId);
      batch.delete(habitRef);

      // Commit the batch
      console.log('Committing batch operation...');
      try {
        await batch.commit();
        console.log('Successfully committed batch operation');
      } catch (commitError: any) {
        console.error('Error committing batch:', commitError);
        console.error('Error code:', commitError.code);
        console.error('Error message:', commitError.message);
        throw new Error(`Failed to commit batch: ${commitError.message}`);
      }

      // Let the real-time listener handle state updates
      console.log('Deletion complete, waiting for real-time listener to update state');
    } catch (error: any) {
      console.error('Error in deleteHabit:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to delete habit: ${error.message}`);
    }
  };

  const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
    if (!user) throw new Error('No user logged in');

    console.log('Updating habit:', habitId, updates);

    try {
      await updateDoc(doc(db, 'habits', habitId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('Successfully updated habit');
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  };

  const completeHabit = async (habitId: string, date: Date) => {
    if (!user) throw new Error('No user logged in');

    console.log('Completing habit:', habitId, 'for date:', date);

    const dateString = date.toISOString().split('T')[0];
    const habit = habits.find(h => h.id === habitId);
    if (!habit) throw new Error('Habit not found');

    try {
      const updatedDates = [...habit.completedDates, dateString];
      const updatedStreak = calculateStreak(updatedDates, habit.frequency);
      
      await updateHabit(habitId, { 
        completedDates: updatedDates,
        streak: updatedStreak,
        lastCompleted: date
      });

      const completionData = {
        habitId,
        completedAt: serverTimestamp(),
        userId: user.uid,
      };

      const completionRef = await addDoc(collection(db, 'habitCompletions'), completionData);
      
      // Update analytics and check achievements
      const habitCompletions = completions.filter(c => c.habitId === habitId);
      await updateAnalytics(habitId, [...habitCompletions, { ...completionData, id: completionRef.id }]);
      await checkAchievements(habit, [...habitCompletions, { ...completionData, id: completionRef.id }]);
      
      // Generate insights if we have enough data
      if (habitCompletions.length >= 5) {
        const analyticsDoc = await getDocs(collection(db, 'habitAnalytics')).then(snapshot => 
          snapshot.docs.find(doc => doc.id === `${user.uid}_${habitId}`)
        );
        if (analyticsDoc) {
          const analytics = convertDocumentDataToHabitAnalytics(analyticsDoc.data(), analyticsDoc.id);
          await generateInsights(habit, analytics);
        }
      }

      console.log('Successfully completed habit');
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    }
  };

  const uncompleteHabit = async (habitId: string, date: Date) => {
    if (!user) throw new Error('No user logged in');

    console.log('Uncompleting habit:', habitId, 'for date:', date);

    const dateString = date.toISOString().split('T')[0];
    const habit = habits.find(h => h.id === habitId);
    if (!habit) throw new Error('Habit not found');

    try {
      const updatedDates = habit.completedDates.filter(d => d !== dateString);
      const updatedStreak = calculateStreak(updatedDates, habit.frequency);
      
      await updateHabit(habitId, { 
        completedDates: updatedDates,
        streak: updatedStreak
      });
      console.log('Successfully uncompleted habit');
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      throw error;
    }
  };

  return {
    habits,
    completions,
    loading,
    addHabit,
    deleteHabit,
    updateHabit,
    completeHabit,
    uncompleteHabit,
    setHabits,
  };
}; 