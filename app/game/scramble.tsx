import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { BibleRepo } from '../../src/db/bibleRepo';
import { getItem, StorageKeys } from '../../src/utils/storage';
import { BibleVersion, Verse } from '../../src/types/bible';
import { AnimatedMascot } from '../../src/components/AnimatedMascot';
import {
  GamificationEngine,
  GameDifficulty,
  GameStats,
} from '../../src/utils/gamificationEngine';
import { GameAudioService } from '../../src/services/gameAudioService';

interface WordTile {
  id: string;
  word: string;
  originalIndex: number;
}

export default function VerseScrambleScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors, isDark } = useTheme();

  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [activeVerse, setActiveVerse] = useState<Verse | null>(null);
  const [bankTiles, setBankTiles] = useState<WordTile[]>([]);
  const [solutionTiles, setSolutionTiles] = useState<WordTile[]>([]);
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [victoryRewards, setVictoryRewards] = useState<{ stars: number; streakBonus: number } | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>(GamificationEngine.getGameStats('scramble'));

  // Mascot feedback & Hint timer state
  const [mascotMessage, setMascotMessage] = useState<string>('Can you put this passage back together?');
  const [showHint, setShowHint] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanWord = (w: string) => w.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '').trim();

  // Load and scramble a verse
  const loadNewScramble = useCallback(async () => {
    setIsLoading(true);
    setIsVictory(false);
    setVictoryRewards(null);
    setShowHint(false);
    setMascotMessage('Can you put this sacred passage back together?');
    GamificationEngine.recordGameAttempt('scramble');
    setGameStats(GamificationEngine.getGameStats('scramble'));
    GameAudioService.playBGM('scramble');

    try {
      const v = getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
      const verse = await BibleRepo.getRandomScrambleVerse(db, v, difficulty);
      setActiveVerse(verse);

      // Tokenize words
      const rawWords = verse.text.split(/\s+/).filter((w) => w.trim().length > 0);
      const cleaned = rawWords.map((w) => cleanWord(w)).filter((w) => w.length > 0);
      setTargetWords(cleaned);

      const tiles: WordTile[] = rawWords.map((w, idx) => ({
        id: `${idx}-${cleanWord(w)}-${Math.random()}`,
        word: cleanWord(w),
        originalIndex: idx,
      }));

      // Shuffle tiles for selection bank
      const shuffled = [...tiles].sort(() => Math.random() - 0.5);
      setBankTiles(shuffled);
      setSolutionTiles([]);

      // 30s timer for Shep Mascot hint
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShowHint(true);
        if (cleaned.length > 0) {
          setMascotMessage(`Hint: The first word of this verse is "${cleaned[0]}"! 💡`);
        }
      }, 30000);
    } catch (e) {
      console.warn('Error loading scramble verse:', e);
    } finally {
      setIsLoading(false);
    }
  }, [db, difficulty]);

  useEffect(() => {
    loadNewScramble();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loadNewScramble]);

  // Tap word tile in selection bank -> move to solution
  const handleBankTilePress = (tile: WordTile) => {
    if (isVictory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    GameAudioService.playTapSound();

    const newBank = bankTiles.filter((t) => t.id !== tile.id);
    const newSolution = [...solutionTiles, tile];
    setBankTiles(newBank);
    setSolutionTiles(newSolution);

    checkWinCondition(newSolution);
  };

  // Tap word tile in solution -> return back to bank
  const handleSolutionTilePress = (tile: WordTile) => {
    if (isVictory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    GameAudioService.playTapSound();

    const newSolution = solutionTiles.filter((t) => t.id !== tile.id);
    const newBank = [...bankTiles, tile];
    setSolutionTiles(newSolution);
    setBankTiles(newBank);
  };

  // Reset all tiles back to bank
  const handleResetTiles = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    GameAudioService.playTapSound();
    setBankTiles([...bankTiles, ...solutionTiles]);
    setSolutionTiles([]);
  };

  // Win evaluation
  const checkWinCondition = (currentSolution: WordTile[]) => {
    if (currentSolution.length !== targetWords.length) return;

    const isMatch = currentSolution.every(
      (tile, index) => tile.word.toLowerCase() === targetWords[index]?.toLowerCase()
    );

    if (isMatch) {
      setIsVictory(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      GameAudioService.playVictoryFanfare();

      const baseStars = difficulty === 'hard' ? 30 : difficulty === 'medium' ? 18 : 10;
      const result = GamificationEngine.recordVictory('scramble', baseStars, currentSolution.length * 10);
      setVictoryRewards({
        stars: baseStars,
        streakBonus: result.streakBonus,
      });
      setGameStats(result.gameStats);
      setMascotMessage(`🐑🎉 Well done! You assembled the verse! +${baseStars} Wool Stars!`);
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

        <View style={[styles.gameHeaderTitleBadge, { backgroundColor: colors.tintLight, borderColor: colors.tint }]}>
          <Text style={[styles.gameHeaderTitleText, { color: colors.tint }]}>
            🧩 Verse Scramble (Lvl {gameStats.level})
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleResetTiles}
          style={[styles.resetBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
          activeOpacity={0.7}
          disabled={solutionTiles.length === 0 || isVictory}
        >
          <Ionicons
            name="refresh-outline"
            size={16}
            color={solutionTiles.length > 0 && !isVictory ? colors.tint : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot Hint & Speech Banner */}
        <View style={[styles.mascotBanner, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          <View style={styles.mascotThumb}>
            <AnimatedMascot width={55} height={60} />
          </View>
          <View style={styles.mascotSpeech}>
            <Text style={[styles.mascotSpeechTitle, { color: colors.tint }]}>SHEP COMPANION</Text>
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
                    backgroundColor: isSelected ? colors.tint : colors.glassInput,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
              >
                <Text style={[styles.difficultyPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {d.toUpperCase()} ({d === 'easy' ? '+10⭐' : d === 'medium' ? '+18⭐' : '+30⭐'})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Scripture Citation Reference */}
        {activeVerse && (
          <View style={styles.referenceRow}>
            <Ionicons name="book-outline" size={14} color={colors.tint} style={{ marginRight: 6 }} />
            <Text style={[styles.referenceText, { color: colors.tint }]}>
              {activeVerse.book_name} {activeVerse.chapter}:{activeVerse.verse}
            </Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Scrambling holy verse...</Text>
          </View>
        ) : isVictory ? (
          /* Victory Card */
          <View style={[styles.victoryCard, { backgroundColor: colors.glassCard, borderColor: colors.tint }]}>
            <Text style={{ fontSize: 44, marginBottom: 8 }}>🏆</Text>
            <Text style={[styles.victoryTitle, { color: colors.text }]}>Praise God! Verse Assembled!</Text>
            <Text style={[styles.fullVerseText, { color: colors.textSecondary }]}>
              "{activeVerse?.text}"
            </Text>

            <View style={styles.rewardBadgesRow}>
              <View style={[styles.rewardPill, { backgroundColor: colors.tintLight, borderColor: colors.tint }]}>
                <Text style={[styles.rewardPillText, { color: colors.tint }]}>+10 Wool Stars 🌟</Text>
              </View>
              {victoryRewards && victoryRewards.streakBonus > 0 ? (
                <View style={[styles.rewardPill, { backgroundColor: 'rgba(255, 149, 0, 0.12)', borderColor: '#FF9500' }]}>
                  <Text style={[styles.rewardPillText, { color: '#FF9500' }]}>
                    +{victoryRewards.streakBonus} Daily Streak Bonus 🔥
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.nextVerseBtn, { backgroundColor: colors.tint }]}
              onPress={loadNewScramble}
              activeOpacity={0.8}
            >
              <Text style={styles.nextVerseBtnText}>Play Next Verse ➔</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 1. Solution Assembly Area */}
            <View style={styles.areaContainer}>
              <View style={styles.areaHeader}>
                <Text style={[styles.areaLabel, { color: colors.textSecondary }]}>YOUR ASSEMBLED VERSE</Text>
                <Text style={[styles.wordCountBadge, { color: colors.tint }]}>
                  {solutionTiles.length} / {targetWords.length} Words
                </Text>
              </View>

              <View
                style={[
                  styles.solutionBox,
                  {
                    backgroundColor: colors.glassInput,
                    borderColor: solutionTiles.length > 0 ? colors.tint : colors.border,
                  },
                ]}
              >
                {solutionTiles.length === 0 ? (
                  <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>
                    Tap word tiles below in the correct biblical order to construct the verse...
                  </Text>
                ) : (
                  solutionTiles.map((tile) => (
                    <TouchableOpacity
                      key={tile.id}
                      style={[styles.wordChip, styles.solutionChip, { backgroundColor: colors.tint, borderColor: colors.tint }]}
                      onPress={() => handleSolutionTilePress(tile)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.wordChipText, { color: '#FFFFFF' }]}>{tile.word}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>

            {/* 2. Selection Word Bank Area */}
            <View style={styles.areaContainer}>
              <Text style={[styles.areaLabel, { color: colors.textSecondary }]}>WORD SELECTION BANK</Text>
              <View style={styles.bankBox}>
                {bankTiles.map((tile) => (
                  <TouchableOpacity
                    key={tile.id}
                    style={[
                      styles.wordChip,
                      styles.bankChip,
                      { backgroundColor: colors.glassCard, borderColor: colors.border },
                    ]}
                    onPress={() => handleBankTilePress(tile)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.wordChipText, { color: colors.text }]}>{tile.word}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
  resetBtn: {
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
    marginBottom: 14,
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
    marginBottom: 12,
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
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  referenceText: {
    fontSize: 14,
    fontWeight: '800',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
  areaContainer: {
    marginBottom: 18,
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  areaLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  wordCountBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  solutionBox: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  placeholderText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    textAlign: 'center',
    width: '100%',
    marginTop: 30,
  },
  bankBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 6,
  },
  wordChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  solutionChip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bankChip: {},
  wordChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  victoryCard: {
    borderRadius: 22,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  victoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  fullVerseText: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 18,
  },
  rewardBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
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
  nextVerseBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  nextVerseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
