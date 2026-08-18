import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { PlansRepo } from '../../src/db/plansRepo';
import { ReadingPlan } from '../../src/types/plan';
import { getItem, setItem, StorageKeys } from '../../src/utils/storage';

export default function ReadingPlansListScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [plansProgress, setPlansProgress] = useState<Record<string, number>>({});
  const [activePlanId, setActivePlanId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load all user reading plans from SQLite
  const loadPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const userPlans = await PlansRepo.getUserPlans(db);
      setPlans(userPlans);

      const activeId = getItem<string>(StorageKeys.ACTIVE_PLAN_ID, '');
      setActivePlanId(activeId);

      // Load progress for each plan
      const progressMap: Record<string, number> = {};
      for (const p of userPlans) {
        const completed = await PlansRepo.getCompletedDays(db, p.id);
        progressMap[p.id] = completed.length;
      }
      setPlansProgress(progressMap);
    } catch (e) {
      console.error('Failed to load user plans:', e);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [loadPlans])
  );

  const handleOpenPlanDetail = (plan: ReadingPlan) => {
    router.push({
      pathname: '/plan/[id]',
      params: { id: plan.id },
    });
  };

  const handleCreateNewPlan = () => {
    router.push('/plan/new');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar with + Create Plan button */}
      <View style={[styles.topBar, { borderBottomColor: colors.border, backgroundColor: colors.glassBackground }]}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Reading Plans</Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            {plans.length} {plans.length === 1 ? 'Plan' : 'Plans'} in your library
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addPlanBtn, { backgroundColor: colors.tint }]}
          onPress={handleCreateNewPlan}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.addPlanBtnText}>New Plan</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading plans...</Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.glassHighlight }]}>
                <Ionicons name="calendar-outline" size={40} color={colors.gold} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Reading Plans Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Create a customized Bible reading plan to build a daily scripture habit.
              </Text>

              <TouchableOpacity
                style={[styles.emptyCreateBtn, { backgroundColor: colors.tint }]}
                onPress={handleCreateNewPlan}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyCreateBtnText}>Create Reading Plan</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const completedCount = plansProgress[item.id] || 0;
            const progressPercent = item.durationDays > 0
              ? Math.round((completedCount / item.durationDays) * 100)
              : 0;
            const isActive = activePlanId === item.id;
            const nextDay = item.days[completedCount] || item.days[0];

            return (
              <TouchableOpacity
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.glassCard,
                    borderColor: isActive ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => handleOpenPlanDetail(item)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={styles.titleBadgeRow}>
                      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {isActive && (
                        <View style={[styles.activePill, { backgroundColor: colors.tintLight }]}>
                          <Text style={[styles.activePillText, { color: colors.tint }]}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.description || `${item.durationDays} days reading journey`}
                    </Text>
                  </View>

                  <View style={[styles.percentBadge, { backgroundColor: colors.glassHighlight }]}>
                    <Text style={[styles.percentText, { color: colors.gold }]}>{progressPercent}%</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBarBg, { backgroundColor: colors.glassInput }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { backgroundColor: colors.success, width: `${progressPercent}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.progressStatsRow}>
                    <Text style={[styles.progressStatsText, { color: colors.textSecondary }]}>
                      {completedCount} of {item.durationDays} Days ({progressPercent}%)
                    </Text>
                    {nextDay && (
                      <Text style={[styles.nextDaySnippet, { color: colors.tint }]}>
                        Next: Day {nextDay.day}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Card Footer */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.daysBadge}>
                    <Ionicons name="time-outline" size={14} color={colors.textTertiary} style={{ marginRight: 4 }} />
                    <Text style={[styles.daysBadgeText, { color: colors.textTertiary }]}>
                      {item.durationDays} Days Plan
                    </Text>
                  </View>
                  <View style={styles.viewPlanRow}>
                    <Text style={[styles.viewPlanText, { color: colors.tint }]}>View Day-by-Day</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.tint} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  addPlanBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  planCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginRight: 8,
  },
  activePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 13,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStatsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  nextDaySnippet: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysBadgeText: {
    fontSize: 12,
  },
  viewPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewPlanText: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 2,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
