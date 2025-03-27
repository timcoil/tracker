import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from './app/screens/HomeScreen';
import { HabitDetailScreen } from './app/screens/HabitDetailScreen';
import { HistoryScreen } from './app/screens/HistoryScreen';
import { SettingsScreen } from './app/screens/SettingsScreen';
import { LoginScreen } from './app/screens/LoginScreen';
import { SignUpScreen } from './app/screens/SignUpScreen';
import { ProfileScreen } from './app/screens/ProfileScreen';
import { AddHabitScreen } from './app/screens/AddHabitScreen';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

export type RootStackParamList = {
  MainTabs: undefined;
  HabitDetail: { habitId: string };
  Login: undefined;
  SignUp: undefined;
  Profile: undefined;
  AddHabit: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 88 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 8 : 0,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          title: 'History',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerStyle: {
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e5e5',
        },
      }}
    >
      {user ? (
        // Authenticated stack
        <>
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ 
              headerShown: false,
              title: 'Habit Tracker',
            }}
          />
          <Stack.Screen
            name="HabitDetail"
            component={HabitDetailScreen}
            options={{ title: 'Habit Details' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile Settings' }}
          />
          <Stack.Screen
            name="AddHabit"
            component={AddHabitScreen}
            options={{ title: 'Add New Habit' }}
          />
        </>
      ) : (
        // Auth stack
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ 
              headerShown: false,
              title: 'Sign In',
            }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ 
              headerShown: false,
              title: 'Sign Up',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer
        documentTitle={{
          formatter: (options, route) =>
            `${options?.title ?? route?.name} - Habit Tracker`,
        }}
      >
        <Navigation />
      </NavigationContainer>
    </AuthProvider>
  );
} 