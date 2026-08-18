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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { BibleRepo } from '../../src/db/bibleRepo';
import { NotesRepo } from '../../src/db/notesRepo';
import { PlansRepo } from '../../src/db/plansRepo';
import { Note } from '../../src/types/note';
import { getItem, StorageKeys } from '../../src/utils/storage';
import { BibleVersion, Book, Verse } from '../../src/types/bible';
import { getTodayVerseRef, DailyVerseRef } from '../../src/constants/VerseOfTheDay';
import { ReadingPlan, ReadingPlanDay } from '../../src/types/plan';
import { AnimatedMascot } from '../../src/components/AnimatedMascot';

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

  // Continue Reading state
  const [lastReadBook, setLastReadBook] = useState<Book | null>(null);
  const [lastReadChapter, setLastReadChapter] = useState<number>(1);

  // Active Reading Plan state
  const [activePlan, setActivePlan] = useState<ReadingPlan | null>(null);
  const [completedPlanDays, setCompletedPlanDays] = useState<number[]>([]);

  // Recent Notes state
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [activeVersion, setActiveVersion] = useState<BibleVersion>('KJV');

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

      // 3. Fetch Active Reading Plan progress from SQLite
      const userPlans = await PlansRepo.getUserPlans(db);
      if (userPlans.length > 0) {
        const savedPlanId = getItem<string>(StorageKeys.ACTIVE_PLAN_ID, '');
        const targetPlan = userPlans.find((p) => p.id === savedPlanId) || userPlans[0];
        setActivePlan(targetPlan);
        const completed = await PlansRepo.getCompletedDays(db, targetPlan.id);
        setCompletedPlanDays(completed);
      } else {
        setActivePlan(null);
        setCompletedPlanDays([]);
      }

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

  const planProgressPercent = activePlan && activePlan.durationDays > 0
    ? Math.round((completedPlanDays.length / activePlan.durationDays) * 100)
    : 0;

  // Next incomplete day for reading plan
  const nextIncompleteDay = activePlan?.days.find((d: ReadingPlanDay) => !completedPlanDays.includes(d.day)) || activePlan?.days[0];

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
                style={[styles.verseActionBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                onPress={handleReadDailyVerseChapter}
                activeOpacity={0.7}
              >
                <Ionicons name="book-outline" size={15} color={colors.text} style={{ marginRight: 5 }} />
                <Text style={[styles.verseActionBtnText, { color: colors.text }]}>Read Chapter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.verseActionBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                onPress={handleShareDailyVerse}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social-outline" size={15} color={colors.text} style={{ marginRight: 5 }} />
                <Text style={[styles.verseActionBtnText, { color: colors.text }]}>Share</Text>
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


      {/* 5. Active Reading Plan Card */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Reading Plan</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/plans')}>
            <Text style={[styles.sectionActionText, { color: colors.tint }]}>View All Plans ➔</Text>
          </TouchableOpacity>
        </View>

        {activePlan ? (
          <TouchableOpacity
            style={[styles.planCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/plan/[id]', params: { id: activePlan.id } })}
            activeOpacity={0.8}
          >
            <View style={styles.planCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planCardTitle, { color: colors.text }]}>{activePlan.title}</Text>
                <Text style={[styles.planCardDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                  {nextIncompleteDay ? `Today: Day ${nextIncompleteDay.day} • ${nextIncompleteDay.title}` : 'Plan Completed! 🎉'}
                </Text>
              </View>
              <View style={[styles.planPercentBadge, { backgroundColor: colors.glassHighlight }]}>
                <Text style={[styles.planPercentText, { color: colors.gold }]}>{planProgressPercent}%</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.planProgressBarBg, { backgroundColor: colors.glassInput }]}>
              <View
                style={[
                  styles.planProgressBarFill,
                  { backgroundColor: colors.success, width: `${planProgressPercent}%` },
                ]}
              />
            </View>

            {nextIncompleteDay && (
              <View style={styles.planReadingsRow}>
                <View style={styles.planPassages}>
                  {nextIncompleteDay.readings.map((r: { passage: string }, idx: number) => (
                    <Text key={idx} style={[styles.planPassagePill, { color: colors.tint }]}>
                      📖 {r.passage}
                    </Text>
                  ))}
                </View>
                <View style={[styles.planStartBtn, { backgroundColor: colors.tint }]}>
                  <Text style={styles.planStartBtnText}>Day {nextIncompleteDay.day}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                </View>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.planCard, { backgroundColor: colors.glassCard, borderColor: colors.border, alignItems: 'center', paddingVertical: 20 }]}
            onPress={() => router.push('/plan/new')}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={28} color={colors.tint} style={{ marginBottom: 6 }} />
            <Text style={[styles.planCardTitle, { color: colors.text }]}>Start a Reading Plan</Text>
            <Text style={[styles.planCardDesc, { color: colors.textSecondary, textAlign: 'center', marginBottom: 12 }]}>
              Create a customized plan to read the Gospels, New Testament, or any Bible book.
            </Text>
            <View style={[styles.planStartBtn, { backgroundColor: colors.tint }]}>
              <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.planStartBtnText}>Create Plan</Text>
            </View>
          </TouchableOpacity>
        )}
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
          <Ionicons name="heart" size={18} color="#FF2D55" style={{ marginRight: 6 }} />
          <Text style={[styles.prayerTitle, { color: colors.text }]}>Daily Prayer & Reflection</Text>
        </View>
        <Text style={[styles.prayerText, { color: colors.textSecondary }]}>
          "Lord, grant me wisdom to understand Your Word, peace to quiet my anxieties, and courage to walk faithfully in Your love today. Amen."
        </Text>
      </View>
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
  planCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  planCardDesc: {
    fontSize: 13,
  },
  planPercentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  planPercentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  planProgressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  planProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  planReadingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planPassages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  planPassagePill: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 10,
  },
  planStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  planStartBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
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
    marginBottom: 6,
  },
  prayerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  prayerText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
