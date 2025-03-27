import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Habit } from '../types/habit';
import { useAuth } from '../../src/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface HabitChatProps {
  habits: Habit[];
}

export const HabitChat: React.FC<HabitChatProps> = ({ habits }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userName, setUserName] = useState('');
  const { user } = useAuth();
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    // Get user's display name or email
    const name = user?.displayName || user?.email?.split('@')[0] || 'Friend';
    setUserName(name);
    
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      text: `Hi ${name}! 👋 I'm your Health Coach! I can help you track your habits, stay motivated, and achieve your health goals. What would you like to know about your habits?`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [user]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Generate a cheerful response based on the user's message
    setTimeout(() => {
      const response = generateResponse(inputText.trim().toLowerCase(), habits);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const generateResponse = (message: string, habits: Habit[]): string => {
    const today = new Date();
    const completedHabits = habits.filter(habit => {
      const dateString = today.toISOString().split('T')[0];
      return habit.completedDates.includes(dateString);
    });

    // Help with specific habits
    if (message.includes('how to') || message.includes('tips for')) {
      const habitQuery = message.toLowerCase();
      let habitName = '';
      
      if (habitQuery.includes('how to')) {
        habitName = habitQuery.split('how to')[1]?.trim();
      } else if (habitQuery.includes('tips for')) {
        habitName = habitQuery.split('tips for')[1]?.trim();
      } else {
        // Extract habit name after "improve my" or just the habit name itself
        const improveMatch = habitQuery.match(/improve (?:my )?([a-z\s]+)(habit)?/);
        if (improveMatch) {
          habitName = improveMatch[1].trim();
        }
      }

      if (habitName) {
        const habit = habits.find(h => 
          h.name.toLowerCase().includes(habitName) || 
          habitName.includes(h.name.toLowerCase())
        );
        
        if (habit) {
          if (habit.name.toLowerCase().includes('meditation')) {
            return `Here are some specific tips for meditation:
• Start with just 5 minutes a day and gradually increase
• Choose a quiet, comfortable spot
• Set a consistent time (many find morning works best)
• Use guided meditation apps if you're just starting
• Focus on your breath as an anchor
• Don't worry about "clearing your mind" - just observe thoughts without judgment
• Track your sessions in the app to build momentum

Would you like more specific meditation techniques?`;
          }
          
          return `Here are some tips for ${habit.name}:
• Set a specific time each day for this habit
• Start small and gradually increase
• Track your progress in the app
• Celebrate small wins
• Use the streak feature to stay motivated

Would you like more specific advice for this habit?`;
        }
      }
      return "I can help with specific habits! Just tell me which habit you'd like tips for. For example, try asking 'How to improve meditation?' or 'Tips for exercise'";
    }

    // Progress tracking
    if (message.includes('progress') || message.includes('status')) {
      if (habits.length === 0) {
        return "You haven't created any habits yet. Would you like help creating your first habit?";
      }
      if (completedHabits.length === habits.length) {
        return `Great job! You've completed all ${habits.length} habits for today. Your current streaks:
${habits.map(h => `• ${h.name}: ${h.streak} days`).join('\n')}`;
      }
      if (completedHabits.length > 0) {
        return `You've completed ${completedHabits.length} out of ${habits.length} habits today:
Completed: ${completedHabits.map(h => h.name).join(', ')}
Remaining: ${habits.filter(h => !completedHabits.includes(h)).map(h => h.name).join(', ')}`;
      }
      return "You haven't completed any habits yet today. Would you like help getting started?";
    }

    // Streak information
    if (message.includes('streak') || message.includes('record')) {
      const bestStreak = Math.max(...habits.map(h => h.streak));
      if (bestStreak > 0) {
        const bestHabit = habits.find(h => h.streak === bestStreak);
        return `Your best streak is ${bestStreak} days with ${bestHabit?.name}! Current streaks:
${habits.map(h => `• ${h.name}: ${h.streak} days`).join('\n')}`;
      }
      return "You're just getting started! Every journey begins with a single step. Would you like help building your first streak?";
    }

    // Frequency help
    if (message.includes('frequency') || message.includes('schedule')) {
      const dailyHabits = habits.filter(h => h.frequency === 'daily');
      const weeklyHabits = habits.filter(h => h.frequency === 'weekly');
      const monthlyHabits = habits.filter(h => h.frequency === 'monthly');
      
      return `Your habits are scheduled as follows:
Daily: ${dailyHabits.map(h => h.name).join(', ') || 'None'}
Weekly: ${weeklyHabits.map(h => h.name).join(', ') || 'None'}
Monthly: ${monthlyHabits.map(h => h.name).join(', ') || 'None'}`;
    }

    // Help with specific habit
    const habitName = message.toLowerCase().split('about')[1]?.trim();
    if (habitName) {
      const habit = habits.find(h => h.name.toLowerCase().includes(habitName));
      if (habit) {
        const isCompleted = completedHabits.includes(habit);
        return `About ${habit.name}:
• Frequency: ${habit.frequency}
• Current streak: ${habit.streak} days
• Status today: ${isCompleted ? 'Completed' : 'Not completed'}
• Total completions: ${habit.completedDates.length}`;
      }
    }

    // General help
    if (message.includes('help') || message.includes('what can you do')) {
      return `I can help you with:
• Getting tips for specific habits (ask 'how to' or 'tips for' followed by habit name)
• Checking your daily progress
• Tracking your streaks
• Understanding your habit schedule
• Getting information about specific habits (ask 'about' followed by habit name)
What would you like to know?`;
    }

    // Default response
    return "I can help you with your habits! Try asking about:\n• How to improve a specific habit\n• Your current progress\n• Your streaks\n• Your habit schedule\n• Information about a specific habit";
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessage : styles.botMessage,
            ]}
          >
            {!message.isUser && (
              <MaterialCommunityIcons
                name="heart-pulse"
                size={24}
                color="#007AFF"
                style={styles.botIcon}
              />
            )}
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything about your habits..."
          placeholderTextColor="#999"
          multiline
          onKeyPress={handleKeyPress}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
            pressed && styles.sendButtonPressed,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <MaterialCommunityIcons
            name="send"
            size={24}
            color={inputText.trim() ? '#007AFF' : '#999'}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    ...Platform.select({
      web: {
        maxWidth: 800,
        marginHorizontal: 'auto',
      },
    }),
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    ...Platform.select({
      web: {
        paddingBottom: 32,
      },
    }),
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    maxWidth: '80%',
    ...Platform.select({
      web: {
        maxWidth: '70%',
      },
    }),
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  botIcon: {
    marginRight: 8,
    marginTop: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
    ...Platform.select({
      web: {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1,
      },
    }),
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
    ...Platform.select({
      web: {
        outline: 'none',
        border: 'none',
        resize: 'none',
        minHeight: 40,
      },
    }),
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      },
    }),
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonPressed: {
    opacity: 0.7,
  },
}); 