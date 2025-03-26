import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Habit, HabitCompletion, HabitStats } from '../types/habit';

export const HabitDetailScreen = ({ route, navigation }: any) => {
  const { habitId } = route.params;
  const [habit, setHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [stats, setStats] = useState<HabitStats | null>(null);

  useEffect(() => {
    // TODO: Fetch habit details, completions, and stats from Firebase
    // This will be implemented when we set up Firebase
  }, [habitId]);

  const handleComplete = async () => {
    // TODO: Mark habit as completed for today
    // This will be implemented when we set up Firebase
  };

  if (!habit) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{habit.name}</Text>
          <Text style={styles.description}>{habit.description}</Text>
          <Text style={styles.frequency}>Frequency: {habit.frequency}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.longestStreak || 0}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.completionRate || 0}%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>Mark as Complete</Text>
        </TouchableOpacity>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Completion History</Text>
          {completions.map((completion) => (
            <View key={completion.id} style={styles.historyItem}>
              <Text style={styles.historyDate}>
                {new Date(completion.completedAt).toLocaleDateString()}
              </Text>
              {completion.notes && (
                <Text style={styles.historyNotes}>{completion.notes}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  frequency: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  completeButton: {
    backgroundColor: '#34C759',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  historyItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#FFFFFF',
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  historyNotes: {
    fontSize: 14,
    color: '#666',
  },
}); 