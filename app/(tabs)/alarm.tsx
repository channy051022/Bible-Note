import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { SpiritualAlarm } from '../../src/types/alarm';
import { AlarmService } from '../../src/services/alarmService';
import { ActiveAlarmModal } from '../../src/components/ActiveAlarmModal';
import { BUILT_IN_RINGTONES, SoundService } from '../../src/services/soundService';
import { getTodayVerseRef } from '../../src/constants/VerseOfTheDay';
import { BibleRepo } from '../../src/db/bibleRepo';
import { getItem, StorageKeys } from '../../src/utils/storage';
import { BibleVersion, Verse } from '../../src/types/bible';
import { BIBLE_BOOKS } from '../../src/constants/BibleBooks';

const SCRIPTURE_PRESETS = [
  {
    id: 'daily',
    name: '🌟 Daily Verse of the Day (Auto)',
    citation: 'Daily Scripture',
    text: 'God\'s fresh Word for your day.',
  },
  {
    id: 'bible_picker',
    name: '📖 Choose Any Verse from the Bible',
    citation: 'Bible Scripture',
    text: 'Select any Book, Chapter, and Verse from the Holy Scriptures.',
  },
  {
    id: 'custom',
    name: '✍️ Custom Scripture Text (Type Your Own)',
    citation: 'Custom Scripture',
    text: 'Type or paste your personal scripture and devotion note.',
  },
  {
    id: 'psalm23',
    name: '🕊️ Psalm 23:1 (The Lord is my Shepherd)',
    citation: 'Psalm 23:1',
    text: 'The Lord is my shepherd; I shall not want.',
    bookId: 19,
    chapter: 23,
    verse: 1,
  },
  {
    id: 'matthew6',
    name: '☀️ Matthew 6:33 (Seek First God\'s Kingdom)',
    citation: 'Matthew 6:33',
    text: 'Seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
    bookId: 40,
    chapter: 6,
    verse: 33,
  },
  {
    id: 'philippians4',
    name: '🙏 Philippians 4:6-7 (Peace of God)',
    citation: 'Philippians 4:6',
    text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
    bookId: 50,
    chapter: 4,
    verse: 6,
  },
  {
    id: 'proverbs3',
    name: '🧭 Proverbs 3:5-6 (Trust in the Lord)',
    citation: 'Proverbs 3:5',
    text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.',
    bookId: 20,
    chapter: 3,
    verse: 5,
  },
];

const DAYS_OF_WEEK = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

export default function AlarmScreen() {
  const db = useSQLiteContext();
  const { colors, isDark } = useTheme();

  const [alarms, setAlarms] = useState<SpiritualAlarm[]>([]);
  const [activeAlarmData, setActiveAlarmData] = useState<{
    visible: boolean;
    timeString: string;
    verseText: string;
    citation: string;
    bookId: number;
    chapter: number;
    ringtoneId?: string;
    customAudioUri?: string;
  }>({
    visible: false,
    timeString: '7:00 AM',
    verseText: 'The Lord is my shepherd; I shall not want.',
    citation: 'Psalm 23:1',
    bookId: 19,
    chapter: 23,
    ringtoneId: 'chimes',
  });

  // Modal for Add/Edit Alarm
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(7);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [alarmLabel, setAlarmLabel] = useState<string>('Morning Devotion');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('daily');
  const [customVerseCitation, setCustomVerseCitation] = useState<string>('John 3:16');
  const [customVerseText, setCustomVerseText] = useState<string>(
    'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
  );
  const [alarmDurationSeconds, setAlarmDurationSeconds] = useState<number>(30);
  const [selectedRingtoneId, setSelectedRingtoneId] = useState<string>('chimes');
  const [customAudioUri, setCustomAudioUri] = useState<string | undefined>(undefined);
  const [customAudioName, setCustomAudioName] = useState<string | undefined>(undefined);
  const [previewingRingtoneId, setPreviewingRingtoneId] = useState<string | null>(null);

  // Interactive Bible Scripture Picker state inside Alarm modal
  const [pickerBookId, setPickerBookId] = useState<number>(43); // John
  const [pickerChapter, setPickerChapter] = useState<number>(3);
  const [pickerVerse, setPickerVerse] = useState<number>(16);
  const [pickerVersesList, setPickerVersesList] = useState<Verse[]>([]);
  const [pickerLoading, setPickerLoading] = useState<boolean>(false);

  // Load verses whenever Bible picker selection changes
  useEffect(() => {
    async function loadPickerVerses() {
      if (selectedPresetId !== 'bible_picker') return;
      setPickerLoading(true);
      try {
        const v = getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
        const list = await BibleRepo.getChapterVerses(db, pickerBookId, pickerChapter, v);
        setPickerVersesList(list);
        const activeVerseObj = list.find((item) => item.verse === pickerVerse) || list[0];
        const book = BIBLE_BOOKS.find((b) => b.id === pickerBookId);
        if (activeVerseObj && book) {
          setCustomVerseCitation(`${book.name} ${pickerChapter}:${activeVerseObj.verse}`);
          setCustomVerseText(activeVerseObj.text);
        }
      } catch (e) {
        console.warn('Error loading verses for alarm picker:', e);
      } finally {
        setPickerLoading(false);
      }
    }
    loadPickerVerses();
  }, [selectedPresetId, pickerBookId, pickerChapter, pickerVerse, db]);

  // Load alarms on mount
  useEffect(() => {
    async function load() {
      const data = await AlarmService.getAlarms();
      setAlarms(data);
    }
    load();
  }, []);

  const handleToggleAlarm = async (id: string, isEnabled: boolean) => {
    const updated = await AlarmService.toggleAlarm(id, isEnabled);
    setAlarms(updated);
  };

  const handleDeleteAlarm = async (id: string) => {
    Alert.alert('Delete Alarm', 'Are you sure you want to remove this spiritual alarm?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await AlarmService.deleteAlarm(id);
          setAlarms(updated);
        },
      },
    ]);
  };

  // Trigger test ringing alarm
  const handleTestAlarm = async (alarm: SpiritualAlarm) => {
    let verseText = alarm.customText || 'The Lord is my shepherd; I shall not want.';
    let citation = alarm.customCitation || 'Psalm 23:1';
    let bookId = alarm.bookId || 19;
    let chapter = alarm.chapter || 23;

    if (alarm.verseSource === 'daily') {
      try {
        const ref = getTodayVerseRef();
        const v = getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
        const book = await BibleRepo.getBookById(db, ref.bookId);
        const verses = await BibleRepo.getChapterVerses(db, ref.bookId, ref.chapter, v);
        const found = verses.find((item) => item.verse === ref.verse) || verses[0];
        if (book && found) {
          verseText = found.text;
          citation = `${book.name} ${ref.chapter}:${found.verse}`;
          bookId = ref.bookId;
          chapter = ref.chapter;
        }
      } catch (e) {
        console.warn('Error fetching daily verse for alarm:', e);
      }
    }

    setActiveAlarmData({
      visible: true,
      timeString: AlarmService.formatTime(alarm.hour, alarm.minute),
      verseText,
      citation,
      bookId,
      chapter,
      ringtoneId: alarm.ringtoneId || 'chimes',
      customAudioUri: alarm.customAudioUri,
    });
  };

  const handlePreviewRingtone = async (ringtoneId: string, uri?: string) => {
    if (previewingRingtoneId === ringtoneId) {
      await SoundService.stopPreview();
      setPreviewingRingtoneId(null);
    } else {
      setPreviewingRingtoneId(ringtoneId);
      await SoundService.previewRingtone(ringtoneId, uri);
    }
  };

  const handlePickCustomMusic = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setCustomAudioUri(file.uri);
        setCustomAudioName(file.name);
        setSelectedRingtoneId('custom');
        // Preview the picked song
        handlePreviewRingtone('custom', file.uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to pick music file from phone storage.');
    }
  };

  const openAddModal = (alarmToEdit?: SpiritualAlarm) => {
    SoundService.stopPreview();
    setPreviewingRingtoneId(null);

    if (alarmToEdit) {
      setEditingAlarmId(alarmToEdit.id);
      const isPM = alarmToEdit.hour >= 12;
      const displayH = alarmToEdit.hour % 12 === 0 ? 12 : alarmToEdit.hour % 12;
      setSelectedHour(displayH);
      setSelectedMinute(alarmToEdit.minute);
      setSelectedPeriod(isPM ? 'PM' : 'AM');
      setAlarmLabel(alarmToEdit.label);
      setSelectedDays(alarmToEdit.days || [0, 1, 2, 3, 4, 5, 6]);
      setSelectedPresetId(
        alarmToEdit.verseSource === 'custom' && alarmToEdit.bookId ? 'bible_picker' : alarmToEdit.verseSource
      );
      setSelectedRingtoneId(alarmToEdit.ringtoneId || 'chimes');
      setCustomAudioUri(alarmToEdit.customAudioUri);
      setCustomAudioName(alarmToEdit.customAudioName);
      setCustomVerseCitation(alarmToEdit.customCitation || 'John 3:16');
      setCustomVerseText(
        alarmToEdit.customText ||
          'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
      );
      if (alarmToEdit.bookId) {
        setPickerBookId(alarmToEdit.bookId);
        setPickerChapter(alarmToEdit.chapter || 1);
        setPickerVerse(alarmToEdit.verse || 1);
      }
      setAlarmDurationSeconds(alarmToEdit.durationSeconds || 30);
    } else {
      setEditingAlarmId(null);
      setSelectedHour(7);
      setSelectedMinute(0);
      setSelectedPeriod('AM');
      setAlarmLabel('Morning Scripture & Prayer');
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setSelectedPresetId('daily');
      setSelectedRingtoneId('chimes');
      setCustomAudioUri(undefined);
      setCustomAudioName(undefined);
      setCustomVerseCitation('John 3:16');
      setCustomVerseText(
        'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
      );
      setPickerBookId(43);
      setPickerChapter(3);
      setPickerVerse(16);
      setAlarmDurationSeconds(30);
    }
    setModalVisible(true);
  };

  const handleSaveAlarm = async () => {
    SoundService.stopPreview();
    setPreviewingRingtoneId(null);

    // Compute 24-hour hour
    let hour24 = selectedHour % 12;
    if (selectedPeriod === 'PM') hour24 += 12;

    const preset = SCRIPTURE_PRESETS.find((p) => p.id === selectedPresetId) || SCRIPTURE_PRESETS[0];
    const isCustomOrPicker = selectedPresetId === 'custom' || selectedPresetId === 'bible_picker';
    const finalCitation = isCustomOrPicker
      ? customVerseCitation.trim() || 'Custom Scripture'
      : preset.id === 'daily'
      ? undefined
      : preset.citation;

    const finalText = isCustomOrPicker
      ? customVerseText.trim() || 'The Lord is my shepherd; I shall not want.'
      : preset.id === 'daily'
      ? undefined
      : preset.text;

    const newAlarm: SpiritualAlarm = {
      id: editingAlarmId || `alarm-${Date.now()}`,
      hour: hour24,
      minute: selectedMinute,
      label: alarmLabel.trim() || 'Spiritual Alarm',
      days: selectedDays,
      isEnabled: true,
      verseSource: isCustomOrPicker ? 'custom' : (preset.id as any),
      customCitation: finalCitation,
      customText: finalText,
      bookId: selectedPresetId === 'bible_picker' ? pickerBookId : preset.bookId,
      chapter: selectedPresetId === 'bible_picker' ? pickerChapter : preset.chapter,
      verse: selectedPresetId === 'bible_picker' ? pickerVerse : preset.verse,
      ringtoneId: selectedRingtoneId,
      customAudioUri: selectedRingtoneId === 'custom' ? customAudioUri : undefined,
      customAudioName: selectedRingtoneId === 'custom' ? customAudioName : undefined,
      durationSeconds: Math.min(60, Math.max(1, alarmDurationSeconds)),
    };

    const updated = await AlarmService.saveAlarm(newAlarm);
    setAlarms(updated);
    setModalVisible(false);
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Alarms List ScrollView */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <View style={[styles.bannerCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerIcon}>🔔</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.bannerTitle, { color: colors.text }]}>Spiritual Wake-Up Alarms</Text>
              <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>
                Wake up every morning greeted by God's Word & prayer.
              </Text>
            </View>
          </View>
        </View>

        {/* Alarms Header & Add Button */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>YOUR ALARMS</Text>
          <TouchableOpacity
            style={[styles.addAlarmBtn, { backgroundColor: colors.tint }]}
            onPress={() => openAddModal()}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.addAlarmBtnText}>Add Alarm</Text>
          </TouchableOpacity>
        </View>

        {/* Alarms Cards or Empty State */}
        {alarms.length === 0 ? (
          <View style={[styles.emptyAlarmsCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
            <Ionicons name="alarm-outline" size={44} color={colors.tint} style={{ marginBottom: 10 }} />
            <Text style={[styles.emptyAlarmsTitle, { color: colors.text }]}>No Spiritual Alarms Set</Text>
            <Text style={[styles.emptyAlarmsSubtitle, { color: colors.textSecondary }]}>
              Create your personal wake-up alarm with customized Scripture readings, devotion, and chimes.
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: colors.tint }]}
              onPress={() => openAddModal()}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyAddBtnText}>Add Spiritual Alarm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          alarms.map((alarm) => {
            const timeFormatted = AlarmService.formatTime(alarm.hour, alarm.minute);
            const daysFormatted = AlarmService.formatDays(alarm.days);
            const builtIn = BUILT_IN_RINGTONES.find((r) => r.id === alarm.ringtoneId);
            const ringtoneName = alarm.customAudioName ? `🎵 ${alarm.customAudioName}` : builtIn?.title || '🕊️ Heavenly Chimes';

            return (
              <TouchableOpacity
                key={alarm.id}
                style={[
                  styles.alarmCard,
                  {
                    backgroundColor: colors.glassCard,
                    borderColor: alarm.isEnabled ? colors.tint : colors.border,
                    opacity: alarm.isEnabled ? 1 : 0.65,
                  },
                ]}
                onPress={() => openAddModal(alarm)}
                activeOpacity={0.8}
              >
                {/* Top Row: Time & Switch */}
                <View style={styles.cardTopRow}>
                  <View>
                    <Text style={[styles.alarmTimeText, { color: colors.text }]}>{timeFormatted}</Text>
                    <Text style={[styles.alarmLabelText, { color: colors.tint }]}>{alarm.label}</Text>
                  </View>
                  <Switch
                    value={alarm.isEnabled}
                    onValueChange={(val) => handleToggleAlarm(alarm.id, val)}
                    trackColor={{ false: colors.border, true: colors.tint }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Middle: Days, Scripture & Ringtone */}
                <View style={styles.cardDetailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={{ marginRight: 5 }} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{daysFormatted}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="book-outline" size={14} color={colors.textSecondary} style={{ marginRight: 5 }} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {alarm.verseSource === 'daily' ? 'Daily Scripture' : alarm.customCitation || 'Psalm 23:1'}
                    </Text>
                  </View>
                </View>

                {/* Ringtone badge row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="musical-notes-outline" size={13} color={colors.tint} style={{ marginRight: 5 }} />
                  <Text style={{ fontSize: 12, color: colors.tint, fontWeight: '600' }} numberOfLines={1}>
                    {ringtoneName}
                  </Text>
                </View>

                {/* Bottom Row: Actions */}
                <View style={[styles.cardActionsRow, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.testAlarmBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                    onPress={() => handleTestAlarm(alarm)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="play" size={13} color={colors.tint} style={{ marginRight: 5 }} />
                    <Text style={[styles.testAlarmBtnText, { color: colors.tint }]}>Test / Preview Ringing</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteAlarmBtn}
                    onPress={() => handleDeleteAlarm(alarm.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Alarm Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Configure Spiritual Alarm</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* 1. Time Pickers */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary }]}>TIME</Text>
              <View style={styles.timePickerContainer}>
                {/* Hour */}
                <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                  {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.pickerItem,
                        selectedHour === h && { backgroundColor: colors.tintLight, borderColor: colors.tint },
                      ]}
                      onPress={() => setSelectedHour(h)}
                    >
                      <Text style={[styles.pickerItemText, { color: selectedHour === h ? colors.tint : colors.text }]}>
                        {h.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.timeColon, { color: colors.text }]}>:</Text>

                {/* Minute (00 to 59, 1-by-1) */}
                <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.pickerItem,
                        selectedMinute === m && { backgroundColor: colors.tintLight, borderColor: colors.tint },
                      ]}
                      onPress={() => setSelectedMinute(m)}
                    >
                      <Text style={[styles.pickerItemText, { color: selectedMinute === m ? colors.tint : colors.text }]}>
                        {m.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* AM/PM */}
                <View style={styles.periodColumn}>
                  {(['AM', 'PM'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.periodBtn,
                        selectedPeriod === p && { backgroundColor: colors.tint, borderColor: colors.tint },
                      ]}
                      onPress={() => setSelectedPeriod(p)}
                    >
                      <Text style={[styles.periodText, { color: selectedPeriod === p ? '#FFFFFF' : colors.text }]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 2. Ring Duration (1 to 60 seconds) */}
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                    ALARM DURATION (1–60 SECONDS)
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.tint }}>
                    {alarmDurationSeconds} sec
                  </Text>
                </View>

                <View style={styles.durationSelectorRow}>
                  <TouchableOpacity
                    onPress={() => setAlarmDurationSeconds((prev) => Math.max(1, prev - 1))}
                    style={[styles.durationStepBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.durationScroll}>
                    {[1, 5, 10, 15, 20, 30, 45, 60].map((sec) => (
                      <TouchableOpacity
                        key={sec}
                        onPress={() => setAlarmDurationSeconds(sec)}
                        style={[
                          styles.durationQuickPill,
                          {
                            backgroundColor: alarmDurationSeconds === sec ? colors.tint : colors.glassInput,
                            borderColor: alarmDurationSeconds === sec ? colors.tint : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.durationQuickPillText,
                            { color: alarmDurationSeconds === sec ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {sec}s
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TouchableOpacity
                    onPress={() => setAlarmDurationSeconds((prev) => Math.min(60, prev + 1))}
                    style={[styles.durationStepBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="add" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 3. Label Input */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>ALARM LABEL</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border }]}
                value={alarmLabel}
                onChangeText={setAlarmLabel}
                placeholder="e.g. Morning Scripture, Evening Prayer..."
                placeholderTextColor={colors.textTertiary}
              />

              {/* 4. Repeat Days */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>REPEAT DAYS</Text>
              <View style={styles.daysRow}>
                {DAYS_OF_WEEK.map((d) => {
                  const isDaySelected = selectedDays.includes(d.value);
                  return (
                    <TouchableOpacity
                      key={d.value}
                      style={[
                        styles.dayCircle,
                        {
                          backgroundColor: isDaySelected ? colors.tint : colors.glassInput,
                          borderColor: isDaySelected ? colors.tint : colors.border,
                        },
                      ]}
                      onPress={() => toggleDay(d.value)}
                    >
                      <Text style={[styles.dayCircleText, { color: isDaySelected ? '#FFFFFF' : colors.text }]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 5. Scripture Preset & Custom Verse */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                SCRIPTURE GREETING
              </Text>
              {SCRIPTURE_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetItem,
                      {
                        backgroundColor: isSelected ? colors.tintLight : colors.glassInput,
                        borderColor: isSelected ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedPresetId(preset.id)}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? colors.tint : colors.textSecondary}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.presetTitle, { color: isSelected ? colors.tint : colors.text }]}>
                        {preset.name}
                      </Text>
                      <Text style={[styles.presetQuote, { color: colors.textSecondary }]} numberOfLines={2}>
                        "{preset.text}"
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Interactive Bible Passage Picker (when 'bible_picker' is selected) */}
              {selectedPresetId === 'bible_picker' && (
                <View style={[styles.biblePickerContainer, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
                  {/* 1. Book Picker */}
                  <Text style={[styles.customFieldLabel, { color: colors.textSecondary }]}>1. SELECT BOOK</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScrollPills}>
                    {BIBLE_BOOKS.map((b) => {
                      const isSelected = pickerBookId === b.id;
                      return (
                        <TouchableOpacity
                          key={b.id}
                          onPress={() => {
                            setPickerBookId(b.id);
                            setPickerChapter(1);
                            setPickerVerse(1);
                          }}
                          style={[
                            styles.bookPill,
                            {
                              backgroundColor: isSelected ? colors.tint : colors.glassInput,
                              borderColor: isSelected ? colors.tint : colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.bookPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                            {b.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* 2. Chapter Picker */}
                  {(() => {
                    const activeBook = BIBLE_BOOKS.find((b) => b.id === pickerBookId) || BIBLE_BOOKS[0];
                    const chapterCount = activeBook.chapters_count || 1;
                    return (
                      <>
                        <Text style={[styles.customFieldLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                          2. SELECT CHAPTER (1 to {chapterCount})
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScrollPills}>
                          {Array.from({ length: chapterCount }, (_, i) => i + 1).map((ch) => {
                            const isSelected = pickerChapter === ch;
                            return (
                              <TouchableOpacity
                                key={ch}
                                onPress={() => {
                                  setPickerChapter(ch);
                                  setPickerVerse(1);
                                }}
                                style={[
                                  styles.numberPill,
                                  {
                                    backgroundColor: isSelected ? colors.tint : colors.glassInput,
                                    borderColor: isSelected ? colors.tint : colors.border,
                                  },
                                ]}
                              >
                                <Text style={[styles.numberPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                                  {ch}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </>
                    );
                  })()}

                  {/* 3. Verse Picker */}
                  <Text style={[styles.customFieldLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                    3. SELECT VERSE ({pickerVersesList.length} Verses)
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScrollPills}>
                    {pickerVersesList.length > 0
                      ? pickerVersesList.map((v) => {
                          const isSelected = pickerVerse === v.verse;
                          return (
                            <TouchableOpacity
                              key={v.verse}
                              onPress={() => setPickerVerse(v.verse)}
                              style={[
                                styles.numberPill,
                                {
                                  backgroundColor: isSelected ? colors.tint : colors.glassInput,
                                  borderColor: isSelected ? colors.tint : colors.border,
                                },
                              ]}
                            >
                              <Text style={[styles.numberPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                                {v.verse}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      : Array.from({ length: 30 }, (_, i) => i + 1).map((v) => (
                          <TouchableOpacity
                            key={v}
                            onPress={() => setPickerVerse(v)}
                            style={[
                              styles.numberPill,
                              {
                                backgroundColor: pickerVerse === v ? colors.tint : colors.glassInput,
                                borderColor: pickerVerse === v ? colors.tint : colors.border,
                              },
                            ]}
                          >
                            <Text style={[styles.numberPillText, { color: pickerVerse === v ? '#FFFFFF' : colors.text }]}>
                              {v}
                            </Text>
                          </TouchableOpacity>
                        ))}
                  </ScrollView>

                  {/* 4. Live Scripture Card Preview */}
                  <View style={[styles.pickedVersePreviewCard, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="book" size={14} color={colors.tint} style={{ marginRight: 6 }} />
                      <Text style={[styles.pickedVerseCitation, { color: colors.tint }]}>
                        {customVerseCitation}
                      </Text>
                    </View>
                    {pickerLoading ? (
                      <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                      <Text style={[styles.pickedVerseText, { color: colors.text }]}>
                        "{customVerseText}"
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Custom Scripture Input (Visible when 'custom' is selected) */}
              {selectedPresetId === 'custom' && (
                <View style={[styles.customVerseContainer, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
                  <Text style={[styles.customFieldLabel, { color: colors.textSecondary }]}>SCRIPTURE CITATION</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border, marginBottom: 10 }]}
                    value={customVerseCitation}
                    onChangeText={setCustomVerseCitation}
                    placeholder="e.g. Romans 8:28, Philippians 4:13..."
                    placeholderTextColor={colors.textTertiary}
                  />

                  <Text style={[styles.customFieldLabel, { color: colors.textSecondary }]}>CUSTOM VERSE TEXT</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      styles.customVerseTextInput,
                      { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border },
                    ]}
                    value={customVerseText}
                    onChangeText={setCustomVerseText}
                    placeholder="Type your personal Scripture verse text here..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              {/* 5. Ringtone & Music Selection */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                RINGTONE & MUSIC
              </Text>

              {/* Built-in Ringtones */}
              {BUILT_IN_RINGTONES.map((rt) => {
                const isSelected = selectedRingtoneId === rt.id;
                const isPlaying = previewingRingtoneId === rt.id;

                return (
                  <TouchableOpacity
                    key={rt.id}
                    style={[
                      styles.ringtoneItem,
                      {
                        backgroundColor: isSelected ? colors.tintLight : colors.glassInput,
                        borderColor: isSelected ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedRingtoneId(rt.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? colors.tint : colors.textSecondary}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ringtoneTitle, { color: isSelected ? colors.tint : colors.text }]}>
                        {rt.title}
                      </Text>
                      <Text style={[styles.ringtoneDesc, { color: colors.textSecondary }]}>
                        {rt.description}
                      </Text>
                    </View>

                    {/* Preview Play/Stop Button */}
                    <TouchableOpacity
                      style={[styles.previewAudioBtn, { backgroundColor: isPlaying ? colors.tint : colors.glassCard, borderColor: colors.border }]}
                      onPress={() => handlePreviewRingtone(rt.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={isPlaying ? 'stop' : 'play'}
                        size={14}
                        color={isPlaying ? '#FFFFFF' : colors.tint}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}

              {/* Custom Imported Music Item (if loaded) */}
              {customAudioUri && (
                <TouchableOpacity
                  style={[
                    styles.ringtoneItem,
                    {
                      backgroundColor: selectedRingtoneId === 'custom' ? colors.tintLight : colors.glassInput,
                      borderColor: selectedRingtoneId === 'custom' ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedRingtoneId('custom')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={selectedRingtoneId === 'custom' ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={selectedRingtoneId === 'custom' ? colors.tint : colors.textSecondary}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ringtoneTitle, { color: selectedRingtoneId === 'custom' ? colors.tint : colors.text }]}>
                      🎵 {customAudioName || 'Custom Imported Music'}
                    </Text>
                    <Text style={[styles.ringtoneDesc, { color: colors.textSecondary }]}>
                      Imported from your phone storage
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.previewAudioBtn,
                      {
                        backgroundColor: previewingRingtoneId === 'custom' ? colors.tint : colors.glassCard,
                        borderColor: colors.border,
                        marginRight: 6,
                      },
                    ]}
                    onPress={() => handlePreviewRingtone('custom', customAudioUri)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={previewingRingtoneId === 'custom' ? 'stop' : 'play'}
                      size={14}
                      color={previewingRingtoneId === 'custom' ? '#FFFFFF' : colors.tint}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      SoundService.stopPreview();
                      setCustomAudioUri(undefined);
                      setCustomAudioName(undefined);
                      if (selectedRingtoneId === 'custom') {
                        setSelectedRingtoneId('chimes');
                      }
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}

              {/* Import Custom Music Button */}
              <TouchableOpacity
                style={[styles.importMusicBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                onPress={handlePickCustomMusic}
                activeOpacity={0.7}
              >
                <Ionicons name="musical-notes-outline" size={18} color={colors.tint} style={{ marginRight: 8 }} />
                <Text style={[styles.importMusicBtnText, { color: colors.tint }]}>
                  {customAudioUri ? 'Choose Different Song from Phone' : 'Import Custom Music / Song from Phone'}
                </Text>
              </TouchableOpacity>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveAlarmBtn, { backgroundColor: colors.tint }]}
                onPress={handleSaveAlarm}
                activeOpacity={0.8}
              >
                <Text style={styles.saveAlarmBtnText}>Save Alarm</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Ringing Spiritual Alarm Modal */}
      <ActiveAlarmModal
        visible={activeAlarmData.visible}
        onDismiss={() => setActiveAlarmData((prev) => ({ ...prev, visible: false }))}
        timeString={activeAlarmData.timeString}
        verseText={activeAlarmData.verseText}
        citation={activeAlarmData.citation}
        bookId={activeAlarmData.bookId}
        chapter={activeAlarmData.chapter}
        ringtoneId={activeAlarmData.ringtoneId}
        customAudioUri={activeAlarmData.customAudioUri}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  bannerCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    fontSize: 32,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  bannerSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  addAlarmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  addAlarmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  alarmCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alarmTimeText: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alarmLabelText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  testAlarmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  testAlarmBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteAlarmBtn: {
    padding: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '88%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalScroll: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  pickerColumn: {
    width: 65,
    height: 120,
  },
  pickerItem: {
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    marginBottom: 4,
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '700',
  },
  timeColon: {
    fontSize: 24,
    fontWeight: '800',
    marginHorizontal: 10,
  },
  periodColumn: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  presetQuote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  saveAlarmBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 30,
  },
  saveAlarmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  ringtoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  ringtoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  ringtoneDesc: {
    fontSize: 11,
  },
  previewAudioBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importMusicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 10,
  },
  importMusicBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyAlarmsCard: {
    padding: 28,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  emptyAlarmsTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyAlarmsSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  durationSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationStepBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationScroll: {
    marginHorizontal: 8,
  },
  durationQuickPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  durationQuickPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customVerseContainer: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  customFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  customVerseTextInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  biblePickerContainer: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  pickerScrollPills: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 6,
  },
  bookPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  bookPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  numberPill: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  numberPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickedVersePreviewCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pickedVerseCitation: {
    fontSize: 13,
    fontWeight: '800',
  },
  pickedVerseText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
