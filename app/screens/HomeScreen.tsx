import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Habit } from '../types/habit';
import { useAuth } from '../../src/contexts/AuthContext';
import { useHabits } from '../../src/hooks/useHabits';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HabitChat } from '../components/HabitChat';

export const HomeScreen = ({ navigation }: any) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { habits, loading, completeHabit, uncompleteHabit } = useHabits();

  const handleCompleteHabit = async (habit: Habit) => {
    try {
      setError(null);
      await completeHabit(habit.id, selectedDate);
    } catch (error) {
      console.error('Error completing habit:', error);
      setError('Failed to complete habit. Please try again.');
      Alert.alert(
        'Error',
        'Failed to complete habit. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => handleCompleteHabit(habit),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleUncompleteHabit = async (habit: Habit) => {
    try {
      setError(null);
      await uncompleteHabit(habit.id, selectedDate);
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      setError('Failed to uncomplete habit. Please try again.');
      Alert.alert(
        'Error',
        'Failed to uncomplete habit. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => handleUncompleteHabit(habit),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const isHabitCompleted = (habit: Habit) => {
    const dateString = selectedDate.toISOString().split('T')[0];
    return habit.completedDates.includes(dateString);
  };

  const handleHabitPress = (habit: Habit) => {
    navigation.navigate('History', { habitId: habit.id });
  };

  const renderHabitItem = (habit: Habit) => {
    const completed = isHabitCompleted(habit);
    return (
      <TouchableOpacity
        key={habit.id}
        style={[
          styles.habitItem,
          completed && styles.habitItemCompleted,
        ]}
        onPress={() => handleHabitPress(habit)}
      >
        <View style={styles.habitContent}>
          <Text style={[
            styles.habitName,
            completed && styles.habitNameCompleted
          ]}>
            {habit.name}
          </Text>
          <View style={styles.habitDetails}>
            <Text style={styles.habitFrequency}>{habit.frequency}</Text>
            <View style={styles.streakContainer}>
              <MaterialCommunityIcons name="fire" size={16} color="#FF6B6B" />
              <Text style={styles.streakText}>{habit.streak}</Text>
            </View>
          </View>
        </View>
        <View style={styles.habitActions}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={(e) => {
              e.stopPropagation();
              completed ? handleUncompleteHabit(habit) : handleCompleteHabit(habit);
            }}
          >
            <MaterialCommunityIcons
              name={completed ? 'check-circle' : 'circle-outline'}
              size={24}
              color={completed ? '#34C759' : '#8E8E93'}
            />
          </TouchableOpacity>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your habits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Today's Habits</Text>
          <Text style={styles.date}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF3B30" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="plus-circle-outline" size={48} color="#007AFF" />
            <Text style={styles.emptyTitle}>No Habits Yet</Text>
            <Text style={styles.emptyText}>Start building good habits by adding your first one</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.addButtonText}>Add Your First Habit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.habitsContainer}>
            {habits.map(renderHabitItem)}
          </View>
        )}
      </ScrollView>
      <View style={styles.chatContainer}>
        <HabitChat habits={habits} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  date: {
    fontSize: 17,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    margin: 16,
    padding: 12,
    borderRadius: 10,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 15,
    color: '#FF3B30',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 17,
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  habitsContainer: {
    padding: 16,
  },
  habitItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  habitItemCompleted: {
    backgroundColor: '#F2F2F7',
  },
  habitContent: {
    flex: 1,
  },
  habitName: {
    fontSize: 17,
    color: '#000000',
    marginBottom: 4,
  },
  habitNameCompleted: {
    color: '#8E8E93',
  },
  habitDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitFrequency: {
    fontSize: 13,
    color: '#8E8E93',
    marginRight: 12,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 13,
    color: '#FF6B6B',
    marginLeft: 4,
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeButton: {
    marginRight: 8,
  },
  chatContainer: {
    height: 300,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
    backgroundColor: '#FFFFFF',
  },
}); 