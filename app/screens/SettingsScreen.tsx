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
import { useAuth } from '../../src/contexts/AuthContext';
import { useHabits } from '../../src/hooks/useHabits';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const SettingsScreen = ({ navigation }: any) => {
  const { logout, user, sendVerificationEmail, reloadUser } = useAuth();
  const { habits, loading, deleteHabit } = useHabits();
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [lastVerificationSent, setLastVerificationSent] = useState<number>(0);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to sign out. Please try again.'
      );
    }
  };

  const handleResendVerification = async () => {
    // Check if we've sent a verification email in the last minute
    const now = Date.now();
    if (now - lastVerificationSent < 60000) { // 1 minute cooldown
      Alert.alert(
        'Please Wait',
        'Please wait a minute before requesting another verification email.'
      );
      return;
    }

    try {
      setVerificationLoading(true);
      await sendVerificationEmail();
      setLastVerificationSent(now);
      
      Alert.alert(
        'Success',
        'Verification email sent. Please check your inbox and click the verification link. After verifying, click OK to refresh your status.',
        [
          {
            text: 'OK',
            onPress: async () => {
              try {
                await reloadUser();
              } catch (error: any) {
                const errorMessage = error.code === 'auth/too-many-requests'
                  ? 'Too many attempts. Please try again later.'
                  : error.message || 'Failed to refresh user status. Please try again.';
                
                Alert.alert('Error', errorMessage);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error.code === 'auth/too-many-requests'
        ? 'Too many attempts. Please wait a few minutes before trying again.'
        : error.message || 'Failed to send verification email. Please try again.';
      
      Alert.alert('Error', errorMessage);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(habitId);
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to delete habit. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>HABITS</Text>
          <TouchableOpacity
            style={[styles.listItem, styles.listItemFirst]}
            onPress={() => navigation.navigate('AddHabit')}
          >
            <View style={styles.listItemContent}>
              <MaterialCommunityIcons name="plus-circle-outline" size={22} color="#007AFF" style={styles.listItemIcon} />
              <Text style={styles.listItemText}>Add New Habit</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#8E8E93" />
          </TouchableOpacity>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : habits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No habits found</Text>
            </View>
          ) : (
            habits.map((habit, index) => (
              <View key={habit.id}>
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    index === 0 && styles.listItemFirst,
                    index === habits.length - 1 && styles.listItemLast,
                  ]}
                >
                  <View style={styles.listItemContent}>
                    <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={22} color="#007AFF" style={styles.listItemIcon} />
                    <View style={styles.habitInfo}>
                      <Text style={styles.habitName}>{habit.name}</Text>
                      <Text style={styles.habitFrequency}>{habit.frequency}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteHabit(habit.id)}
                    style={styles.deleteButton}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          <TouchableOpacity
            style={[styles.listItem, styles.listItemFirst, styles.listItemLast]}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.listItemContent}>
              <MaterialCommunityIcons name="account-outline" size={22} color="#007AFF" style={styles.listItemIcon} />
              <Text style={styles.listItemText}>Profile Settings</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#8E8E93" />
          </TouchableOpacity>
          
          {user && !user.emailVerified && (
            <TouchableOpacity
              style={[styles.verifyButton, verificationLoading && styles.buttonDisabled]}
              onPress={handleResendVerification}
              disabled={verificationLoading}
            >
              {verificationLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify Email Address</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.listItem, styles.listItemFirst, styles.listItemLast, styles.logoutButton]}
            onPress={handleLogout}
          >
            <View style={styles.listItemContent}>
              <MaterialCommunityIcons name="logout" size={22} color="#FF3B30" style={styles.listItemIcon} />
              <Text style={[styles.listItemText, styles.logoutText]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  listItemFirst: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  listItemLast: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomWidth: 0,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemIcon: {
    marginRight: 12,
  },
  listItemText: {
    fontSize: 17,
    color: '#000000',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 17,
    color: '#000000',
  },
  habitFrequency: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
  },
  logoutText: {
    color: '#FF3B30',
  },
}); 