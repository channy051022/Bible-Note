import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { PlansRepo } from '../../src/db/plansRepo';
import { useTheme } from '../../src/hooks/useTheme';
import readingPlansData from '../../src/data/readingPlans.json';
import { ReadingPlan, ReadingPlanDay } from '../../src/types/plan';

export default function ReadingPlansScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const plans = readingPlansData as ReadingPlan[];
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || 'gospels-30');
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const loadProgress = useCallback(async () => {
    if (!activePlan) return;
    try {
      const progress = await PlansRepo.getPlanProgress(db, activePlan.id);
      setCompletedDays(new Set(progress.map((p) => p.day)));
    } catch (err) {
      console.error('Failed to load plan progress:', err);
    }
  }, [db, activePlan]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const handleToggleDay = async (dayNumber: number) => {
    if (!activePlan) return;
    const isCompleted = await PlansRepo.toggleDayCompletion(db, activePlan.id, dayNumber);
    setCompletedDays((prev) => {
      const next = new Set(prev);
      if (isCompleted) next.add(dayNumber);
      else next.delete(dayNumber);
      return next;
    });
  };

  const handleOpenReading = (day: ReadingPlanDay) => {
    const firstReading = day.readings[0];
    if (firstReading && firstReading.bookId) {
      router.push({
        pathname: '/(tabs)' as any,
        params: {
          bookId: firstReading.bookId.toString(),
          chapter: (firstReading.chapter || 1).toString(),
        },
      });
    }
  };

  const progressPercent = activePlan
    ? Math.round((completedDays.size / activePlan.durationDays) * 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Plan Selector Pills */}
      <View style={[styles.plansHeader, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plansScroll}>
          {plans.map((p) => {
            const isSelected = p.id === selectedPlanId;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedPlanId(p.id)}
                style={[
                  styles.planTab,
                  {
                    backgroundColor: isSelected ? colors.tint : colors.secondaryBackground,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.planTabText,
                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {p.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Plan Summary Card */}
      {activePlan && (
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.planTitle, { color: colors.text }]}>{activePlan.title}</Text>
          <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
            {activePlan.description}
          </Text>

          <View style={styles.progressRow}>
            <View style={[styles.progressBarBg, { backgroundColor: colors.secondaryBackground }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: colors.success, width: `${progressPercent}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {completedDays.size}/{activePlan.durationDays} Days ({progressPercent}%)
            </Text>
          </View>
        </View>
      )}

      {/* Days Schedule Checklist */}
      <FlatList
        data={activePlan?.days || []}
        keyExtractor={(item) => item.day.toString()}
        contentContainerStyle={styles.daysList}
        renderItem={({ item }) => {
          const isDone = completedDays.has(item.day);
          return (
            <View
              style={[
                styles.dayCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isDone ? colors.success : colors.border,
                },
              ]}
            >
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
                    Day {item.day}: {item.title}
                  </Text>
                </View>
                <View style={styles.passagesRow}>
                  {item.readings.map((r, idx) => (
                    <Text key={idx} style={[styles.passageText, { color: colors.tint }]}>
                      {r.passage}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.readArrow}
                onPress={() => handleOpenReading(item)}
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
  plansHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  plansScroll: {
    flexDirection: 'row',
  },
  planTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 8,
  },
  planTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  progressRow: {
    marginTop: 4,
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
  daysList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  checkboxTouch: {
    paddingRight: 10,
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
    fontWeight: '600',
  },
  strikethrough: {
    textDecorationLine: 'line-through' as const,
  },
  passagesRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  passageText: {
    fontSize: 13,
    fontWeight: '600',
  },
  readArrow: {
    paddingLeft: 8,
  },
});
