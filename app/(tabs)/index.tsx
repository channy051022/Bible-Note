import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { BibleRepo } from '../../src/db/bibleRepo';
import { NotesRepo } from '../../src/db/notesRepo';
import { DevotionsRepo } from '../../src/db/devotionsRepo';
import { Note } from '../../src/types/note';
import { getItem, setItem, StorageKeys } from '../../src/utils/storage';
import { BibleVersion, Book, Verse } from '../../src/types/bible';
import { getTodayVerseRef, DailyVerseRef } from '../../src/constants/VerseOfTheDay';
import { Devotion, DevotionStreakInfo, DevotionUserEntry } from '../../src/types/devotion';
import { getTodayDevotion } from '../../src/data/devotionsData';
import { AnimatedMascot } from '../../src/components/AnimatedMascot';
import { DailyPrayer, DEFAULT_DAILY_PRAYER, PRAYER_TEMPLATES } from '../../src/types/prayer';
import { StoryShareModal } from '../../src/components/StoryShareModal';

export default function HomeScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  // Greeting & Date state
  const [greeting, setGreeting] = useState<string>('Good day');
  const [dateString, setDateString] = useState<string>('');

  // Daily Verse state
  const [dailyVerse, setDailyVerse] = useState<{ book: Book; verse: Verse; citation: string } | null>(null);
  const [isLoadingDailyVerse, setIsLoadingDailyVerse] = useState<boolean>(true);
  const [storyModalVisible, setStoryModalVisible] = useState<boolean>(false);

  // Continue Reading state
  const [lastReadBook, setLastReadBook] = useState<Book | null>(null);
  const [lastReadChapter, setLastReadChapter] = useState<number>(1);

  // Today's Devotion & Streak state
  const [todayDevotion, setTodayDevotion] = useState<Devotion>(getTodayDevotion());
  const [todayDevotionEntry, setTodayDevotionEntry] = useState<DevotionUserEntry | null>(null);
  const [devotionStreak, setDevotionStreak] = useState<DevotionStreakInfo>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompleted: 0,
    encouragingMessage: 'Keep walking with God.',
  });

  // Recent Notes state
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [activeVersion, setActiveVersion] = useState<BibleVersion>('KJV');

  // Daily Prayer & Reflection state
  const [dailyPrayer, setDailyPrayer] = useState<DailyPrayer>(DEFAULT_DAILY_PRAYER);
  const [prayerModalVisible, setPrayerModalVisible] = useState<boolean>(false);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingPrayer, setEditingPrayer] = useState<string>('');
  const [editingReflection, setEditingReflection] = useState<string>('');
  const [editingScriptureRef, setEditingScriptureRef] = useState<string>('');

  // Compute greeting and date
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good morning ☀️');
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good afternoon 🌤️');
    } else {
      setGreeting('Good evening 🌙');
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    setDateString(now.toLocaleDateString(undefined, options));
  }, []);

  // Load Home Screen Data
  const loadHomeData = useCallback(async () => {
    try {
      const version = getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
      setActiveVersion(version);

      // 0. Fetch Saved Daily Prayer
      const savedPrayer = getItem<DailyPrayer>(StorageKeys.DAILY_PRAYER, DEFAULT_DAILY_PRAYER);
      setDailyPrayer(savedPrayer);

      // 1. Fetch Today's Verse
      setIsLoadingDailyVerse(true);
      const verseRef: DailyVerseRef = getTodayVerseRef();
      const book = await BibleRepo.getBookById(db, verseRef.bookId);
      const verses = await BibleRepo.getChapterVerses(db, verseRef.bookId, verseRef.chapter, version);
      const foundVerse = verses.find((v: Verse) => v.verse === verseRef.verse) || verses[0];

      if (book && foundVerse) {
        setDailyVerse({
          book,
          verse: foundVerse,
          citation: `${book.name} ${verseRef.chapter}:${foundVerse.verse}`,
        });
      }

      // 2. Fetch Last Read Chapter
      const savedBookId = getItem<number>(StorageKeys.LAST_READ_BOOK, 43); // Default John
      const savedChapter = getItem<number>(StorageKeys.LAST_READ_CHAPTER, 1);
      const lrBook = await BibleRepo.getBookById(db, savedBookId);
      setLastReadBook(lrBook || null);
      setLastReadChapter(savedChapter);

      // 3. Fetch Today's Devotion & Streak from SQLite
      const todayDev = getTodayDevotion();
      setTodayDevotion(todayDev);
      const devEntry = await DevotionsRepo.getUserEntry(db, todayDev.id);
      setTodayDevotionEntry(devEntry);
      const streak = await DevotionsRepo.getDevotionStreak(db);
      setDevotionStreak(streak);

      // 4. Fetch Recent Study Notes (latest 3)
      const allNotes = await NotesRepo.getAllNotes(db);
      setRecentNotes(allNotes.slice(0, 3));
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setIsLoadingDailyVerse(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  // Action: Daily Prayer Customization Handlers
  const handleOpenPrayerModal = () => {
    setEditingTitle(dailyPrayer.title || DEFAULT_DAILY_PRAYER.title);
    setEditingPrayer(dailyPrayer.prayer || DEFAULT_DAILY_PRAYER.prayer);
    setEditingReflection(dailyPrayer.reflection || '');
    setEditingScriptureRef(dailyPrayer.scriptureRef || '');
    setPrayerModalVisible(true);
  };

  const handleApplyTemplate = (template: DailyPrayer) => {
    setEditingTitle(template.title);
    setEditingPrayer(template.prayer);
    setEditingReflection(template.reflection || '');
    setEditingScriptureRef(template.scriptureRef || '');
  };

  const handleSavePrayer = () => {
    if (!editingPrayer.trim()) {
      Alert.alert('Prayer Required', 'Please enter your prayer text before saving.');
      return;
    }
    const newPrayer: DailyPrayer = {
      title: editingTitle.trim() || 'Daily Prayer & Reflection',
      prayer: editingPrayer.trim(),
      reflection: editingReflection.trim() || undefined,
      scriptureRef: editingScriptureRef.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    setItem(StorageKeys.DAILY_PRAYER, newPrayer);
    setDailyPrayer(newPrayer);
    setPrayerModalVisible(false);
  };

  const handleResetPrayer = () => {
    setItem(StorageKeys.DAILY_PRAYER, DEFAULT_DAILY_PRAYER);
    setDailyPrayer(DEFAULT_DAILY_PRAYER);
    setPrayerModalVisible(false);
  };

  // Action: Share Daily Verse
  const handleShareDailyVerse = async () => {
    if (!dailyVerse) return;
    try {
      await Share.share({
        message: `"${dailyVerse.verse.text}"\n— ${dailyVerse.citation} (${activeVersion})\n\nShared via Bible Note`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Action: Read Chapter of Daily Verse
  const handleReadDailyVerseChapter = () => {
    if (!dailyVerse) return;
    router.push({
      pathname: '/(tabs)/bible',
      params: {
        bookId: dailyVerse.book.id.toString(),
        chapter: dailyVerse.verse.chapter.toString(),
        verse: dailyVerse.verse.verse.toString(),
      },
    });
  };


  // Action: Resume Last Read
  const handleResumeReading = () => {
    if (!lastReadBook) return;
    router.push({
      pathname: '/(tabs)/bible',
      params: {
        bookId: lastReadBook.id.toString(),
        chapter: lastReadChapter.toString(),
      },
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Welcome Greeting Card with Animated Mascot */}
      <View style={[styles.greetingCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
        <View style={styles.greetingTextContainer}>
          <Text style={[styles.dateBadgeText, { color: colors.tint }]}>{dateString.toUpperCase()}</Text>
          <Text style={[styles.greetingTitle, { color: colors.text }]}>{greeting}</Text>
          <Text style={[styles.greetingSubtitle, { color: colors.textSecondary }]}>
            May your heart be refreshed and nourished by God's Word today.
          </Text>
        </View>

        <View style={styles.mascotWrap}>
          <AnimatedMascot width={95} height={105} />
        </View>
      </View>

      {/* 2. Verse of the Day Card (Centerpiece) */}
      <View style={[styles.verseOfTheDayCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
        <View style={styles.verseCardHeader}>
          <View style={styles.verseBadgeRow}>
            <View style={[styles.goldBadge, { backgroundColor: colors.glassHighlight }]}>
              <Ionicons name="sparkles" size={14} color={colors.gold} />
            </View>
            <Text style={[styles.verseBadgeText, { color: colors.gold }]}>VERSE OF THE DAY</Text>
          </View>
          <View style={[styles.versionPill, { backgroundColor: colors.tintLight }]}>
            <Text style={[styles.versionPillText, { color: colors.tint }]}>{activeVersion}</Text>
          </View>
        </View>

        {isLoadingDailyVerse ? (
          <View style={styles.verseLoadingContainer}>
            <ActivityIndicator size="small" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading daily scripture...</Text>
          </View>
        ) : dailyVerse ? (
          <>
            <Text style={[styles.dailyVerseText, { color: colors.text }]}>
              "{dailyVerse.verse.text}"
            </Text>
            <Text style={[styles.dailyVerseCitation, { color: colors.tint }]}>
              — {dailyVerse.citation}
            </Text>

            {/* Verse Action Buttons */}
            <View style={[styles.verseActionsRow, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.verseStoryShareBtn, { backgroundColor: '#1877F2' }]}
                onPress={() => setStoryModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-facebook" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.verseStoryShareBtnText}>FB My Day / Story</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.verseActionBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                onPress={handleReadDailyVerseChapter}
                activeOpacity={0.7}
              >
                <Ionicons name="book-outline" size={14} color={colors.text} style={{ marginRight: 5 }} />
                <Text style={[styles.verseActionBtnText, { color: colors.text }]}>Read Chapter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.verseActionIconButton, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                onPress={handleShareDailyVerse}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social-outline" size={15} color={colors.text} />
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>

      {/* 3. Continue Reading Card */}
      {lastReadBook && (
        <TouchableOpacity
          style={[styles.continueReadingCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}
          onPress={handleResumeReading}
          activeOpacity={0.8}
        >
          <View style={styles.continueCardLeft}>
            <View style={[styles.continueIconCircle, { backgroundColor: colors.tintLight }]}>
              <Ionicons name="bookmark" size={20} color={colors.tint} />
            </View>
            <View style={styles.continueTextGroup}>
              <Text style={[styles.continuePretitle, { color: colors.textSecondary }]}>CONTINUE READING</Text>
              <Text style={[styles.continueBookTitle, { color: colors.text }]}>
                {lastReadBook.name} Chapter {lastReadChapter}
              </Text>
              <Text style={[styles.continueDetails, { color: colors.textSecondary }]}>
                {lastReadBook.testament === 'OT' ? 'Old Testament' : 'New Testament'} • {lastReadBook.chapters_count} Chapters
              </Text>
            </View>
          </View>
          <View style={[styles.continueArrowBadge, { backgroundColor: colors.tint }]}>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* 5. Today's Devotion Card (Aligned with Daily Verse) */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Devotion</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/devotion')}>
            <Text style={[styles.sectionActionText, { color: colors.tint }]}>All Devotions ➔</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.devotionCard,
            {
              backgroundColor: colors.glassCard,
              borderColor: todayDevotionEntry?.isCompleted ? colors.success : colors.border,
            },
          ]}
          onPress={() =>
            router.push({
              pathname: '/devotion/[id]',
              params: { id: todayDevotion.id },
            })
          }
          activeOpacity={0.8}
        >
          <View style={styles.devotionCardHeader}>
            <View style={[styles.devotionBadge, { backgroundColor: colors.tintLight }]}>
              <Ionicons name="sparkles" size={11} color={colors.tint} style={{ marginRight: 4 }} />
              <Text style={[styles.devotionBadgeText, { color: colors.tint }]}>TODAY'S DEVOTION</Text>
            </View>
            <View style={styles.devotionMetaRight}>
              <Text style={[styles.devotionTimeText, { color: colors.textTertiary }]}>
                {todayDevotion.estimatedReadingMinutes} min read
              </Text>
              {todayDevotionEntry?.isCompleted && (
                <View style={[styles.devotionDoneBadge, { backgroundColor: `${colors.success}20` }]}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.success} style={{ marginRight: 3 }} />
                  <Text style={[styles.devotionDoneText, { color: colors.success }]}>Done</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.devotionTitleText, { color: colors.text }]}>{todayDevotion.title}</Text>

          <View style={styles.devotionVerseRow}>
            <Text style={[styles.devotionVerseText, { color: colors.tint }]}>
              📖 {todayDevotion.scriptureCitation}
            </Text>
            <View style={[styles.devotionCatPill, { backgroundColor: colors.glassInput }]}>
              <Text style={[styles.devotionCatText, { color: colors.textSecondary }]}>
                {todayDevotion.category}
              </Text>
            </View>
          </View>

          <Text style={[styles.devotionPreviewText, { color: colors.textSecondary }]} numberOfLines={2}>
            "{todayDevotion.reflectionContent.replace(/\n+/g, ' ')}"
          </Text>

          <View style={[styles.devotionFooter, { borderTopColor: colors.border }]}>
            <View style={styles.devotionStreakSnippet}>
              <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
              <Text style={[styles.devotionStreakSnippetText, { color: colors.gold }]}>
                {devotionStreak.currentStreak > 0
                  ? `${devotionStreak.currentStreak} Day Devotion Streak`
                  : 'Start streak today'}
              </Text>
            </View>

            <View
              style={[
                styles.devotionStartBtn,
                { backgroundColor: todayDevotionEntry?.isCompleted ? colors.success : colors.tint },
              ]}
            >
              <Text style={styles.devotionStartBtnText}>
                {todayDevotionEntry?.isCompleted ? 'Read Again →' : 'Start Devotion →'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* 6. Recent Study Notes */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Study Notes</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/notes')}>
            <Text style={[styles.sectionActionText, { color: colors.tint }]}>All Notes ➔</Text>
          </TouchableOpacity>
        </View>

        {recentNotes.length === 0 ? (
          <TouchableOpacity
            style={[styles.emptyNoteCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}
            onPress={() => router.push('/note/new')}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={28} color={colors.textTertiary} />
            <Text style={[styles.emptyNoteTitle, { color: colors.text }]}>Create your first study note</Text>
            <Text style={[styles.emptyNoteSub, { color: colors.textSecondary }]}>
              Capture your reflections, prayers, and scripture insights.
            </Text>
          </TouchableOpacity>
        ) : (
          recentNotes.map((note) => (
            <TouchableOpacity
              key={note.id}
              style={[styles.noteCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id.toString() } })}
              activeOpacity={0.7}
            >
              <View style={styles.noteHeader}>
                <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
                  {note.title || 'Untitled Note'}
                </Text>
                <Text style={[styles.noteDate, { color: colors.textTertiary }]}>
                  {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              {note.content ? (
                <Text style={[styles.noteSnippet, { color: colors.textSecondary }]} numberOfLines={2}>
                  {note.content.replace(/[#*`>_-]/g, '').trim()}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* 7. Daily Spiritual Reflection / Prayer Focus */}
      <View style={[styles.prayerCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
        <View style={styles.prayerHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <Ionicons name="heart" size={18} color="#FF2D55" style={{ marginRight: 6 }} />
            <Text style={[styles.prayerTitle, { color: colors.text }]} numberOfLines={1}>
              {dailyPrayer.title || 'Daily Prayer & Reflection'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editPrayerBtn, { backgroundColor: colors.tintLight, borderColor: colors.tint }]}
            onPress={handleOpenPrayerModal}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="create-outline" size={13} color={colors.tint} style={{ marginRight: 4 }} />
            <Text style={[styles.editPrayerBtnText, { color: colors.tint }]}>Customize</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.prayerText, { color: colors.textSecondary }]}>
          "{dailyPrayer.prayer}"
        </Text>

        {dailyPrayer.reflection ? (
          <View style={[styles.reflectionInsightBox, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
            <Ionicons name="bulb-outline" size={14} color={colors.tint} style={{ marginRight: 6, marginTop: 1 }} />
            <Text style={[styles.reflectionInsightText, { color: colors.text }]}>
              {dailyPrayer.reflection}
            </Text>
          </View>
        ) : null}

        {dailyPrayer.scriptureRef ? (
          <View style={styles.prayerScriptureRow}>
            <Ionicons name="book-outline" size={12} color={colors.textTertiary} style={{ marginRight: 4 }} />
            <Text style={[styles.prayerScriptureRef, { color: colors.textTertiary }]}>
              {dailyPrayer.scriptureRef}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Modal for Customizing Daily Prayer & Reflection */}
      <Modal visible={prayerModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Customize Prayer & Reflection</Text>
              <TouchableOpacity onPress={() => setPrayerModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Quick Inspiration Templates */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary }]}>INSPIRATION TEMPLATES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
                {PRAYER_TEMPLATES.map((tpl) => (
                  <TouchableOpacity
                    key={tpl.id}
                    onPress={() => handleApplyTemplate(tpl.prayer)}
                    style={[
                      styles.templatePill,
                      { backgroundColor: colors.glassInput, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.templatePillText, { color: colors.text }]}>{tpl.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Title Input */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                PRAYER TITLE
              </Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border }]}
                value={editingTitle}
                onChangeText={setEditingTitle}
                placeholder="e.g. Morning Gratitude, Prayer for Family..."
                placeholderTextColor={colors.textTertiary}
              />

              {/* Prayer Text Input */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                DAILY PRAYER / INTENTIONS
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  styles.prayerMultilineInput,
                  { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border },
                ]}
                value={editingPrayer}
                onChangeText={setEditingPrayer}
                placeholder="Write your personal prayer, devotion, or focus for the day..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
              />

              {/* Reflection Input */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                DAILY REFLECTION / MEDITATION (OPTIONAL)
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  styles.reflectionMultilineInput,
                  { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border },
                ]}
                value={editingReflection}
                onChangeText={setEditingReflection}
                placeholder="Key takeaway, thought, or reflection insight..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={2}
              />

              {/* Scripture Reference */}
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                ASSOCIATED SCRIPTURE (OPTIONAL)
              </Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, backgroundColor: colors.glassInput, borderColor: colors.border }]}
                value={editingScriptureRef}
                onChangeText={setEditingScriptureRef}
                placeholder="e.g. Psalm 23:1, Philippians 4:6, John 14:27..."
                placeholderTextColor={colors.textTertiary}
              />

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.savePrayerBtn, { backgroundColor: colors.tint }]}
                onPress={handleSavePrayer}
                activeOpacity={0.8}
              >
                <Text style={styles.savePrayerBtnText}>Save Prayer & Reflection</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resetPrayerBtn, { borderColor: colors.border }]}
                onPress={handleResetPrayer}
                activeOpacity={0.7}
              >
                <Text style={[styles.resetPrayerBtnText, { color: colors.textSecondary }]}>
                  Reset to Default Prayer
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Facebook Story / My Day Sharing Studio Modal */}
      {dailyVerse && (
        <StoryShareModal
          visible={storyModalVisible}
          verseText={dailyVerse.verse.text}
          citation={dailyVerse.citation}
          version={activeVersion}
          dateString={dateString}
          onClose={() => setStoryModalVisible(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  greetingTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  mascotWrap: {
    width: 95,
    height: 105,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  verseOfTheDayCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  verseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goldBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  verseBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  versionPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  versionPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  verseLoadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 8,
  },
  dailyVerseText: {
    fontSize: 17,
    lineHeight: 26,
    fontStyle: 'italic',
    marginBottom: 10,
    fontFamily: 'System',
  },
  dailyVerseCitation: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  verseActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  verseStoryShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginRight: 8,
  },
  verseStoryShareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  verseActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  verseActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verseActionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  continueReadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  continueCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  continueIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  continueTextGroup: {
    flex: 1,
  },
  continuePretitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  continueBookTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  continueDetails: {
    fontSize: 12,
  },
  continueArrowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  quickShortcutsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  shortcutCard: {
    width: '23%',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  shortcutIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  shortcutSub: {
    fontSize: 10,
    textAlign: 'center',
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  devotionCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  devotionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  devotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  devotionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  devotionMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  devotionTimeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  devotionDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  devotionDoneText: {
    fontSize: 9,
    fontWeight: '800',
  },
  devotionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  devotionVerseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  devotionVerseText: {
    fontSize: 12,
    fontWeight: '700',
  },
  devotionCatPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  devotionCatText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  devotionPreviewText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  devotionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  devotionStreakSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  devotionStreakSnippetText: {
    fontSize: 11,
    fontWeight: '700',
  },
  devotionStartBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  devotionStartBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyNoteCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  emptyNoteTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyNoteSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  noteCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  noteDate: {
    fontSize: 12,
  },
  noteSnippet: {
    fontSize: 13,
    lineHeight: 18,
  },
  prayerCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  prayerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  editPrayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  editPrayerBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  prayerText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  reflectionInsightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  reflectionInsightText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  prayerScriptureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  prayerScriptureRef: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  templatesScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  templatePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  templatePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  prayerMultilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  reflectionMultilineInput: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  savePrayerBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  savePrayerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resetPrayerBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 30,
  },
  resetPrayerBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
