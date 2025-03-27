import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useAnalytics } from '../../src/hooks/useAnalytics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

type TabType = 'analytics' | 'achievements' | 'insights';

export const AnalyticsScreen = () => {
  const { analytics, achievements, insights, loading } = useAnalytics();
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  const renderTabButton = (tab: TabType, label: string, icon: keyof typeof MaterialCommunityIcons.glyphMap) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.activeTabButton,
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={activeTab === tab ? '#007AFF' : '#8E8E93'}
      />
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tab && styles.activeTabButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderAnalytics = () => {
    if (analytics.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chart-line" size={48} color="#8E8E93" />
          <Text style={styles.emptyText}>No analytics data yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.analyticsContainer}>
        {analytics.map((analytic) => (
          <View key={analytic.id} style={styles.analyticCard}>
            <Text style={styles.analyticTitle}>Habit Analytics</Text>
            <View style={styles.analyticStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{analytic.consistencyScore}%</Text>
                <Text style={styles.statLabel}>Consistency</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Object.values(analytic.weeklyStats).reduce((acc, curr) => acc + curr.completions, 0)}
                </Text>
                <Text style={styles.statLabel}>Weekly Completions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Object.values(analytic.monthlyStats).reduce((acc, curr) => acc + curr.completions, 0)}
                </Text>
                <Text style={styles.statLabel}>Monthly Completions</Text>
              </View>
            </View>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Weekly Progress</Text>
              <LineChart
                data={{
                  labels: Object.keys(analytic.weeklyStats).slice(-4),
                  datasets: [{
                    data: Object.values(analytic.weeklyStats)
                      .slice(-4)
                      .map(stat => stat.completions),
                  }],
                }}
                width={Dimensions.get('window').width - 48}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderAchievements = () => {
    if (achievements.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="trophy-outline" size={48} color="#8E8E93" />
          <Text style={styles.emptyText}>No achievements yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.achievementsContainer}>
        {achievements.map((achievement) => (
          <View key={achievement.id} style={styles.achievementCard}>
            <MaterialCommunityIcons 
              name={achievement.icon as keyof typeof MaterialCommunityIcons.glyphMap} 
              size={32} 
              color="#007AFF" 
            />
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>{achievement.name}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(achievement.progress / achievement.target) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {achievement.progress} / {achievement.target}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderInsights = () => {
    if (insights.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="lightbulb-outline" size={48} color="#8E8E93" />
          <Text style={styles.emptyText}>No insights yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.insightsContainer}>
        {insights.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <MaterialCommunityIcons
                name={
                  insight.type === 'PATTERN_RECOGNITION'
                    ? 'chart-line'
                    : insight.type === 'IMPROVEMENT_SUGGESTION'
                    ? 'lightbulb'
                    : 'star'
                }
                size={24}
                color="#007AFF"
              />
              <Text style={styles.insightTitle}>{insight.title}</Text>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
            {insight.actionItems && (
              <View style={styles.actionItemsContainer}>
                {insight.actionItems.map((item, index) => (
                  <View key={index} style={styles.actionItem}>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#34C759" />
                    <Text style={styles.actionItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabBar}>
        {renderTabButton('analytics', 'Analytics', 'chart-line-variant')}
        {renderTabButton('achievements', 'Achievements', 'trophy-outline')}
        {renderTabButton('insights', 'Insights', 'lightbulb-outline')}
      </View>
      <ScrollView style={styles.content}>
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'insights' && renderInsights()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    color: '#8E8E93',
    marginTop: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#C6C6C8',
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 15,
    color: '#8E8E93',
    marginLeft: 8,
  },
  activeTabButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 17,
    color: '#8E8E93',
    marginTop: 16,
  },
  analyticsContainer: {
    padding: 16,
  },
  analyticCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  analyticTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  analyticStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  chartContainer: {
    marginTop: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  achievementsContainer: {
    padding: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 16,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  insightsContainer: {
    padding: 16,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  insightDescription: {
    fontSize: 15,
    color: '#000000',
    marginBottom: 16,
  },
  actionItemsContainer: {
    marginTop: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionItemText: {
    fontSize: 15,
    color: '#000000',
    marginLeft: 8,
  },
}); 