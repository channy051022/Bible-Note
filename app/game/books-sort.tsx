import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { BIBLE_BOOKS, BibleBookMeta } from '../../src/constants/BibleBooks';
import { AnimatedMascot } from '../../src/components/AnimatedMascot';
import {
  GamificationEngine,
  GameDifficulty,
  GameStats,
} from '../../src/utils/gamificationEngine';
import { GameAudioService } from '../../src/services/gameAudioService';

export default function CanonicalBookSorterScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [difficulty, setDifficulty] = useState<GameDifficulty>('medium');
  const [currentBooks, setCurrentBooks] = useState<BibleBookMeta[]>([]);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [hasAttempted, setHasAttempted] = useState<boolean>(false);
  const [victoryRewards, setVictoryRewards] = useState<{ stars: number; streakBonus: number } | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>(GamificationEngine.getGameStats('books_sort'));
  const [mascotMessage, setMascotMessage] = useState<string>(
    'Arrange these sacred books in biblical canonical order (Genesis to Revelation)!'
  );

  // Generate random distinct books based on difficulty
  const generateNewRound = useCallback(() => {
    setIsVictory(false);
    setHasAttempted(false);
    setVictoryRewards(null);
    setMascotMessage('Arrange these sacred books in biblical canonical order (Genesis to Revelation)!');
    GamificationEngine.recordGameAttempt('books_sort');
    setGameStats(GamificationEngine.getGameStats('books_sort'));
    GameAudioService.playBGM('books_sort');

    let pool = [...BIBLE_BOOKS];
    let bookCount = 4;

    if (difficulty === 'easy') {
      bookCount = 3;
      // 50% chance of OT only or NT only for easier recognition
      const otOnly = Math.random() > 0.5;
      pool = BIBLE_BOOKS.filter((b) => (otOnly ? b.testament === 'OT' : b.testament === 'NT'));
    } else if (difficulty === 'hard') {
      bookCount = 6;
    }

    const shuffledPool = pool.sort(() => Math.random() - 0.5);
    const selected = shuffledPool.slice(0, bookCount);

    // Make sure they are not pre-sorted in ascending order
    const isAlreadySorted = selected.every((b, i, arr) => i === 0 || arr[i - 1].id < b.id);
    if (isAlreadySorted && selected.length >= 2) {
      const temp = selected[0];
      selected[0] = selected[1];
      selected[1] = temp;
    }

    setCurrentBooks(selected);
  }, [difficulty]);

  useEffect(() => {
    generateNewRound();
  }, [generateNewRound]);

  // Move book item up in list
  const moveUp = (index: number) => {
    if (index === 0 || isVictory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    GameAudioService.playTapSound();
    const updated = [...currentBooks];
    const item = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = item;
    setCurrentBooks(updated);
    setHasAttempted(false);
  };

  // Move book item down in list
  const moveDown = (index: number) => {
    if (index === currentBooks.length - 1 || isVictory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    GameAudioService.playTapSound();
    const updated = [...currentBooks];
    const item = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = item;
    setCurrentBooks(updated);
    setHasAttempted(false);
  };

  // Evaluate order
  const handleCheckOrder = () => {
    setHasAttempted(true);
    const isCorrect = currentBooks.every((b, i, arr) => i === 0 || arr[i - 1].id < b.id);

    if (isCorrect) {
      setIsVictory(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      GameAudioService.playVictoryFanfare();

      const baseStars = difficulty === 'hard' ? 35 : difficulty === 'medium' ? 20 : 15;
      const result = GamificationEngine.recordVictory('books_sort', baseStars, currentBooks.length * 25);
      setVictoryRewards({
        stars: baseStars,
        streakBonus: result.streakBonus,
      });
      setGameStats(result.gameStats);
      setMascotMessage(`🐑🎉 Fantastic! You sorted the books in holy biblical order! +${baseStars} Wool Stars!`);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      GameAudioService.playWarningSound();
      setMascotMessage('Not quite in canonical order yet! Remember books flow from Old Testament to New Testament. Try moving them!');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.glassBackground }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={[styles.backBtnText, { color: colors.text }]}>Game Hub</Text>
        </TouchableOpacity>

        <View style={[styles.gameHeaderTitleBadge, { backgroundColor: 'rgba(255, 149, 0, 0.12)', borderColor: '#FF9500' }]}>
          <Text style={[styles.gameHeaderTitleText, { color: '#FF9500' }]}>
            📚 Book Sorter (Lvl {gameStats.level})
          </Text>
        </View>

        <TouchableOpacity
          onPress={generateNewRound}
          style={[styles.refreshBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="shuffle-outline" size={18} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot Speech Banner */}
        <View style={[styles.mascotBanner, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          <View style={styles.mascotThumb}>
            <AnimatedMascot width={55} height={60} />
          </View>
          <View style={styles.mascotSpeech}>
            <Text style={[styles.mascotSpeechTitle, { color: '#FF9500' }]}>SHEP COMPANION</Text>
            <Text style={[styles.mascotSpeechText, { color: colors.text }]}>{mascotMessage}</Text>
          </View>
        </View>

        {/* Difficulty Selector */}
        <View style={styles.difficultyRow}>
          {(['easy', 'medium', 'hard'] as GameDifficulty[]).map((d) => {
            const isSelected = difficulty === d;
            return (
              <TouchableOpacity
                key={d}
                onPress={() => setDifficulty(d)}
                style={[
                  styles.difficultyPill,
                  {
                    backgroundColor: isSelected ? '#FF9500' : colors.glassInput,
                    borderColor: isSelected ? '#FF9500' : colors.border,
                  },
                ]}
              >
                <Text style={[styles.difficultyPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {d.toUpperCase()} ({d === 'easy' ? '3 Bks • +15⭐' : d === 'medium' ? '4 Bks • +20⭐' : '6 Bks • +35⭐'})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isVictory ? (
          /* Victory Card */
          <View style={[styles.victoryCard, { backgroundColor: colors.glassCard, borderColor: '#FF9500' }]}>
            <Text style={{ fontSize: 44, marginBottom: 8 }}>📜</Text>
            <Text style={[styles.victoryTitle, { color: colors.text }]}>Perfect Canonical Sequence!</Text>

            {/* List breakdown with canonical numbers */}
            <View style={styles.victoryBooksList}>
              {currentBooks.map((book, idx) => (
                <View
                  key={book.id}
                  style={[styles.victoryBookRow, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                >
                  <View style={styles.victoryIndexBadge}>
                    <Text style={styles.victoryIndexText}>#{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.victoryBookName, { color: colors.text }]}>{book.name}</Text>
                    <Text style={[styles.victoryBookSub, { color: colors.textSecondary }]}>
                      Canonical Book #{book.id} • {book.testament === 'OT' ? 'Old Testament' : 'New Testament'}
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                </View>
              ))}
            </View>

            <View style={styles.rewardBadgesRow}>
              <View style={[styles.rewardPill, { backgroundColor: 'rgba(255, 149, 0, 0.12)', borderColor: '#FF9500' }]}>
                <Text style={[styles.rewardPillText, { color: '#FF9500' }]}>+20 Wool Stars 🌟</Text>
              </View>
              {victoryRewards && victoryRewards.streakBonus > 0 ? (
                <View style={[styles.rewardPill, { backgroundColor: 'rgba(255, 45, 85, 0.12)', borderColor: '#FF2D55' }]}>
                  <Text style={[styles.rewardPillText, { color: '#FF2D55' }]}>
                    +{victoryRewards.streakBonus} Daily Streak Bonus 🔥
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.playNextBtn, { backgroundColor: '#FF9500' }]}
              onPress={generateNewRound}
              activeOpacity={0.8}
            >
              <Text style={styles.playNextBtnText}>Play Next Round ➔</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              REORDER INTO CANONICAL ORDER (1st to 4th)
            </Text>

            {/* 4 Books Draggable/Reorderable List */}
            <View style={styles.booksList}>
              {currentBooks.map((book, index) => (
                <View
                  key={book.id}
                  style={[
                    styles.bookItemCard,
                    {
                      backgroundColor: colors.glassCard,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Position Badge */}
                  <View style={[styles.positionBadge, { backgroundColor: colors.tintLight }]}>
                    <Text style={[styles.positionBadgeText, { color: colors.tint }]}>{index + 1}</Text>
                  </View>

                  {/* Book Info */}
                  <View style={styles.bookInfo}>
                    <Text style={[styles.bookName, { color: colors.text }]}>{book.name}</Text>
                    <Text style={[styles.bookTestament, { color: colors.textSecondary }]}>
                      {book.testament === 'OT' ? 'Old Testament' : 'New Testament'} • {book.chapters_count} Chapters
                    </Text>
                  </View>

                  {/* Move Up / Down Buttons */}
                  <View style={styles.arrowsColumn}>
                    <TouchableOpacity
                      onPress={() => moveUp(index)}
                      style={[
                        styles.arrowBtn,
                        {
                          backgroundColor: colors.glassInput,
                          borderColor: colors.border,
                          opacity: index === 0 ? 0.3 : 1,
                        },
                      ]}
                      disabled={index === 0}
                    >
                      <Ionicons name="chevron-up" size={16} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => moveDown(index)}
                      style={[
                        styles.arrowBtn,
                        {
                          backgroundColor: colors.glassInput,
                          borderColor: colors.border,
                          opacity: index === currentBooks.length - 1 ? 0.3 : 1,
                          marginTop: 4,
                        },
                      ]}
                      disabled={index === currentBooks.length - 1}
                    >
                      <Ionicons name="chevron-down" size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Check Order Button */}
            <TouchableOpacity
              style={[styles.checkOrderBtn, { backgroundColor: '#FF9500' }]}
              onPress={handleCheckOrder}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.checkOrderBtnText}>Check Biblical Order</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  gameHeaderTitleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  gameHeaderTitleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  mascotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 16,
  },
  mascotThumb: {
    width: 55,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  mascotSpeech: {
    flex: 1,
  },
  mascotSpeechTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  mascotSpeechText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  difficultyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  difficultyPill: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  difficultyPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  booksList: {
    marginBottom: 18,
  },
  bookItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  positionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  bookTestament: {
    fontSize: 12,
  },
  arrowsColumn: {
    marginLeft: 8,
  },
  arrowBtn: {
    width: 32,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 6,
  },
  checkOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  victoryCard: {
    borderRadius: 22,
    borderWidth: 2,
    padding: 22,
    alignItems: 'center',
    marginVertical: 10,
  },
  victoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  victoryBooksList: {
    width: '100%',
    marginBottom: 16,
  },
  victoryBookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  victoryIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  victoryIndexText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  victoryBookName: {
    fontSize: 14,
    fontWeight: '700',
  },
  victoryBookSub: {
    fontSize: 11,
  },
  rewardBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 18,
  },
  rewardPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    margin: 4,
  },
  rewardPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  playNextBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  playNextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
