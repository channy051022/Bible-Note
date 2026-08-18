import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { PlansRepo } from '../../src/db/plansRepo';
import { BIBLE_BOOKS } from '../../src/constants/BibleBooks';
import { PLAN_PRESETS, generatePlanSchedule, PlanScopeConfig } from '../../src/utils/planGenerator';
import { setItem, StorageKeys } from '../../src/utils/storage';

export default function CreatePlanScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const [selectedPreset, setSelectedPreset] = useState<string>('gospels');
  const [selectedBookId, setSelectedBookId] = useState<number>(43); // John
  const [durationDays, setDurationDays] = useState<number>(30);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Common duration options
  const durationOptions = [7, 14, 21, 30, 60, 90, 365];

  // Derive active scope config
  const scopeConfig: PlanScopeConfig = useMemo(() => {
    if (selectedPreset === 'single_book') {
      return {
        type: 'single_book',
        bookId: selectedBookId,
        durationDays,
      };
    }
    return {
      type: selectedPreset as any,
      durationDays,
    };
  }, [selectedPreset, selectedBookId, durationDays]);

  // Derive suggested title
  const defaultTitle = useMemo(() => {
    if (selectedPreset === 'single_book') {
      const book = BIBLE_BOOKS.find((b) => b.id === selectedBookId);
      return `${book?.name || 'Book'} in ${durationDays} Days`;
    }
    const preset = PLAN_PRESETS.find((p) => p.id === selectedPreset);
    return `${preset?.title || 'Reading Plan'} in ${durationDays} Days`;
  }, [selectedPreset, selectedBookId, durationDays]);

  // Preview generated plan
  const previewPlan = useMemo(() => {
    return generatePlanSchedule(
      customTitle.trim() || defaultTitle,
      customDescription.trim(),
      scopeConfig
    );
  }, [customTitle, defaultTitle, customDescription, scopeConfig]);

  // Handle Create Plan
  const handleSavePlan = async () => {
    try {
      setIsCreating(true);
      const newPlan = generatePlanSchedule(
        customTitle.trim() || defaultTitle,
        customDescription.trim(),
        scopeConfig
      );

      await PlansRepo.createPlan(db, newPlan);

      // Automatically set as active plan
      setItem(StorageKeys.ACTIVE_PLAN_ID, newPlan.id);

      // Redirect directly to the day-by-day plan detail page
      router.replace({
        pathname: '/plan/[id]',
        params: { id: newPlan.id },
      });
    } catch (e) {
      console.error('Failed to create plan:', e);
      Alert.alert('Error', 'Failed to create reading plan.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Create Reading Plan',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleSavePlan} disabled={isCreating} style={styles.createHeaderBtn}>
              <Text style={[styles.createHeaderBtnText, { color: colors.tint }]}>
                {isCreating ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Choose Scripture Scope */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CHOOSE SCRIPTURE TO READ</Text>
        <View style={styles.presetsList}>
          {PLAN_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetCard,
                  {
                    backgroundColor: isSelected ? colors.tintLight : colors.glassCard,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedPreset(preset.id);
                  setDurationDays(preset.defaultDays);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.presetLeft}>
                  <Text
                    style={[
                      styles.presetTitle,
                      {
                        color: isSelected ? colors.tint : colors.text,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {preset.title}
                  </Text>
                  <Text style={[styles.presetDesc, { color: colors.textSecondary }]}>
                    {preset.description}
                  </Text>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.tint} />
                ) : (
                  <Ionicons name="radio-button-off" size={20} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* If Single Book Selected: Book Selector Horizontal Carousel */}
        {selectedPreset === 'single_book' && (
          <View style={styles.bookSelectorSection}>
            <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>SELECT SPECIFIC BOOK</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.booksScroll}>
              {BIBLE_BOOKS.map((b) => {
                const isBookSelected = selectedBookId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.bookPill,
                      {
                        backgroundColor: isBookSelected ? colors.tint : colors.glassInput,
                        borderColor: isBookSelected ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedBookId(b.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.bookPillText,
                        {
                          color: isBookSelected ? '#FFFFFF' : colors.text,
                          fontWeight: isBookSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {b.name} ({b.chapters_count} ch)
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 2. Choose Duration */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>
          TARGET DURATION
        </Text>
        <View style={styles.durationPillsRow}>
          {durationOptions.map((days) => {
            const isDurationSelected = durationDays === days;
            return (
              <TouchableOpacity
                key={days}
                style={[
                  styles.durationPill,
                  {
                    backgroundColor: isDurationSelected ? colors.tint : colors.glassInput,
                    borderColor: isDurationSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setDurationDays(days)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.durationPillText,
                    {
                      color: isDurationSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isDurationSelected ? '700' : '600',
                    },
                  ]}
                >
                  {days} Days
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. Custom Title & Description (Optional) */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>
          PLAN DETAILS (OPTIONAL)
        </Text>
        <View style={[styles.cardInputGroup, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Plan Title</Text>
          <TextInput
            style={[styles.textInput, { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border }]}
            placeholder={defaultTitle}
            placeholderTextColor={colors.textTertiary}
            value={customTitle}
            onChangeText={setCustomTitle}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>
            Description / Motivation
          </Text>
          <TextInput
            style={[styles.textInputMulti, { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border }]}
            placeholder="e.g. Morning devotion to grow closer to God..."
            placeholderTextColor={colors.textTertiary}
            value={customDescription}
            onChangeText={setCustomDescription}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* 4. Live Schedule Preview */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>
          SCHEDULE PREVIEW ({previewPlan.days.length} DAYS)
        </Text>
        <View style={[styles.previewCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          {previewPlan.days.slice(0, 4).map((d) => (
            <View key={d.day} style={[styles.previewDayRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.previewDayNum, { color: colors.textSecondary }]}>Day {d.day}</Text>
              <Text style={[styles.previewDayPassage, { color: colors.tint }]}>{d.title}</Text>
            </View>
          ))}
          {previewPlan.days.length > 4 && (
            <Text style={[styles.previewMoreText, { color: colors.textTertiary }]}>
              + {previewPlan.days.length - 4} more daily readings scheduled
            </Text>
          )}
        </View>

        {/* Bottom Create Button */}
        <TouchableOpacity
          style={[styles.createPlanMainBtn, { backgroundColor: colors.tint }]}
          onPress={handleSavePlan}
          disabled={isCreating}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.createPlanMainBtnText}>
            {isCreating ? 'Generating Plan...' : 'Create & Start Plan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },
  createHeaderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  createHeaderBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  presetsList: {
    marginBottom: 10,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  presetLeft: {
    flex: 1,
    marginRight: 12,
  },
  presetTitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  presetDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  bookSelectorSection: {
    marginTop: 4,
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  booksScroll: {
    flexDirection: 'row',
  },
  bookPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  bookPillText: {
    fontSize: 13,
  },
  durationPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  durationPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  durationPillText: {
    fontSize: 13,
  },
  cardInputGroup: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    fontSize: 15,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInputMulti: {
    fontSize: 14,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 50,
  },
  previewCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
  },
  previewDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  previewDayNum: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewDayPassage: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewMoreText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  createPlanMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  createPlanMainBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
