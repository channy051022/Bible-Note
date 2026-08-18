import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { PlansRepo } from '../../src/db/plansRepo';
import { useTheme } from '../../src/hooks/useTheme';
import { ReadingPlan, ReadingPlanDay } from '../../src/types/plan';
import { getItem, setItem, StorageKeys } from '../../src/utils/storage';

export default function PlanDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const planId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActivePlan, setIsActivePlan] = useState<boolean>(false);

  const loadPlanData = useCallback(async () => {
    if (!planId) return;

    try {
      setIsLoading(true);
      const fetchedPlan = await PlansRepo.getPlanById(db, planId);
      if (fetchedPlan) {
        setPlan(fetchedPlan);
        const done = await PlansRepo.getCompletedDays(db, planId);
        setCompletedDays(new Set(done));

        const activeId = getItem<string>(StorageKeys.ACTIVE_PLAN_ID, '');
        setIsActivePlan(activeId === planId);
      } else {
        Alert.alert('Plan Not Found', 'This reading plan could not be found.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e) {
      console.error('Failed to load plan details:', e);
      Alert.alert('Error', 'Failed to load reading plan.');
    } finally {
      setIsLoading(false);
    }
  }, [db, planId, router]);

  useEffect(() => {
    loadPlanData();
  }, [loadPlanData]);

  // Toggle Day Completion
  const handleToggleDay = async (dayNumber: number) => {
    if (!planId) return;
    try {
      const isNowCompleted = await PlansRepo.toggleDayProgress(db, planId, dayNumber);
      setCompletedDays((prev) => {
        const next = new Set(prev);
        if (isNowCompleted) next.add(dayNumber);
        else next.delete(dayNumber);
        return next;
      });
    } catch (e) {
      console.error('Failed to toggle day:', e);
    }
  };

  // Open Scripture passage in Bible Reader
  const handleOpenReading = (day: ReadingPlanDay) => {
    const firstReading = day.readings[0];
    if (firstReading && firstReading.bookId) {
      router.push({
        pathname: '/(tabs)/bible',
        params: {
          bookId: firstReading.bookId.toString(),
          chapter: (firstReading.chapter || 1).toString(),
        },
      });
    }
  };

  // Set as current active plan for Home screen
  const handleSetActivePlan = () => {
    if (!planId) return;
    setItem(StorageKeys.ACTIVE_PLAN_ID, planId);
    setIsActivePlan(true);
    Alert.alert('Active Plan Set', `"${plan?.title}" is now set as your active reading plan.`);
  };

  // Delete Plan Confirmation
  const handleDeletePlan = () => {
    if (!planId || !plan) return;
    Alert.alert('Delete Plan', `Are you sure you want to delete "${plan.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await PlansRepo.deletePlan(db, planId);
            const activeId = getItem<string>(StorageKeys.ACTIVE_PLAN_ID, '');
            if (activeId === planId) {
              setItem(StorageKeys.ACTIVE_PLAN_ID, '');
            }
            router.back();
          } catch (e) {
            console.error('Failed to delete plan:', e);
            Alert.alert('Error', 'Failed to delete plan.');
          }
        },
      },
    ]);
  };

  if (isLoading || !plan) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const progressPercent = Math.round((completedDays.size / plan.durationDays) * 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: plan.title,
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleDeletePlan} style={styles.headerTrashBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Plan Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
        <View style={styles.summaryTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.planTitle, { color: colors.text }]}>{plan.title}</Text>
            <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
              {plan.description}
            </Text>
          </View>
          <View style={[styles.percentBadge, { backgroundColor: colors.glassHighlight }]}>
            <Text style={[styles.percentBadgeText, { color: colors.gold }]}>{progressPercent}%</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressRow}>
          <View style={[styles.progressBarBg, { backgroundColor: colors.glassInput }]}>
            <View
              style={[
                styles.progressBarFill,
                { backgroundColor: colors.success, width: `${progressPercent}%` },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {completedDays.size} of {plan.durationDays} Days Completed ({progressPercent}%)
          </Text>
        </View>

        {/* Set as Active Plan Button */}
        <View style={styles.activePlanRow}>
          {isActivePlan ? (
            <View style={[styles.activePlanBadge, { backgroundColor: colors.tintLight }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.tint} style={{ marginRight: 6 }} />
              <Text style={[styles.activePlanBadgeText, { color: colors.tint }]}>Active Reading Plan on Home</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.setActiveBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
              onPress={handleSetActivePlan}
              activeOpacity={0.7}
            >
              <Ionicons name="star-outline" size={15} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.setActiveBtnText, { color: colors.text }]}>Set as Active Plan on Home</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Section Header */}
      <View style={styles.scheduleHeader}>
        <Text style={[styles.scheduleTitle, { color: colors.textSecondary }]}>DAY BY DAY SCHEDULE</Text>
      </View>

      {/* Days Schedule Checklist */}
      <FlatList
        data={plan.days}
        keyExtractor={(item) => item.day.toString()}
        contentContainerStyle={styles.daysList}
        renderItem={({ item }) => {
          const isDone = completedDays.has(item.day);
          return (
            <View
              style={[
                styles.dayCard,
                {
                  backgroundColor: colors.glassCard,
                  borderColor: isDone ? colors.success : colors.border,
                },
              ]}
            >
              {/* Interactive Checkbox */}
              <TouchableOpacity
                style={styles.checkboxTouch}
                onPress={() => handleToggleDay(item.day)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={isDone ? colors.success : colors.textTertiary}
                />
              </TouchableOpacity>

              {/* Day Info & Readings */}
              <TouchableOpacity
                style={styles.dayInfo}
                onPress={() => handleOpenReading(item)}
                activeOpacity={0.7}
              >
                <View style={styles.dayTitleRow}>
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: isDone ? colors.textSecondary : colors.text },
                      isDone ? styles.strikethrough : null,
                    ]}
                  >
                    Day {item.day}
                  </Text>
                </View>
                <View style={styles.passagesRow}>
                  {item.readings.map((r, idx) => (
                    <Text key={idx} style={[styles.passageText, { color: colors.tint }]}>
                      📖 {r.passage}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>

              {/* Arrow to Bible Reader */}
              <TouchableOpacity
                style={styles.readArrow}
                onPress={() => handleOpenReading(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTrashBtn: {
    padding: 6,
    marginRight: 4,
  },
  summaryCard: {
    margin: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  percentBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressRow: {
    marginTop: 8,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activePlanRow: {
    paddingTop: 8,
  },
  activePlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  activePlanBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  setActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  setActiveBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scheduleTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  daysList: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  checkboxTouch: {
    paddingRight: 12,
  },
  dayInfo: {
    flex: 1,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '700',
  },
  strikethrough: {
    textDecorationLine: 'line-through' as const,
  },
  passagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  passageText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  readArrow: {
    paddingLeft: 8,
  },
});
