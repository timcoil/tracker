import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Habit } from '../types/habit';
import { useHabits } from '../../src/hooks/useHabits';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const HistoryScreen = ({ route, navigation }: any) => {
  const { habits, completions, loading } = useHabits();
  const [error, setError] = useState<string | null>(null);

  // If no route params, show a list of all habits
  if (!route.params?.habitId) {
    if (loading) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading habits...</Text>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Habit History</Text>
          </View>
          {habits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No habits found</Text>
            </View>
          ) : (
            habits.map(habit => {
              const habitCompletions = completions.filter(c => c.habitId === habit.id);
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={styles.habitItem}
                  onPress={() => navigation.navigate('History', { habitId: habit.id })}
                >
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <Text style={styles.habitFrequency}>{habit.frequency}</Text>
                  </View>
                  <View style={styles.habitStats}>
                    <Text style={styles.habitCompletions}>
                      {habitCompletions.length} completions
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { habitId } = route.params;
  const habit = habits.find(h => h.id === habitId);

  // Handle deleted habit
  if (!habit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#007AFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.errorText}>This habit no longer exists</Text>
        </View>
      </SafeAreaView>
    );
  }

  const habitCompletions = completions.filter(c => c.habitId === habitId);
  const sortedCompletions = [...habitCompletions].sort(
    (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
  );

  const renderCompletionItem = (completion: any) => {
    const date = completion.completedAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <View key={completion.id} style={styles.completionItem}>
        <MaterialCommunityIcons name="check-circle" size={24} color="#34C759" />
        <Text style={styles.completionDate}>{date}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading habit history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#007AFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{habit.name}</Text>
          <Text style={styles.frequency}>{habit.frequency}</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="fire" size={24} color="#FF6B6B" />
            <Text style={styles.statValue}>{habit.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{habitCompletions.length}</Text>
            <Text style={styles.statLabel}>Total Completions</Text>
          </View>
        </View>

        <View style={styles.completionsContainer}>
          <Text style={styles.sectionTitle}>Completion History</Text>
          {sortedCompletions.length === 0 ? (
            <Text style={styles.emptyText}>No completions yet</Text>
          ) : (
            sortedCompletions.map(renderCompletionItem)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  frequency: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  completionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 8,
  },
  completionDate: {
    marginLeft: 12,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  habitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  habitFrequency: {
    fontSize: 14,
    color: '#666',
  },
  habitStats: {
    marginLeft: 16,
  },
  habitCompletions: {
    fontSize: 14,
    color: '#666',
  },
}); 