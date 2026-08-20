import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { PlansRepo } from '../../src/db/plansRepo';
import { BIBLE_BOOKS } from '../../src/constants/BibleBooks';
import {
  POPULAR_PLAN_SCOPES,
  generatePlanSchedule,
  getChaptersForScope,
  PlanScopeConfig,
  PlanScopeType,
} from '../../src/utils/planGenerator';
import { setItem, StorageKeys } from '../../src/utils/storage';

type SelectionMode = 'quick' | 'custom_books' | 'custom_range';
type BookFilterTab = 'all' | 'ot' | 'nt' | 'selected';

export default function CreatePlanScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  // Mode Selection: 'quick' (preset), 'custom_books' (multi-select), or 'custom_range'
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('quick');
  const [selectedQuickScopeId, setSelectedQuickScopeId] = useState<string>('gospels');

  // Custom Books Picker Modal State
  const [isBookPickerOpen, setIsBookPickerOpen] = useState<boolean>(false);
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([40, 41, 42, 43]); // Gospels by default
  const [bookFilterTab, setBookFilterTab] = useState<BookFilterTab>('all');
  const [bookSearchQuery, setBookSearchQuery] = useState<string>('');

  // Custom Range State
  const [rangeStartBookId, setRangeStartBookId] = useState<number>(1); // Genesis
  const [rangeStartChapter, setRangeStartChapter] = useState<number>(1);
  const [rangeEndBookId, setRangeEndBookId] = useState<number>(43); // John
  const [rangeEndChapter, setRangeEndChapter] = useState<number>(21);
  const [rangePickerModalType, setRangePickerModalType] = useState<'start' | 'end' | null>(null);

  // Duration State
  const [durationDays, setDurationDays] = useState<number>(30);
  const [isCustomDaysActive, setIsCustomDaysActive] = useState<boolean>(false);
  const [customDaysText, setCustomDaysText] = useState<string>('30');

  // Plan Details State
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [showGoalInput, setShowGoalInput] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isFullScheduleModalOpen, setIsFullScheduleModalOpen] = useState<boolean>(false);

  const durationOptions = [
    { label: '14 Days', days: 14 },
    { label: '30 Days', days: 30, badge: 'Popular' },
    { label: '60 Days', days: 60 },
    { label: '90 Days', days: 90 },
    { label: '1 Year', days: 365 },
  ];

  // Derive active scope config
  const scopeConfig: PlanScopeConfig = useMemo(() => {
    if (selectionMode === 'custom_books') {
      return {
        type: 'custom_books',
        selectedBookIds: selectedBookIds.length > 0 ? selectedBookIds : [43],
        durationDays,
      };
    }
    if (selectionMode === 'custom_range') {
      return {
        type: 'custom_range',
        startBookId: rangeStartBookId,
        startChapter: rangeStartChapter,
        endBookId: rangeEndBookId,
        endChapter: rangeEndChapter,
        durationDays,
      };
    }
    return {
      type: selectedQuickScopeId as PlanScopeType,
      durationDays,
    };
  }, [
    selectionMode,
    selectedBookIds,
    rangeStartBookId,
    rangeStartChapter,
    rangeEndBookId,
    rangeEndChapter,
    selectedQuickScopeId,
    durationDays,
  ]);

  // Compute chapters in current scope
  const chapterList = useMemo(() => getChaptersForScope(scopeConfig), [scopeConfig]);
  const totalChapters = chapterList.length;
  const chaptersPerDay = durationDays > 0 ? (totalChapters / durationDays).toFixed(1) : '1';

  // Smart Auto-Generated Title
  const defaultTitle = useMemo(() => {
    if (selectionMode === 'custom_books') {
      if (selectedBookIds.length === 0) return 'My Bible Reading Plan';
      if (selectedBookIds.length === 66) return `Whole Bible in ${durationDays} Days`;
      if (selectedBookIds.length === 39 && selectedBookIds.every((id) => id <= 39)) return `Old Testament in ${durationDays} Days`;
      if (selectedBookIds.length === 27 && selectedBookIds.every((id) => id >= 40)) return `New Testament in ${durationDays} Days`;
      if (selectedBookIds.length <= 3) {
        const names = selectedBookIds.map((id) => BIBLE_BOOKS.find((b) => b.id === id)?.name || '').filter(Boolean);
        return `${names.join(', ')} in ${durationDays} Days`;
      }
      return `${selectedBookIds.length} Books in ${durationDays} Days`;
    }
    if (selectionMode === 'custom_range') {
      const startB = BIBLE_BOOKS.find((b) => b.id === rangeStartBookId);
      const endB = BIBLE_BOOKS.find((b) => b.id === rangeEndBookId);
      return `${startB?.name || ''} to ${endB?.name || ''} in ${durationDays} Days`;
    }
    const preset = POPULAR_PLAN_SCOPES.find((p) => p.id === selectedQuickScopeId);
    return `${preset?.title || 'Reading Plan'} in ${durationDays} Days`;
  }, [selectionMode, selectedBookIds, rangeStartBookId, rangeEndBookId, selectedQuickScopeId, durationDays]);

  // Generate Plan Schedule
  const generatedPlan = useMemo(() => {
    return generatePlanSchedule(
      customTitle.trim() || defaultTitle,
      customDescription.trim(),
      scopeConfig
    );
  }, [customTitle, defaultTitle, customDescription, scopeConfig]);

  // Handle Book Selection
  const toggleBook = (bookId: number) => {
    if (selectedBookIds.includes(bookId)) {
      setSelectedBookIds(selectedBookIds.filter((id) => id !== bookId));
    } else {
      setSelectedBookIds([...selectedBookIds, bookId].sort((a, b) => a - b));
    }
  };

  // Filtered books for picker modal
  const modalBooksList = useMemo(() => {
    let list = BIBLE_BOOKS;
    if (bookFilterTab === 'ot') list = list.filter((b) => b.testament === 'OT');
    if (bookFilterTab === 'nt') list = list.filter((b) => b.testament === 'NT');
    if (bookFilterTab === 'selected') list = list.filter((b) => selectedBookIds.includes(b.id));

    if (bookSearchQuery.trim()) {
      const q = bookSearchQuery.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.abbreviation.toLowerCase().includes(q) ||
          b.aliases.some((a) => a.toLowerCase().includes(q))
      );
    }
    return list;
  }, [bookFilterTab, selectedBookIds, bookSearchQuery]);

  // Selected Books Description Preview
  const selectedBooksSummaryText = useMemo(() => {
    if (selectedBookIds.length === 0) return 'Tap to select books';
    if (selectedBookIds.length === 66) return 'Whole Bible (66 Books • 1,189 ch)';
    if (selectedBookIds.length <= 4) {
      return selectedBookIds.map((id) => BIBLE_BOOKS.find((b) => b.id === id)?.name).filter(Boolean).join(', ');
    }
    return `${selectedBookIds.length} Books selected (${totalChapters} chapters)`;
  }, [selectedBookIds, totalChapters]);

  // Handle Create Plan
  const handleSavePlan = async () => {
    if (totalChapters === 0) {
      Alert.alert('No Chapters Selected', 'Please choose at least one book to read.');
      return;
    }

    try {
      setIsCreating(true);
      const newPlan = generatePlanSchedule(
        customTitle.trim() || defaultTitle,
        customDescription.trim(),
        scopeConfig
      );

      await PlansRepo.createPlan(db, newPlan);
      setItem(StorageKeys.ACTIVE_PLAN_ID, newPlan.id);

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          title: 'Create Reading Plan',
          headerShown: true,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* SECTION 1: WHAT TO READ */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>What do you want to read?</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Pick a popular journey or customize your own books
          </Text>
        </View>

        {/* 1. Quick Presets Grid (2x2) */}
        <View style={styles.presetsGrid}>
          {POPULAR_PLAN_SCOPES.slice(0, 4).map((p) => {
            const isSelected = selectionMode === 'quick' && selectedQuickScopeId === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.presetGridCard,
                  {
                    backgroundColor: isSelected ? colors.tintLight : colors.glassCard,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectionMode('quick');
                  setSelectedQuickScopeId(p.id);
                  setDurationDays(p.defaultDays);
                  setIsCustomDaysActive(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.presetCardTop}>
                  <Text
                    style={[
                      styles.presetCardTitle,
                      { color: isSelected ? colors.tint : colors.text, fontWeight: isSelected ? '700' : '600' },
                    ]}
                    numberOfLines={1}
                  >
                    {p.title}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={18} color={colors.tint} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={16} color={colors.textTertiary} />
                  )}
                </View>
                <Text style={[styles.presetCardChapters, { color: colors.textSecondary }]}>
                  {p.totalChapters} Chapters
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Custom Scope Selectors (2 clean action cards) */}
        <View style={styles.customOptionsContainer}>
          {/* Option A: Choose Specific Books */}
          <TouchableOpacity
            style={[
              styles.customOptionCard,
              {
                backgroundColor: selectionMode === 'custom_books' ? colors.tintLight : colors.glassCard,
                borderColor: selectionMode === 'custom_books' ? colors.tint : colors.border,
              },
            ]}
            onPress={() => {
              setSelectionMode('custom_books');
              setIsBookPickerOpen(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIconCircle, { backgroundColor: colors.glassInput }]}>
              <Ionicons name="library-outline" size={20} color={selectionMode === 'custom_books' ? colors.tint : colors.gold} />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.customOptionTitle, { color: colors.text }]}>Choose Specific Books</Text>
                {selectionMode === 'custom_books' && (
                  <View style={[styles.activeMiniBadge, { backgroundColor: colors.tint }]}>
                    <Text style={styles.activeMiniBadgeText}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.customOptionSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {selectionMode === 'custom_books' ? selectedBooksSummaryText : 'Select individual Old & New Testament books'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Option B: Custom Chapter Range */}
          <TouchableOpacity
            style={[
              styles.customOptionCard,
              {
                backgroundColor: selectionMode === 'custom_range' ? colors.tintLight : colors.glassCard,
                borderColor: selectionMode === 'custom_range' ? colors.tint : colors.border,
              },
            ]}
            onPress={() => setSelectionMode('custom_range')}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIconCircle, { backgroundColor: colors.glassInput }]}>
              <Ionicons name="swap-horizontal-outline" size={20} color={selectionMode === 'custom_range' ? colors.tint : colors.gold} />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.customOptionTitle, { color: colors.text }]}>Chapter Range</Text>
                {selectionMode === 'custom_range' && (
                  <View style={[styles.activeMiniBadge, { backgroundColor: colors.tint }]}>
                    <Text style={styles.activeMiniBadgeText}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.customOptionSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {selectionMode === 'custom_range'
                  ? `${BIBLE_BOOKS.find((b) => b.id === rangeStartBookId)?.name} ${rangeStartChapter} to ${BIBLE_BOOKS.find((b) => b.id === rangeEndBookId)?.name} ${rangeEndChapter}`
                  : 'Start from one book/chapter to another'}
              </Text>
            </View>
            <Ionicons name={selectionMode === 'custom_range' ? 'checkmark-circle' : 'chevron-forward'} size={18} color={selectionMode === 'custom_range' ? colors.tint : colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Inline Range Selectors if in Range Mode */}
        {selectionMode === 'custom_range' && (
          <View style={[styles.rangeInlineCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
            <View style={styles.rangeRow}>
              {/* Start Book */}
              <TouchableOpacity
                style={[styles.rangePickerBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                onPress={() => setRangePickerModalType('start')}
              >
                <Text style={[styles.rangePickerLabel, { color: colors.textSecondary }]}>FROM</Text>
                <Text style={[styles.rangePickerValue, { color: colors.text }]} numberOfLines={1}>
                  {BIBLE_BOOKS.find((b) => b.id === rangeStartBookId)?.name}
                </Text>
              </TouchableOpacity>

              {/* Start Ch */}
              <View style={[styles.rangeChInputBox, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                <Text style={[styles.rangePickerLabel, { color: colors.textSecondary }]}>CH</Text>
                <TextInput
                  style={[styles.rangeChInput, { color: colors.text }]}
                  value={rangeStartChapter.toString()}
                  onChangeText={(val) => {
                    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                    const max = BIBLE_BOOKS.find((b) => b.id === rangeStartBookId)?.chapters_count || 1;
                    setRangeStartChapter(isNaN(num) ? 1 : Math.max(1, Math.min(max, num)));
                  }}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={[styles.rangeRow, { marginTop: 10 }]}>
              {/* End Book */}
              <TouchableOpacity
                style={[styles.rangePickerBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                onPress={() => setRangePickerModalType('end')}
              >
                <Text style={[styles.rangePickerLabel, { color: colors.textSecondary }]}>TO</Text>
                <Text style={[styles.rangePickerValue, { color: colors.text }]} numberOfLines={1}>
                  {BIBLE_BOOKS.find((b) => b.id === rangeEndBookId)?.name}
                </Text>
              </TouchableOpacity>

              {/* End Ch */}
              <View style={[styles.rangeChInputBox, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                <Text style={[styles.rangePickerLabel, { color: colors.textSecondary }]}>CH</Text>
                <TextInput
                  style={[styles.rangeChInput, { color: colors.text }]}
                  value={rangeEndChapter.toString()}
                  onChangeText={(val) => {
                    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                    const max = BIBLE_BOOKS.find((b) => b.id === rangeEndBookId)?.chapters_count || 1;
                    setRangeEndChapter(isNaN(num) ? 1 : Math.max(1, Math.min(max, num)));
                  }}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        )}

        {/* SECTION 2: DURATION */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Target Duration</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            How many days would you like this reading journey to take?
          </Text>
        </View>

        <View style={styles.durationPillsRow}>
          {durationOptions.map((opt) => {
            const isSelected = durationDays === opt.days && !isCustomDaysActive;
            return (
              <TouchableOpacity
                key={opt.days}
                style={[
                  styles.durationPill,
                  {
                    backgroundColor: isSelected ? colors.tint : colors.glassCard,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => {
                  setDurationDays(opt.days);
                  setCustomDaysText(opt.days.toString());
                  setIsCustomDaysActive(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.durationPillText,
                    { color: isSelected ? '#FFFFFF' : colors.text, fontWeight: isSelected ? '700' : '600' },
                  ]}
                >
                  {opt.label}
                </Text>
                {opt.badge && !isSelected && (
                  <View style={[styles.durationBadge, { backgroundColor: colors.glassHighlight }]}>
                    <Text style={[styles.durationBadgeText, { color: colors.gold }]}>{opt.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Custom Duration Button */}
          <TouchableOpacity
            style={[
              styles.durationPill,
              {
                backgroundColor: isCustomDaysActive ? colors.tint : colors.glassCard,
                borderColor: isCustomDaysActive ? colors.tint : colors.border,
              },
            ]}
            onPress={() => setIsCustomDaysActive(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.durationPillText,
                { color: isCustomDaysActive ? '#FFFFFF' : colors.text, fontWeight: isCustomDaysActive ? '700' : '600' },
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>

        {/* Custom Days Input if Active */}
        {isCustomDaysActive && (
          <View style={[styles.customDaysRow, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
            <Text style={[styles.customDaysLabel, { color: colors.text }]}>Enter Days (1–365):</Text>
            <View style={[styles.customDaysInputWrap, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
              <TextInput
                style={[styles.customDaysInput, { color: colors.text }]}
                value={customDaysText}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, '');
                  setCustomDaysText(cleaned);
                  const num = parseInt(cleaned, 10);
                  if (!isNaN(num) && num >= 1 && num <= 365) {
                    setDurationDays(num);
                  }
                }}
                keyboardType="number-pad"
                maxLength={3}
                autoFocus
              />
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 4 }}>days</Text>
            </View>
          </View>
        )}

        {/* Reading Pace Banner */}
        <View style={[styles.paceBanner, { backgroundColor: colors.glassHighlight, borderColor: colors.gold }]}>
          <Ionicons name="sparkles" size={16} color={colors.gold} style={{ marginRight: 8 }} />
          <Text style={[styles.paceBannerText, { color: colors.text }]}>
            <Text style={{ fontWeight: '700' }}>{totalChapters} Chapters</Text> across{' '}
            <Text style={{ fontWeight: '700' }}>{durationDays} Days</Text> (~{chaptersPerDay} chapters / day)
          </Text>
        </View>

        {/* SECTION 3: PLAN NAME & GOAL */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Plan Name</Text>
        </View>

        <View style={[styles.planNameCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          <TextInput
            style={[styles.titleInput, { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border }]}
            placeholder={defaultTitle}
            placeholderTextColor={colors.textTertiary}
            value={customTitle}
            onChangeText={setCustomTitle}
          />

          {!showGoalInput ? (
            <TouchableOpacity onPress={() => setShowGoalInput(true)} style={styles.addGoalBtn}>
              <Ionicons name="add-circle-outline" size={15} color={colors.tint} style={{ marginRight: 4 }} />
              <Text style={[styles.addGoalBtnText, { color: colors.tint }]}>Add personal prayer or study goal</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ marginTop: 10 }}>
              <TextInput
                style={[styles.goalInput, { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border }]}
                placeholder="Write your study intention or goal..."
                placeholderTextColor={colors.textTertiary}
                value={customDescription}
                onChangeText={setCustomDescription}
                multiline
                numberOfLines={2}
              />
            </View>
          )}
        </View>

        {/* SECTION 4: SCHEDULE PREVIEW */}
        <View style={[styles.previewHeaderRow, { marginTop: 20 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule Preview</Text>
          <TouchableOpacity onPress={() => setIsFullScheduleModalOpen(true)}>
            <Text style={[styles.viewAllScheduleText, { color: colors.tint }]}>View All ({generatedPlan.days.length} Days)</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.previewCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          {generatedPlan.days.slice(0, 3).map((d) => (
            <View key={d.day} style={[styles.previewDayItem, { borderBottomColor: colors.border }]}>
              <View style={[styles.previewDayNumBadge, { backgroundColor: colors.glassInput }]}>
                <Text style={[styles.previewDayNumText, { color: colors.textSecondary }]}>Day {d.day}</Text>
              </View>
              <Text style={[styles.previewDayPassage, { color: colors.tint }]} numberOfLines={1}>
                {d.title}
              </Text>
            </View>
          ))}
          {generatedPlan.days.length > 3 && (
            <TouchableOpacity onPress={() => setIsFullScheduleModalOpen(true)} style={styles.expandPreviewRow}>
              <Text style={[styles.expandPreviewText, { color: colors.tint }]}>
                + {generatedPlan.days.length - 3} more daily readings scheduled
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Big Create Action Button */}
        <TouchableOpacity
          style={[styles.createMainBtn, { backgroundColor: colors.tint }]}
          onPress={handleSavePlan}
          disabled={isCreating || totalChapters === 0}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.createMainBtnText}>
            {isCreating ? 'Creating Plan...' : 'Create Reading Plan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL 1: Dedicated Multi-Book Selection Sheet */}
      <Modal visible={isBookPickerOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContentSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {/* Modal Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Select Bible Books</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                  {selectedBookIds.length} Books Selected ({totalChapters} Chapters)
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.sheetDoneBtn, { backgroundColor: colors.tint }]}
                onPress={() => setIsBookPickerOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions (OT, NT, All, Clear) */}
            <View style={styles.sheetQuickActions}>
              <TouchableOpacity
                style={[styles.sheetActionChip, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                onPress={() => setSelectedBookIds(BIBLE_BOOKS.filter((b) => b.testament === 'OT').map((b) => b.id))}
              >
                <Text style={[styles.sheetActionChipText, { color: colors.tint }]}>All OT (39)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetActionChip, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                onPress={() => setSelectedBookIds(BIBLE_BOOKS.filter((b) => b.testament === 'NT').map((b) => b.id))}
              >
                <Text style={[styles.sheetActionChipText, { color: colors.tint }]}>All NT (27)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetActionChip, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                onPress={() => setSelectedBookIds(BIBLE_BOOKS.map((b) => b.id))}
              >
                <Text style={[styles.sheetActionChipText, { color: colors.tint }]}>All 66</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetActionChip, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                onPress={() => setSelectedBookIds([])}
              >
                <Text style={[styles.sheetActionChipText, { color: colors.danger }]}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={[styles.sheetSearchBox, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.sheetSearchInput, { color: colors.text }]}
                placeholder="Search books..."
                placeholderTextColor={colors.textTertiary}
                value={bookSearchQuery}
                onChangeText={setBookSearchQuery}
              />
              {bookSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setBookSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.sheetFilterTabs}>
              {(['all', 'ot', 'nt', 'selected'] as BookFilterTab[]).map((tab) => {
                const isTabActive = bookFilterTab === tab;
                const label =
                  tab === 'all' ? 'All (66)' : tab === 'ot' ? 'OT (39)' : tab === 'nt' ? 'NT (27)' : `Selected (${selectedBookIds.length})`;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.sheetFilterTab,
                      {
                        backgroundColor: isTabActive ? colors.tintLight : colors.glassInput,
                        borderColor: isTabActive ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => setBookFilterTab(tab)}
                  >
                    <Text
                      style={[
                        styles.sheetFilterTabText,
                        { color: isTabActive ? colors.tint : colors.textSecondary, fontWeight: isTabActive ? '700' : '500' },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Book List Grid */}
            <FlatList
              data={modalBooksList}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              numColumns={2}
              columnWrapperStyle={{ gap: 8 }}
              renderItem={({ item }) => {
                const isSelected = selectedBookIds.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalBookChip,
                      {
                        backgroundColor: isSelected ? colors.tintLight : colors.glassCard,
                        borderColor: isSelected ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => toggleBook(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={isSelected ? colors.tint : colors.textTertiary}
                      style={{ marginRight: 6 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.modalBookChipText,
                          { color: isSelected ? colors.tint : colors.text, fontWeight: isSelected ? '700' : '500' },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textTertiary }}>
                        {item.chapters_count} ch ({item.testament})
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Range Book Selector */}
      <Modal visible={rangePickerModalType !== null} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContentSheet, { backgroundColor: colors.background, borderColor: colors.border, maxHeight: '70%' }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Select {rangePickerModalType === 'start' ? 'Starting' : 'Ending'} Book
              </Text>
              <TouchableOpacity onPress={() => setRangePickerModalType(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={BIBLE_BOOKS}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const isSelected =
                  rangePickerModalType === 'start' ? rangeStartBookId === item.id : rangeEndBookId === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.rangeBookItem,
                      {
                        backgroundColor: isSelected ? colors.tintLight : colors.glassCard,
                        borderColor: isSelected ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => {
                      if (rangePickerModalType === 'start') {
                        setRangeStartBookId(item.id);
                        setRangeStartChapter(1);
                      } else {
                        setRangeEndBookId(item.id);
                        setRangeEndChapter(item.chapters_count);
                      }
                      setRangePickerModalType(null);
                    }}
                  >
                    <Text style={[styles.rangeBookItemName, { color: isSelected ? colors.tint : colors.text, fontWeight: isSelected ? '700' : '500' }]}>
                      {item.name} ({item.chapters_count} ch)
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color={colors.tint} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Full Schedule Preview Sheet */}
      <Modal visible={isFullScheduleModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContentSheet, { backgroundColor: colors.background, borderColor: colors.border, maxHeight: '80%' }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Full Schedule ({generatedPlan.days.length} Days)</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                  {totalChapters} Chapters • {durationDays} Days Plan
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsFullScheduleModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={generatedPlan.days}
              keyExtractor={(item) => item.day.toString()}
              contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
              renderItem={({ item }) => (
                <View style={[styles.fullScheduleDayRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.previewDayNumBadge, { backgroundColor: colors.glassInput }]}>
                    <Text style={[styles.previewDayNumText, { color: colors.textSecondary }]}>Day {item.day}</Text>
                  </View>
                  <Text style={[styles.previewDayPassage, { color: colors.tint }]}>{item.title}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetGridCard: {
    width: '48.5%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  presetCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  presetCardTitle: {
    fontSize: 13,
    flex: 1,
    marginRight: 4,
  },
  presetCardChapters: {
    fontSize: 11,
  },
  customOptionsContainer: {
    gap: 8,
    marginTop: 2,
  },
  customOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  customOptionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  activeMiniBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeMiniBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  rangeInlineCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rangePickerBtn: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  rangePickerLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  rangePickerValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  rangeChInputBox: {
    width: 65,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  rangeChInput: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
    padding: 0,
  },
  durationPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  durationPillText: {
    fontSize: 13,
  },
  durationBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  durationBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  customDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  customDaysLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  customDaysInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  customDaysInput: {
    fontSize: 14,
    fontWeight: '700',
    width: 36,
    textAlign: 'center',
  },
  paceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  paceBannerText: {
    fontSize: 12,
  },
  planNameCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  titleInput: {
    fontSize: 15,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 2,
  },
  addGoalBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalInput: {
    fontSize: 13,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAllScheduleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  previewDayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  previewDayNumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginRight: 8,
  },
  previewDayNumText: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewDayPassage: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  expandPreviewRow: {
    paddingTop: 8,
    alignItems: 'center',
  },
  expandPreviewText: {
    fontSize: 12,
    fontWeight: '700',
  },
  createMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  createMainBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContentSheet: {
    maxHeight: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sheetDoneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
  },
  sheetDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sheetQuickActions: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetActionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  sheetActionChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sheetSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  sheetSearchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  sheetFilterTabs: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  sheetFilterTab: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  sheetFilterTabText: {
    fontSize: 11,
  },
  modalBookChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  modalBookChipText: {
    fontSize: 13,
  },
  rangeBookItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  rangeBookItemName: {
    fontSize: 14,
  },
  fullScheduleDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
