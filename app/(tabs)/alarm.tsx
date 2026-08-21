import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { SpiritualAlarm } from '../../src/types/alarm';
import { AlarmService } from '../../src/services/alarmService';
import { ActiveAlarmModal } from '../../src/components/ActiveAlarmModal';
import { BUILT_IN_RINGTONES, SoundService } from '../../src/services/soundService';
import { getTodayVerseRef } from '../../src/constants/VerseOfTheDay';
import { BibleRepo } from '../../src/db/bibleRepo';
import { getItem, setItem, StorageKeys } from '../../src/utils/storage';
import { BibleVersion, Verse } from '../../src/types/bible';
import { BIBLE_BOOKS } from '../../src/constants/BibleBooks';

export interface CustomAlarmVerse {
  id: string;
  citation: string;
  text: string;
  bookId?: number;
  chapter?: number;
  verse?: number;
  isCustomUserAdded?: boolean;
}

const DEFAULT_SAVED_VERSES: CustomAlarmVerse[] = [
  {
    id: 'psalm23',
    citation: 'Psalm 23:1',
    text: 'The Lord is my shepherd; I shall not want.',
    bookId: 19,
    chapter: 23,
    verse: 1,
  },
  {
    id: 'matthew6',
    citation: 'Matthew 6:33',
    text: 'Seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
    bookId: 40,
    chapter: 6,
    verse: 33,
  },
  {
    id: 'philippians4',
    citation: 'Philippians 4:6-7',
    text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
    bookId: 50,
    chapter: 4,
    verse: 6,
  },
  {
    id: 'proverbs3',
    citation: 'Proverbs 3:5-6',
    text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.',
    bookId: 20,
    chapter: 3,
    verse: 5,
  },
  {
    id: 'john316',
    citation: 'John 3:16',
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    bookId: 43,
    chapter: 3,
    verse: 16,
  },
  {
    id: 'isaiah40',
    citation: 'Isaiah 40:31',
    text: 'They that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles.',
    bookId: 23,
    chapter: 40,
    verse: 31,
  },
];

const CUSTOM_VERSES_STORAGE_KEY = 'CUSTOM_ALARM_VERSES';

const DAYS_OF_WEEK = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const TUMBLER_ITEM_HEIGHT = 44;

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
    customAudioStartOffset?: number;
  }>({
    visible: false,
    timeString: '7:00 AM',
    verseText: 'The Lord is my shepherd; I shall not want.',
    citation: 'Psalm 23:1',
    bookId: 19,
    chapter: 23,
    ringtoneId: 'classic_bell',
    customAudioStartOffset: 0,
  });

  // Saved / User-added Custom Verses
  const [savedVerses, setSavedVerses] = useState<CustomAlarmVerse[]>(() => {
    return getItem<CustomAlarmVerse[]>(CUSTOM_VERSES_STORAGE_KEY, DEFAULT_SAVED_VERSES);
  });

  // Modal for Add/Edit Alarm
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(7);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [alarmLabel, setAlarmLabel] = useState<string>('Morning Devotion');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // Dropdown states to minimize scrolling
  const [isScriptureDropdownOpen, setIsScriptureDropdownOpen] = useState<boolean>(false);
  const [isRingtoneDropdownOpen, setIsRingtoneDropdownOpen] = useState<boolean>(false);

  // Scripture selection state
  const [selectedPresetId, setSelectedPresetId] = useState<string>('daily');
  const [customVerseCitation, setCustomVerseCitation] = useState<string>('John 3:16');
  const [customVerseText, setCustomVerseText] = useState<string>(
    'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
  );
  const [selectedRingtoneId, setSelectedRingtoneId] = useState<string>('classic_bell');
  const [customAudioUri, setCustomAudioUri] = useState<string | undefined>(undefined);
  const [customAudioName, setCustomAudioName] = useState<string | undefined>(undefined);
  const [customAudioDuration, setCustomAudioDuration] = useState<number | undefined>(undefined);
  const [customAudioStartOffset, setCustomAudioStartOffset] = useState<number>(0);
  const [previewingRingtoneId, setPreviewingRingtoneId] = useState<string | null>(null);

  // Audio Trimmer Sub-Modal state
  const [trimmerModalVisible, setTrimmerModalVisible] = useState<boolean>(false);
  const [tempTrimSeconds, setTempTrimSeconds] = useState<number>(0);
  const [isTrimmerPlaying, setIsTrimmerPlaying] = useState<boolean>(false);
  const [trimmerPlaybackSeconds, setTrimmerPlaybackSeconds] = useState<number>(0);

  // Interactive Bible Scripture Picker state
  const [pickerBookId, setPickerBookId] = useState<number>(43); // John
  const [pickerChapter, setPickerChapter] = useState<number>(3);
  const [pickerVerse, setPickerVerse] = useState<number>(16);
  const [pickerVersesList, setPickerVersesList] = useState<Verse[]>([]);
  const [pickerLoading, setPickerLoading] = useState<boolean>(false);

  // Add New Verse Sub-Modal state
  const [addVerseModalVisible, setAddVerseModalVisible] = useState<boolean>(false);
  const [addVerseMode, setAddVerseMode] = useState<'bible' | 'custom'>('bible');
  const [newCustomCitation, setNewCustomCitation] = useState<string>('');
  const [newCustomText, setNewCustomText] = useState<string>('');
  const [newPickerBookId, setNewPickerBookId] = useState<number>(43);
  const [newPickerChapter, setNewPickerChapter] = useState<number>(3);
  const [newPickerVerse, setNewPickerVerse] = useState<number>(16);
  const [newPickerVersesList, setNewPickerVersesList] = useState<Verse[]>([]);
  const [newPickerLoading, setNewPickerLoading] = useState<boolean>(false);

  // Scroll references for Tumbler Time Picker
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Scroll Tumblers to current values when modal opens
  useEffect(() => {
    if (modalVisible) {
      const timer = setTimeout(() => {
        const hIdx = Math.max(0, selectedHour - 1);
        hourScrollRef.current?.scrollTo({
          y: hIdx * TUMBLER_ITEM_HEIGHT,
          animated: false,
        });
        minuteScrollRef.current?.scrollTo({
          y: selectedMinute * TUMBLER_ITEM_HEIGHT,
          animated: false,
        });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [modalVisible]);

  // Load verses for main alarm picker
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

  // Load verses for Add New Verse modal picker
  useEffect(() => {
    async function loadNewPickerVerses() {
      if (!addVerseModalVisible || addVerseMode !== 'bible') return;
      setNewPickerLoading(true);
      try {
        const v = getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
        const list = await BibleRepo.getChapterVerses(db, newPickerBookId, newPickerChapter, v);
        setNewPickerVersesList(list);
        const activeVerseObj = list.find((item) => item.verse === newPickerVerse) || list[0];
        const book = BIBLE_BOOKS.find((b) => b.id === newPickerBookId);
        if (activeVerseObj && book) {
          setNewCustomCitation(`${book.name} ${newPickerChapter}:${activeVerseObj.verse}`);
          setNewCustomText(activeVerseObj.text);
        }
      } catch (e) {
        console.warn('Error loading verses for new verse picker:', e);
      } finally {
        setNewPickerLoading(false);
      }
    }
    loadNewPickerVerses();
  }, [addVerseModalVisible, addVerseMode, newPickerBookId, newPickerChapter, newPickerVerse, db]);

  // Load alarms and saved custom verses on mount and on tab focus
  useFocusEffect(
    useCallback(() => {
      async function load() {
        const data = await AlarmService.getAlarms();
        setAlarms(data);
        const verses = getItem<CustomAlarmVerse[]>(CUSTOM_VERSES_STORAGE_KEY, DEFAULT_SAVED_VERSES);
        setSavedVerses(verses);
      }
      load();
    }, [])
  );

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

    Alert.alert(
      'Test Spiritual Alarm ⏰',
      'Choose how you would like to test this alarm:',
      [
        {
          text: '📱 Test on Lock Screen (5s Delay)',
          onPress: async () => {
            try {
              await AlarmService.scheduleTestAlarm(5, {
                ...alarm,
                customText: verseText,
                customCitation: citation,
                bookId,
                chapter,
              });
              Alert.alert(
                'Alarm Scheduled in 5 Seconds! 🔔',
                '👉 Lock your phone screen or close the app right now!\n\nIn 5 seconds, your phone will ring and display the Scripture notification on your lock screen.'
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to schedule lock screen test alarm. Please ensure notification permissions are granted.');
            }
          },
        },
        {
          text: '🔊 Ring Instantly (In-App)',
          onPress: () => {
            setActiveAlarmData({
              visible: true,
              timeString: AlarmService.formatTime(alarm.hour, alarm.minute),
              verseText,
              citation,
              bookId,
              chapter,
              ringtoneId: alarm.ringtoneId || 'classic_bell',
              customAudioUri: alarm.customAudioUri,
              customAudioStartOffset: alarm.customAudioStartOffset || 0,
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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

  const formatMinutesSeconds = (sec: number = 0) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const openTrimmerModal = () => {
    SoundService.stopPreview();
    setPreviewingRingtoneId(null);
    setTempTrimSeconds(customAudioStartOffset || 0);
    setTrimmerPlaybackSeconds(customAudioStartOffset || 0);
    setIsTrimmerPlaying(false);
    setTrimmerModalVisible(true);
  };

  const closeTrimmerModal = () => {
    SoundService.stopPreview();
    setIsTrimmerPlaying(false);
    setTrimmerModalVisible(false);
  };

  const handleSaveTrim = () => {
    SoundService.stopPreview();
    setIsTrimmerPlaying(false);
    setCustomAudioStartOffset(tempTrimSeconds);
    setTrimmerModalVisible(false);
    Alert.alert(
      'Cut Point Saved! ✂️',
      `Your alarm will begin playing from ${formatMinutesSeconds(tempTrimSeconds)} and loop from there.`
    );
  };

  const handleToggleTrimPlay = async () => {
    if (isTrimmerPlaying) {
      await SoundService.stopPreview();
      setIsTrimmerPlaying(false);
    } else {
      setIsTrimmerPlaying(true);
      setTrimmerPlaybackSeconds(tempTrimSeconds);
      await SoundService.previewRingtone(
        'custom',
        customAudioUri,
        tempTrimSeconds,
        (status: any) => {
          if (status.isLoaded) {
            if (status.positionMillis !== undefined) {
              setTrimmerPlaybackSeconds(Math.floor(status.positionMillis / 1000));
            }
            if (status.didJustFinish) {
              setIsTrimmerPlaying(false);
              setTrimmerPlaybackSeconds(tempTrimSeconds);
            }
          }
        }
      );
    }
  };

  const adjustTrimSeconds = (delta: number) => {
    SoundService.stopPreview();
    setIsTrimmerPlaying(false);
    const maxLen = Math.max(10, (customAudioDuration || 180) - 3);
    const next = Math.max(0, Math.min(maxLen, tempTrimSeconds + delta));
    setTempTrimSeconds(next);
    setTrimmerPlaybackSeconds(next);
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
        setCustomAudioStartOffset(0);

        // Extract song duration so looping waves are spaced precisely according to song length
        let detectedDuration = 180;
        try {
          const { sound, status } = await Audio.Sound.createAsync(
            { uri: file.uri },
            { shouldPlay: false }
          );
          if (status.isLoaded && status.durationMillis) {
            const durSec = Math.round(status.durationMillis / 1000);
            detectedDuration = durSec;
            setCustomAudioDuration(durSec);
          }
          await sound.unloadAsync();
        } catch (durErr) {
          console.warn('Could not read custom audio duration:', durErr);
        }

        // Open trimmer modal immediately so user can choose starting point if desired
        setTempTrimSeconds(0);
        setTrimmerPlaybackSeconds(0);
        setIsTrimmerPlaying(false);
        setTrimmerModalVisible(true);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to pick music file from phone storage.');
    }
  };

  const openAddModal = (alarmToEdit?: SpiritualAlarm) => {
    SoundService.stopPreview();
    setPreviewingRingtoneId(null);
    setIsScriptureDropdownOpen(false);
    setIsRingtoneDropdownOpen(false);

    if (alarmToEdit) {
      setEditingAlarmId(alarmToEdit.id);
      const isPM = alarmToEdit.hour >= 12;
      const displayH = alarmToEdit.hour % 12 === 0 ? 12 : alarmToEdit.hour % 12;
      setSelectedHour(displayH);
      setSelectedMinute(alarmToEdit.minute);
      setSelectedPeriod(isPM ? 'PM' : 'AM');
      setAlarmLabel(alarmToEdit.label);
      setSelectedDays(alarmToEdit.days || [0, 1, 2, 3, 4, 5, 6]);

      // Match preset or saved verse
      if (alarmToEdit.verseSource === 'daily') {
        setSelectedPresetId('daily');
      } else if (alarmToEdit.customCitation) {
        const match = savedVerses.find((v) => v.citation === alarmToEdit.customCitation);
        if (match) {
          setSelectedPresetId(match.id);
        } else if (alarmToEdit.bookId) {
          setSelectedPresetId('bible_picker');
        } else {
          setSelectedPresetId('custom_manual');
        }
      } else {
        setSelectedPresetId('daily');
      }

      setSelectedRingtoneId(alarmToEdit.ringtoneId || 'classic_bell');
      setCustomAudioUri(alarmToEdit.customAudioUri);
      setCustomAudioName(alarmToEdit.customAudioName);
      setCustomAudioDuration(alarmToEdit.customAudioDuration);
      setCustomAudioStartOffset(alarmToEdit.customAudioStartOffset || 0);
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
    } else {
      setEditingAlarmId(null);
      setSelectedHour(7);
      setSelectedMinute(0);
      setSelectedPeriod('AM');
      setAlarmLabel('Morning Scripture & Prayer');
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setSelectedPresetId('daily');
      setSelectedRingtoneId('classic_bell');
      setCustomAudioUri(undefined);
      setCustomAudioName(undefined);
      setCustomAudioDuration(undefined);
      setCustomAudioStartOffset(0);
      setCustomVerseCitation('John 3:16');
      setCustomVerseText(
        'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
      );
      setPickerBookId(43);
      setPickerChapter(3);
      setPickerVerse(16);
    }
    setModalVisible(true);
  };

  const handleSaveAlarm = async () => {
    SoundService.stopPreview();
    setPreviewingRingtoneId(null);

    // Compute 24-hour hour
    let hour24 = selectedHour % 12;
    if (selectedPeriod === 'PM') hour24 += 12;

    const isDaily = selectedPresetId === 'daily';
    const isPicker = selectedPresetId === 'bible_picker';
    const isManual = selectedPresetId === 'custom_manual';
    const matchedSaved = savedVerses.find((v) => v.id === selectedPresetId);

    let finalCitation: string | undefined = undefined;
    let finalText: string | undefined = undefined;
    let bookId: number | undefined = undefined;
    let chapter: number | undefined = undefined;
    let verse: number | undefined = undefined;

    if (isDaily) {
      finalCitation = undefined;
      finalText = undefined;
    } else if (matchedSaved) {
      finalCitation = matchedSaved.citation;
      finalText = matchedSaved.text;
      bookId = matchedSaved.bookId;
      chapter = matchedSaved.chapter;
      verse = matchedSaved.verse;
    } else if (isPicker) {
      finalCitation = customVerseCitation.trim() || 'Bible Scripture';
      finalText = customVerseText.trim() || 'God is our refuge and strength.';
      bookId = pickerBookId;
      chapter = pickerChapter;
      verse = pickerVerse;
    } else if (isManual) {
      finalCitation = customVerseCitation.trim() || 'Custom Scripture';
      finalText = customVerseText.trim() || 'The Lord is my shepherd; I shall not want.';
    }

    const newAlarm: SpiritualAlarm = {
      id: editingAlarmId || `alarm-${Date.now()}`,
      hour: hour24,
      minute: selectedMinute,
      label: alarmLabel.trim() || 'Spiritual Alarm',
      days: selectedDays,
      isEnabled: true,
      verseSource: isDaily ? 'daily' : 'custom',
      customCitation: finalCitation,
      customText: finalText,
      bookId: isDaily ? undefined : bookId,
      chapter: isDaily ? undefined : chapter,
      verse: isDaily ? undefined : verse,
      ringtoneId: selectedRingtoneId,
      customAudioUri: selectedRingtoneId === 'custom' ? customAudioUri : undefined,
      customAudioName: selectedRingtoneId === 'custom' ? customAudioName : undefined,
      customAudioDuration: selectedRingtoneId === 'custom' ? customAudioDuration : undefined,
      customAudioStartOffset: selectedRingtoneId === 'custom' ? customAudioStartOffset : 0,
    };

    const updated = await AlarmService.saveAlarm(newAlarm);
    setAlarms(updated);
    setModalVisible(false);

    const formattedTime = AlarmService.formatTime(hour24, selectedMinute);
    Alert.alert(
      'Spiritual Alarm Saved! 🔔',
      `Your alarm is set for ${formattedTime} (${AlarmService.formatDays(selectedDays)}).\n\nWhen the time arrives, your phone will ring and display God's Word on your screen!`
    );
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  // Scroll time handlers
  const onHourScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / TUMBLER_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(HOURS.length - 1, index));
    setSelectedHour(HOURS[clamped]);
  };

  const onMinuteScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / TUMBLER_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(MINUTES.length - 1, index));
    setSelectedMinute(MINUTES[clamped]);
  };

  const stepHour = (delta: number) => {
    let next = selectedHour + delta;
    if (next < 1) next = 12;
    if (next > 12) next = 1;
    setSelectedHour(next);
    hourScrollRef.current?.scrollTo({
      y: (next - 1) * TUMBLER_ITEM_HEIGHT,
      animated: true,
    });
  };

  const stepMinute = (delta: number) => {
    let next = (selectedMinute + delta + 60) % 60;
    setSelectedMinute(next);
    minuteScrollRef.current?.scrollTo({
      y: next * TUMBLER_ITEM_HEIGHT,
      animated: true,
    });
  };

  const setQuickMinute = (m: number) => {
    setSelectedMinute(m);
    minuteScrollRef.current?.scrollTo({
      y: m * TUMBLER_ITEM_HEIGHT,
      animated: true,
    });
  };

  // Add / Delete Custom Verses
  const openAddNewVerseModal = () => {
    setNewPickerBookId(43);
    setNewPickerChapter(3);
    setNewPickerVerse(16);
    setNewCustomCitation('John 3:16');
    setNewCustomText(
      'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
    );
    setAddVerseMode('bible');
    setAddVerseModalVisible(true);
  };

  const handleSaveNewCustomVerse = () => {
    if (!newCustomCitation.trim() || !newCustomText.trim()) {
      Alert.alert('Incomplete Verse', 'Please provide a citation and verse text.');
      return;
    }

    const newVerseItem: CustomAlarmVerse = {
      id: `user-verse-${Date.now()}`,
      citation: newCustomCitation.trim(),
      text: newCustomText.trim(),
      bookId: addVerseMode === 'bible' ? newPickerBookId : undefined,
      chapter: addVerseMode === 'bible' ? newPickerChapter : undefined,
      verse: addVerseMode === 'bible' ? newPickerVerse : undefined,
      isCustomUserAdded: true,
    };

    const updated = [newVerseItem, ...savedVerses];
    setSavedVerses(updated);
    setItem(CUSTOM_VERSES_STORAGE_KEY, updated);

    // Automatically select this new verse for the alarm
    setSelectedPresetId(newVerseItem.id);
    setCustomVerseCitation(newVerseItem.citation);
    setCustomVerseText(newVerseItem.text);
    if (newVerseItem.bookId) {
      setPickerBookId(newVerseItem.bookId);
      setPickerChapter(newVerseItem.chapter || 1);
      setPickerVerse(newVerseItem.verse || 1);
    }

    setAddVerseModalVisible(false);
    setIsScriptureDropdownOpen(false);
    Alert.alert('Verse Added! ✨', `"${newVerseItem.citation}" has been added and selected for your alarm.`);
  };

  const handleDeleteCustomVerse = (id: string, citation: string) => {
    Alert.alert('Remove Verse', `Are you sure you want to remove "${citation}" from your saved verses list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = savedVerses.filter((v) => v.id !== id);
          setSavedVerses(updated);
          setItem(CUSTOM_VERSES_STORAGE_KEY, updated);
          if (selectedPresetId === id) {
            setSelectedPresetId('daily');
          }
        },
      },
    ]);
  };

  // Derive active scripture title & preview for dropdown header
  const getSelectedScriptureSummary = () => {
    if (selectedPresetId === 'daily') {
      return {
        title: '🌟 Daily Verse of the Day (Auto)',
        quote: "Rotates automatically with God's fresh Word each day.",
      };
    }
    if (selectedPresetId === 'bible_picker') {
      return {
        title: `📖 ${customVerseCitation || 'Choose from Bible'}`,
        quote: customVerseText || 'Select any Book, Chapter, and Verse.',
      };
    }
    if (selectedPresetId === 'custom_manual') {
      return {
        title: `✍️ ${customVerseCitation || 'Custom Scripture'}`,
        quote: customVerseText || 'Personal custom scripture.',
      };
    }
    const matched = savedVerses.find((v) => v.id === selectedPresetId);
    if (matched) {
      return {
        title: `🕊️ ${matched.citation}`,
        quote: matched.text,
      };
    }
    return {
      title: '🌟 Daily Verse of the Day (Auto)',
      quote: "Rotates automatically with God's fresh Word each day.",
    };
  };

  // Derive active ringtone title & description for dropdown header
  const getSelectedRingtoneSummary = () => {
    if (selectedRingtoneId === 'custom') {
      return {
        title: `🎵 ${customAudioName || 'Custom Imported Music'}`,
        desc: 'Imported from your phone storage',
      };
    }
    const builtIn = BUILT_IN_RINGTONES.find((r) => r.id === selectedRingtoneId);
    return {
      title: builtIn?.title || '🔔 Energetic Wake Chimes',
      desc: builtIn?.description || 'Bright ascending morning bell melody',
    };
  };

  const scriptureSummary = getSelectedScriptureSummary();
  const ringtoneSummary = getSelectedRingtoneSummary();

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
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(229, 169, 60, 0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' }}>
            <Ionicons name="flash" size={12} color="#E5A93C" style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#E5A93C' }}>
              Screen-Off & Background Wake-Up Enabled
            </Text>
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
            const ringtoneName = alarm.customAudioName
              ? `🎵 ${alarm.customAudioName}${
                  alarm.customAudioStartOffset && alarm.customAudioStartOffset > 0
                    ? ` (Starts at ${formatMinutesSeconds(alarm.customAudioStartOffset)})`
                    : ''
                }`
              : builtIn?.title || '🕊️ Heavenly Chimes';

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
                  <View style={[styles.detailItem, { flex: 1 }]}>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.testAlarmBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                      onPress={() => handleTestAlarm(alarm)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="play" size={13} color={colors.tint} style={{ marginRight: 5 }} />
                      <Text style={[styles.testAlarmBtnText, { color: colors.tint }]}>Test Ringing</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.testAlarmBtn, { backgroundColor: colors.tintLight, borderColor: colors.tint }]}
                      onPress={() => openAddModal(alarm)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil" size={13} color={colors.tint} style={{ marginRight: 5 }} />
                      <Text style={[styles.testAlarmBtnText, { color: colors.tint }]}>Edit</Text>
                    </TouchableOpacity>
                  </View>

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
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingAlarmId ? '✏️ Edit Spiritual Alarm' : '🔔 Create Spiritual Alarm'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
              {/* 1. Scrollable + Tap Tumbler Time Picker */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                  SET ALARM TIME
                </Text>
                <Text style={{ fontSize: 11, color: colors.tint, fontWeight: '600' }}>
                  Scroll or tap arrows
                </Text>
              </View>

              <View style={[styles.tumblerWheelContainer, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
                {/* Hour Column */}
                <View style={styles.tumblerColumn}>
                  {/* Up Arrow */}
                  <TouchableOpacity
                    onPress={() => stepHour(-1)}
                    style={[styles.tumblerArrowBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                    activeOpacity={0.6}
                    hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
                  >
                    <Ionicons name="chevron-up" size={18} color={colors.tint} />
                  </TouchableOpacity>

                  {/* Scrollable Hours Window */}
                  <View style={styles.wheelWindow}>
                    {/* Fixed Center Highlight Frame */}
                    <View
                      pointerEvents="none"
                      style={[
                        styles.tumblerCenterHighlight,
                        { backgroundColor: colors.tintLight, borderColor: colors.tint },
                      ]}
                    />

                    <ScrollView
                      ref={hourScrollRef}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={TUMBLER_ITEM_HEIGHT}
                      decelerationRate="fast"
                      onMomentumScrollEnd={onHourScrollEnd}
                      onScrollEndDrag={onHourScrollEnd}
                      style={styles.wheelScrollView}
                    >
                      {/* Top Padding Spacer */}
                      <View style={{ height: TUMBLER_ITEM_HEIGHT }} />

                      {HOURS.map((h) => {
                        const isSelected = selectedHour === h;
                        return (
                          <TouchableOpacity
                            key={h}
                            style={styles.wheelItem}
                            onPress={() => {
                              setSelectedHour(h);
                              hourScrollRef.current?.scrollTo({
                                y: (h - 1) * TUMBLER_ITEM_HEIGHT,
                                animated: true,
                              });
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                isSelected ? styles.wheelTextSelected : styles.wheelTextDimmed,
                                { color: isSelected ? colors.tint : colors.textSecondary },
                              ]}
                            >
                              {h.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}

                      {/* Bottom Padding Spacer */}
                      <View style={{ height: TUMBLER_ITEM_HEIGHT }} />
                    </ScrollView>
                  </View>

                  {/* Down Arrow */}
                  <TouchableOpacity
                    onPress={() => stepHour(1)}
                    style={[styles.tumblerArrowBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                    activeOpacity={0.6}
                    hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
                  >
                    <Ionicons name="chevron-down" size={18} color={colors.tint} />
                  </TouchableOpacity>
                </View>

                {/* Center Colon */}
                <Text style={[styles.tumblerColon, { color: colors.tint }]}>:</Text>

                {/* Minute Column */}
                <View style={styles.tumblerColumn}>
                  {/* Up Arrow */}
                  <TouchableOpacity
                    onPress={() => stepMinute(-1)}
                    style={[styles.tumblerArrowBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                    activeOpacity={0.6}
                    hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
                  >
                    <Ionicons name="chevron-up" size={18} color={colors.tint} />
                  </TouchableOpacity>

                  {/* Scrollable Minutes Window */}
                  <View style={styles.wheelWindow}>
                    {/* Fixed Center Highlight Frame */}
                    <View
                      pointerEvents="none"
                      style={[
                        styles.tumblerCenterHighlight,
                        { backgroundColor: colors.tintLight, borderColor: colors.tint },
                      ]}
                    />

                    <ScrollView
                      ref={minuteScrollRef}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={TUMBLER_ITEM_HEIGHT}
                      decelerationRate="fast"
                      onMomentumScrollEnd={onMinuteScrollEnd}
                      onScrollEndDrag={onMinuteScrollEnd}
                      style={styles.wheelScrollView}
                    >
                      {/* Top Padding Spacer */}
                      <View style={{ height: TUMBLER_ITEM_HEIGHT }} />

                      {MINUTES.map((m) => {
                        const isSelected = selectedMinute === m;
                        return (
                          <TouchableOpacity
                            key={m}
                            style={styles.wheelItem}
                            onPress={() => {
                              setSelectedMinute(m);
                              minuteScrollRef.current?.scrollTo({
                                y: m * TUMBLER_ITEM_HEIGHT,
                                animated: true,
                              });
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                isSelected ? styles.wheelTextSelected : styles.wheelTextDimmed,
                                { color: isSelected ? colors.tint : colors.textSecondary },
                              ]}
                            >
                              {m.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}

                      {/* Bottom Padding Spacer */}
                      <View style={{ height: TUMBLER_ITEM_HEIGHT }} />
                    </ScrollView>
                  </View>

                  {/* Down Arrow */}
                  <TouchableOpacity
                    onPress={() => stepMinute(1)}
                    style={[styles.tumblerArrowBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                    activeOpacity={0.6}
                    hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
                  >
                    <Ionicons name="chevron-down" size={18} color={colors.tint} />
                  </TouchableOpacity>
                </View>

                {/* AM/PM Toggle Column */}
                <View style={styles.tumblerPeriodColumn}>
                  {(['AM', 'PM'] as const).map((p) => {
                    const isSelected = selectedPeriod === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.tumblerPeriodBtn,
                          {
                            backgroundColor: isSelected ? colors.tint : colors.glassInput,
                            borderColor: isSelected ? colors.tint : colors.border,
                          },
                        ]}
                        onPress={() => setSelectedPeriod(p)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.tumblerPeriodText,
                            { color: isSelected ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Quick Minute Shortcuts */}
              <View style={styles.quickMinutesRow}>
                {[0, 15, 30, 45].map((qm) => {
                  const isSel = selectedMinute === qm;
                  return (
                    <TouchableOpacity
                      key={qm}
                      style={[
                        styles.quickMinBtn,
                        {
                          backgroundColor: isSel ? colors.tintLight : colors.glassInput,
                          borderColor: isSel ? colors.tint : colors.border,
                        },
                      ]}
                      onPress={() => setQuickMinute(qm)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickMinBtnText,
                          { color: isSel ? colors.tint : colors.textSecondary },
                        ]}
                      >
                        :{qm.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. Alarm Label Input */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 14 }]}>ALARM LABEL</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border }]}
                value={alarmLabel}
                onChangeText={setAlarmLabel}
                placeholder="e.g. Morning Scripture, Evening Prayer..."
                placeholderTextColor={colors.textTertiary}
              />

              {/* 3. Repeat Days */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 14 }]}>REPEAT DAYS</Text>
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

              {/* 4. SCRIPTURE GREETING (COMPACT DROPDOWN WITH ADD VERSE) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
                <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                  SCRIPTURE GREETING
                </Text>
                <TouchableOpacity
                  onPress={openAddNewVerseModal}
                  style={styles.addVerseHeaderBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={14} color={colors.tint} style={{ marginRight: 4 }} />
                  <Text style={[styles.addVerseHeaderBtnText, { color: colors.tint }]}>+ Add New Verse</Text>
                </TouchableOpacity>
              </View>

              {/* Scripture Dropdown Header Card */}
              <TouchableOpacity
                style={[
                  styles.dropdownHeaderCard,
                  {
                    backgroundColor: colors.glassCard,
                    borderColor: isScriptureDropdownOpen ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setIsScriptureDropdownOpen((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[styles.dropdownHeaderTitle, { color: colors.tint }]}>
                    {scriptureSummary.title}
                  </Text>
                  <Text style={[styles.dropdownHeaderSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    "{scriptureSummary.quote}"
                  </Text>
                </View>
                <View style={[styles.dropdownChevronCircle, { backgroundColor: colors.glassInput }]}>
                  <Ionicons
                    name={isScriptureDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.tint}
                  />
                </View>
              </TouchableOpacity>

              {/* Expanded Scripture Dropdown Menu */}
              {isScriptureDropdownOpen && (
                <View style={[styles.dropdownExpandedList, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
                  {/* Action to Add New Verse */}
                  <TouchableOpacity
                    style={[styles.addNewVerseOptionBtn, { backgroundColor: colors.tintLight, borderColor: colors.tint }]}
                    onPress={openAddNewVerseModal}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle" size={18} color={colors.tint} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.addNewVerseOptionTitle, { color: colors.tint }]}>
                        Add New Custom Scripture Verse
                      </Text>
                      <Text style={[styles.addNewVerseOptionSub, { color: colors.textSecondary }]}>
                        Pick from Bible or type your own personal verse
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 1. Daily Verse of the Day Option */}
                  <TouchableOpacity
                    style={[
                      styles.presetItem,
                      {
                        backgroundColor: selectedPresetId === 'daily' ? colors.tintLight : colors.glassInput,
                        borderColor: selectedPresetId === 'daily' ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedPresetId('daily');
                      setIsScriptureDropdownOpen(false);
                    }}
                  >
                    <Ionicons
                      name={selectedPresetId === 'daily' ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={selectedPresetId === 'daily' ? colors.tint : colors.textSecondary}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.presetTitle, { color: selectedPresetId === 'daily' ? colors.tint : colors.text }]}>
                        🌟 Daily Verse of the Day (Auto)
                      </Text>
                      <Text style={[styles.presetQuote, { color: colors.textSecondary }]} numberOfLines={2}>
                        "Rotates automatically with God's fresh Word each day."
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 2. Choose Any Verse from Holy Bible Option */}
                  <TouchableOpacity
                    style={[
                      styles.presetItem,
                      {
                        backgroundColor: selectedPresetId === 'bible_picker' ? colors.tintLight : colors.glassInput,
                        borderColor: selectedPresetId === 'bible_picker' ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedPresetId('bible_picker');
                    }}
                  >
                    <Ionicons
                      name={selectedPresetId === 'bible_picker' ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={selectedPresetId === 'bible_picker' ? colors.tint : colors.textSecondary}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.presetTitle, { color: selectedPresetId === 'bible_picker' ? colors.tint : colors.text }]}>
                        📖 Interactive Bible Passage Picker
                      </Text>
                      <Text style={[styles.presetQuote, { color: colors.textSecondary }]} numberOfLines={2}>
                        "Choose any book, chapter, and verse from the Holy Bible."
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 3. Type Custom Text Option */}
                  <TouchableOpacity
                    style={[
                      styles.presetItem,
                      {
                        backgroundColor: selectedPresetId === 'custom_manual' ? colors.tintLight : colors.glassInput,
                        borderColor: selectedPresetId === 'custom_manual' ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedPresetId('custom_manual');
                    }}
                  >
                    <Ionicons
                      name={selectedPresetId === 'custom_manual' ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={selectedPresetId === 'custom_manual' ? colors.tint : colors.textSecondary}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.presetTitle, { color: selectedPresetId === 'custom_manual' ? colors.tint : colors.text }]}>
                        ✍️ Type Custom Scripture Text
                      </Text>
                      <Text style={[styles.presetQuote, { color: colors.textSecondary }]} numberOfLines={2}>
                        "Write or paste your custom prayer and scripture."
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 4. List of Saved / User-Added Verses */}
                  <View style={{ marginTop: 6, marginBottom: 4 }}>
                    <Text style={[styles.dropdownSubheader, { color: colors.textSecondary }]}>
                      SAVED & CUSTOM VERSES ({savedVerses.length})
                    </Text>
                  </View>

                  {savedVerses.map((verseItem) => {
                    const isSelected = selectedPresetId === verseItem.id;
                    return (
                      <TouchableOpacity
                        key={verseItem.id}
                        style={[
                          styles.presetItem,
                          {
                            backgroundColor: isSelected ? colors.tintLight : colors.glassInput,
                            borderColor: isSelected ? colors.tint : colors.border,
                          },
                        ]}
                        onPress={() => {
                          setSelectedPresetId(verseItem.id);
                          setCustomVerseCitation(verseItem.citation);
                          setCustomVerseText(verseItem.text);
                          if (verseItem.bookId) {
                            setPickerBookId(verseItem.bookId);
                            setPickerChapter(verseItem.chapter || 1);
                            setPickerVerse(verseItem.verse || 1);
                          }
                          setIsScriptureDropdownOpen(false);
                        }}
                      >
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={isSelected ? colors.tint : colors.textSecondary}
                          style={{ marginRight: 10 }}
                        />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[styles.presetTitle, { color: isSelected ? colors.tint : colors.text }]}>
                              {verseItem.isCustomUserAdded ? '✨ ' : '🕊️ '}
                              {verseItem.citation}
                            </Text>
                            {verseItem.isCustomUserAdded && (
                              <TouchableOpacity
                                onPress={() => handleDeleteCustomVerse(verseItem.id, verseItem.citation)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={{ padding: 2 }}
                              >
                                <Ionicons name="trash-outline" size={15} color="#FF3B30" />
                              </TouchableOpacity>
                            )}
                          </View>
                          <Text style={[styles.presetQuote, { color: colors.textSecondary }]} numberOfLines={2}>
                            "{verseItem.text}"
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Interactive Bible Passage Picker (when 'bible_picker' is active) */}
              {selectedPresetId === 'bible_picker' && (
                <View style={[styles.biblePickerContainer, { backgroundColor: colors.glassCard, borderColor: colors.border, marginTop: 10 }]}>
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

              {/* Custom Scripture Input (Visible when 'custom_manual' is active) */}
              {selectedPresetId === 'custom_manual' && (
                <View style={[styles.customVerseContainer, { backgroundColor: colors.glassCard, borderColor: colors.border, marginTop: 10 }]}>
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

              {/* 5. RINGTONE & MUSIC (COMPACT DROPDOWN) */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                RINGTONE & MUSIC
              </Text>

              {/* Ringtone Dropdown Header Card */}
              <TouchableOpacity
                style={[
                  styles.dropdownHeaderCard,
                  {
                    backgroundColor: colors.glassCard,
                    borderColor: isRingtoneDropdownOpen ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setIsRingtoneDropdownOpen((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[styles.dropdownHeaderTitle, { color: colors.tint }]}>
                    {ringtoneSummary.title}
                  </Text>
                  <Text style={[styles.dropdownHeaderSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    {ringtoneSummary.desc}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {/* Play / Stop preview button directly on the collapsed header */}
                  <TouchableOpacity
                    style={[
                      styles.previewAudioBtn,
                      {
                        backgroundColor: previewingRingtoneId === selectedRingtoneId ? colors.tint : colors.glassInput,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handlePreviewRingtone(selectedRingtoneId, customAudioUri);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={previewingRingtoneId === selectedRingtoneId ? 'stop' : 'play'}
                      size={14}
                      color={previewingRingtoneId === selectedRingtoneId ? '#FFFFFF' : colors.tint}
                    />
                  </TouchableOpacity>

                  <View style={[styles.dropdownChevronCircle, { backgroundColor: colors.glassInput }]}>
                    <Ionicons
                      name={isRingtoneDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.tint}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Expanded Ringtone Dropdown Menu (Fixed size & Scrollable) */}
              {isRingtoneDropdownOpen && (
                <View style={[styles.ringtoneExpandedCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
                  <ScrollView
                    style={styles.ringtoneScroll}
                    contentContainerStyle={styles.ringtoneScrollContent}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    persistentScrollbar={Platform.OS === 'android'}
                    keyboardShouldPersistTaps="handled"
                  >
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
                          onPress={() => {
                            setSelectedRingtoneId(rt.id);
                            setIsRingtoneDropdownOpen(false);
                          }}
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
                            style={[
                              styles.previewAudioBtn,
                              { backgroundColor: isPlaying ? colors.tint : colors.glassCard, borderColor: colors.border },
                            ]}
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

                    {/* Custom Imported Song Item */}
                    {customAudioUri && (
                      <View
                        style={[
                          styles.ringtoneItem,
                          {
                            backgroundColor: selectedRingtoneId === 'custom' ? colors.glassInput : 'transparent',
                            borderColor: selectedRingtoneId === 'custom' ? colors.tint : colors.border,
                            flexDirection: 'column',
                            alignItems: 'stretch',
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                          onPress={() => {
                            setSelectedRingtoneId('custom');
                            handlePreviewRingtone('custom', customAudioUri);
                          }}
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
                              Length: {formatMinutesSeconds(customAudioDuration || 0)} • Starts at: {formatMinutesSeconds(customAudioStartOffset || 0)}
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
                              setCustomAudioStartOffset(0);
                              if (selectedRingtoneId === 'custom') {
                                setSelectedRingtoneId('classic_bell');
                              }
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                          </TouchableOpacity>
                        </TouchableOpacity>

                        {/* Cut / Choose Start Point Button */}
                        <TouchableOpacity
                          style={[styles.trimCutBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                          onPress={openTrimmerModal}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="cut" size={15} color={colors.tint} style={{ marginRight: 6 }} />
                          <Text style={[styles.trimCutBtnText, { color: colors.tint }]}>
                            {customAudioStartOffset && customAudioStartOffset > 0
                              ? `✂️ Cut Point: Starts at ${formatMinutesSeconds(customAudioStartOffset)} (Change)`
                              : '✂️ Cut Song / Choose Start Point (Chorus, Intro...)'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                  </ScrollView>

                  {/* Fixed Import Custom Music Button (Non-scrollable, always visible) */}
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
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveAlarmBtn, { backgroundColor: colors.tint }]}
                onPress={handleSaveAlarm}
                activeOpacity={0.8}
              >
                <Text style={styles.saveAlarmBtnText}>
                  {editingAlarmId ? '💾 Save Alarm Changes' : '🔔 Create Spiritual Alarm'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sub-Modal: Audio Trimmer & Start-Point Cutter */}
      <Modal visible={trimmerModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.subModalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="cut" size={18} color={colors.tint} style={{ marginRight: 6 }} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Cut & Choose Start Point</Text>
              </View>
              <TouchableOpacity onPress={closeTrimmerModal}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 14, lineHeight: 18 }}>
                Select the exact point in the song where your alarm should start ringing (e.g. chorus, drop, or favorite verse).
              </Text>

              {/* Song Banner */}
              <View style={[styles.trimmerSongBanner, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                <Ionicons name="musical-notes" size={22} color={colors.tint} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.trimmerSongTitle, { color: colors.text }]} numberOfLines={1}>
                    {customAudioName || 'Custom Audio Track'}
                  </Text>
                  <Text style={[styles.trimmerSongDesc, { color: colors.textSecondary }]}>
                    Total Track Length: {formatMinutesSeconds(customAudioDuration || 180)}
                  </Text>
                </View>
              </View>

              {/* Large Start-Time Display Card */}
              <View style={[styles.trimmerDisplayCard, { backgroundColor: colors.glassCard, borderColor: colors.tint }]}>
                <Text style={[styles.trimmerStartLabel, { color: colors.textSecondary }]}>ALARM STARTS AT</Text>
                <Text style={[styles.trimmerTimeValue, { color: colors.tint }]}>
                  {formatMinutesSeconds(tempTrimSeconds)}
                </Text>
                <Text style={[styles.trimmerPlayingStatus, { color: colors.textSecondary }]}>
                  {isTrimmerPlaying
                    ? `▶️ Playing preview: ${formatMinutesSeconds(trimmerPlaybackSeconds)} / ${formatMinutesSeconds(customAudioDuration || 180)}`
                    : `Alarm rings from ${formatMinutesSeconds(tempTrimSeconds)} to end and loops.`}
                </Text>

                {/* Visual Timeline Scrubber Progress Bar */}
                <View style={[styles.trimmerScrubberBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.trimmerScrubberFill,
                      {
                        backgroundColor: colors.tint,
                        width: `${Math.min(100, Math.max(0, (tempTrimSeconds / (customAudioDuration || 180)) * 100))}%`,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.trimmerScrubberMarker,
                      {
                        left: `${Math.min(96, Math.max(0, (tempTrimSeconds / (customAudioDuration || 180)) * 100))}%`,
                        backgroundColor: colors.tint,
                      },
                    ]}
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 4 }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary }}>0:00</Text>
                  <Text style={{ fontSize: 10, color: colors.textSecondary }}>{formatMinutesSeconds(customAudioDuration || 180)}</Text>
                </View>
              </View>

              {/* Stepper Fine-Tune Controls */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 16, marginBottom: 8 }]}>
                FINE-TUNE START POINT (SECONDS)
              </Text>
              <View style={styles.trimmerStepperRow}>
                <TouchableOpacity
                  style={[styles.trimmerStepBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={() => adjustTrimSeconds(-30)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.trimmerStepBtnText, { color: colors.text }]}>-30s</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.trimmerStepBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={() => adjustTrimSeconds(-10)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.trimmerStepBtnText, { color: colors.text }]}>-10s</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.trimmerStepBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={() => adjustTrimSeconds(-1)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.trimmerStepBtnText, { color: colors.text }]}>-1s</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.trimmerStepBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={() => adjustTrimSeconds(1)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.trimmerStepBtnText, { color: colors.text }]}>+1s</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.trimmerStepBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={() => adjustTrimSeconds(10)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.trimmerStepBtnText, { color: colors.text }]}>+10s</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.trimmerStepBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={() => adjustTrimSeconds(30)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.trimmerStepBtnText, { color: colors.text }]}>+30s</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Jump Shortcuts */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 14, marginBottom: 8 }]}>
                QUICK JUMP SHORTCUTS
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {[
                  { label: '0:00 (Intro)', sec: 0 },
                  { label: '0:15', sec: 15 },
                  { label: '0:30 (Verse)', sec: 30 },
                  { label: '0:45 (Chorus)', sec: 45 },
                  { label: '1:00', sec: 60 },
                  { label: '1:30', sec: 90 },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.trimmerPresetPill,
                      {
                        backgroundColor: tempTrimSeconds === item.sec ? colors.tint : colors.glassInput,
                        borderColor: tempTrimSeconds === item.sec ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => {
                      SoundService.stopPreview();
                      setIsTrimmerPlaying(false);
                      setTempTrimSeconds(item.sec);
                      setTrimmerPlaybackSeconds(item.sec);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.trimmerPresetPillText,
                        { color: tempTrimSeconds === item.sec ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Live Preview Button */}
              <TouchableOpacity
                style={[
                  styles.trimmerListenBtn,
                  {
                    backgroundColor: isTrimmerPlaying ? '#FF3B30' : colors.glassInput,
                    borderColor: isTrimmerPlaying ? '#FF3B30' : colors.tint,
                  },
                ]}
                onPress={handleToggleTrimPlay}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isTrimmerPlaying ? 'stop-circle' : 'play-circle'}
                  size={20}
                  color={isTrimmerPlaying ? '#FFFFFF' : colors.tint}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.trimmerListenBtnText,
                    { color: isTrimmerPlaying ? '#FFFFFF' : colors.tint },
                  ]}
                >
                  {isTrimmerPlaying
                    ? 'Stop Preview Audio'
                    : `Listen from ${formatMinutesSeconds(tempTrimSeconds)}`}
                </Text>
              </TouchableOpacity>

              {/* Save Cut Point Button */}
              <TouchableOpacity
                style={[styles.trimmerSaveBtn, { backgroundColor: colors.tint }]}
                onPress={handleSaveTrim}
                activeOpacity={0.8}
              >
                <Text style={styles.trimmerSaveBtnText}>
                  ✂️ Set as Alarm Start Point
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sub-Modal: Add New Custom Scripture Verse */}
      <Modal visible={addVerseModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.subModalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sparkles" size={18} color={colors.tint} style={{ marginRight: 6 }} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Scripture Verse</Text>
              </View>
              <TouchableOpacity onPress={() => setAddVerseModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Tab Selector: Holy Bible Picker vs Custom Text */}
              <View style={[styles.tabSelectorRow, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    addVerseMode === 'bible' && { backgroundColor: colors.tint, borderColor: colors.tint },
                  ]}
                  onPress={() => setAddVerseMode('bible')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="book"
                    size={14}
                    color={addVerseMode === 'bible' ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.tabBtnText, { color: addVerseMode === 'bible' ? '#FFFFFF' : colors.text }]}>
                    Pick from Holy Bible
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    addVerseMode === 'custom' && { backgroundColor: colors.tint, borderColor: colors.tint },
                  ]}
                  onPress={() => setAddVerseMode('custom')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="create"
                    size={14}
                    color={addVerseMode === 'custom' ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.tabBtnText, { color: addVerseMode === 'custom' ? '#FFFFFF' : colors.text }]}>
                    Type Custom Verse
                  </Text>
                </TouchableOpacity>
              </View>

              {addVerseMode === 'bible' ? (
                <View style={[styles.biblePickerContainer, { backgroundColor: colors.glassCard, borderColor: colors.border, marginTop: 12 }]}>
                  {/* 1. Book Picker */}
                  <Text style={[styles.customFieldLabel, { color: colors.textSecondary }]}>1. SELECT BOOK</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScrollPills}>
                    {BIBLE_BOOKS.map((b) => {
                      const isSelected = newPickerBookId === b.id;
                      return (
                        <TouchableOpacity
                          key={b.id}
                          onPress={() => {
                            setNewPickerBookId(b.id);
                            setNewPickerChapter(1);
                            setNewPickerVerse(1);
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
                    const activeBook = BIBLE_BOOKS.find((b) => b.id === newPickerBookId) || BIBLE_BOOKS[0];
                    const chapterCount = activeBook.chapters_count || 1;
                    return (
                      <>
                        <Text style={[styles.customFieldLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                          2. SELECT CHAPTER (1 to {chapterCount})
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScrollPills}>
                          {Array.from({ length: chapterCount }, (_, i) => i + 1).map((ch) => {
                            const isSelected = newPickerChapter === ch;
                            return (
                              <TouchableOpacity
                                key={ch}
                                onPress={() => {
                                  setNewPickerChapter(ch);
                                  setNewPickerVerse(1);
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
                    3. SELECT VERSE ({newPickerVersesList.length} Verses)
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScrollPills}>
                    {newPickerVersesList.length > 0
                      ? newPickerVersesList.map((v) => {
                          const isSelected = newPickerVerse === v.verse;
                          return (
                            <TouchableOpacity
                              key={v.verse}
                              onPress={() => setNewPickerVerse(v.verse)}
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
                            onPress={() => setNewPickerVerse(v)}
                            style={[
                              styles.numberPill,
                              {
                                backgroundColor: newPickerVerse === v ? colors.tint : colors.glassInput,
                                borderColor: newPickerVerse === v ? colors.tint : colors.border,
                              },
                            ]}
                          >
                            <Text style={[styles.numberPillText, { color: newPickerVerse === v ? '#FFFFFF' : colors.text }]}>
                              {v}
                            </Text>
                          </TouchableOpacity>
                        ))}
                  </ScrollView>

                  {/* Preview */}
                  <View style={[styles.pickedVersePreviewCard, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="book" size={14} color={colors.tint} style={{ marginRight: 6 }} />
                      <Text style={[styles.pickedVerseCitation, { color: colors.tint }]}>
                        {newCustomCitation}
                      </Text>
                    </View>
                    {newPickerLoading ? (
                      <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                      <Text style={[styles.pickedVerseText, { color: colors.text }]}>
                        "{newCustomText}"
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                <View style={[styles.customVerseContainer, { backgroundColor: colors.glassCard, borderColor: colors.border, marginTop: 12 }]}>
                  <Text style={[styles.customFieldLabel, { color: colors.textSecondary }]}>SCRIPTURE CITATION</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border, marginBottom: 10 }]}
                    value={newCustomCitation}
                    onChangeText={setNewCustomCitation}
                    placeholder="e.g. Romans 8:28, Joshua 1:9..."
                    placeholderTextColor={colors.textTertiary}
                  />

                  <Text style={[styles.customFieldLabel, { color: colors.textSecondary }]}>SCRIPTURE VERSE TEXT</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      styles.customVerseTextInput,
                      { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border },
                    ]}
                    value={newCustomText}
                    onChangeText={setNewCustomText}
                    placeholder="Type or paste your customized verse..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}

              {/* Save Verse Button */}
              <TouchableOpacity
                style={[styles.saveAlarmBtn, { backgroundColor: colors.tint, marginTop: 16 }]}
                onPress={handleSaveNewCustomVerse}
                activeOpacity={0.8}
              >
                <Text style={styles.saveAlarmBtnText}>✨ Save to My Verses & Select</Text>
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
        customAudioStartOffset={activeAlarmData.customAudioStartOffset}
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
    maxHeight: '90%',
    paddingBottom: 20,
  },
  subModalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '85%',
    paddingBottom: 20,
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
  // Tumbler Wheel Styles
  tumblerWheelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 8,
  },
  tumblerColumn: {
    alignItems: 'center',
    width: 78,
  },
  tumblerArrowBtn: {
    width: 48,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  wheelWindow: {
    height: TUMBLER_ITEM_HEIGHT * 3,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  wheelScrollView: {
    width: '100%',
  },
  wheelItem: {
    height: TUMBLER_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelTextSelected: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  wheelTextDimmed: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.4,
  },
  tumblerCenterHighlight: {
    position: 'absolute',
    top: TUMBLER_ITEM_HEIGHT,
    left: 4,
    right: 4,
    height: TUMBLER_ITEM_HEIGHT,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  tumblerColon: {
    fontSize: 28,
    fontWeight: '900',
    marginHorizontal: 6,
    alignSelf: 'center',
  },
  tumblerPeriodColumn: {
    marginLeft: 12,
    justifyContent: 'center',
    gap: 8,
  },
  tumblerPeriodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tumblerPeriodText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickMinutesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 8,
  },
  quickMinBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickMinBtnText: {
    fontSize: 12,
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
  // Dropdown Styles
  dropdownHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  dropdownHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  dropdownHeaderSubtitle: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  dropdownChevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownExpandedList: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  dropdownSubheader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  addVerseHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addVerseHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addNewVerseOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  addNewVerseOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  addNewVerseOptionSub: {
    fontSize: 11,
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
  ringtoneExpandedCard: {
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  ringtoneScroll: {
    maxHeight: 185,
  },
  ringtoneScrollContent: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  ringtoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 13,
    borderWidth: 1,
    marginBottom: 7,
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
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 6,
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
  tabSelectorRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginTop: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trimCutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  trimCutBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trimmerSongBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  trimmerSongTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  trimmerSongDesc: {
    fontSize: 12,
  },
  trimmerDisplayCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 8,
  },
  trimmerStartLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  trimmerTimeValue: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
    marginVertical: 4,
  },
  trimmerPlayingStatus: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  trimmerScrubberBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
    justifyContent: 'center',
  },
  trimmerScrubberFill: {
    height: 8,
    borderRadius: 4,
  },
  trimmerScrubberMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    top: -4,
  },
  trimmerStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
  },
  trimmerStepBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  trimmerStepBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  trimmerPresetPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  trimmerPresetPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trimmerListenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  trimmerListenBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  trimmerSaveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 2,
    marginBottom: 20,
  },
  trimmerSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
