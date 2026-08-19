import React, { useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { AnimatedMascot } from '../../src/components/AnimatedMascot';
import {
  GamificationEngine,
  GamificationState,
  GameId,
  GameStats,
  UNLOCKABLE_BADGES,
} from '../../src/utils/gamificationEngine';
import { GameAudioService } from '../../src/services/gameAudioService';

type HubTab = 'games' | 'stats' | 'badges';
type GameCategory = 'all' | 'bible' | 'other';

export default function GameHubScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [currentTab, setCurrentTab] = useState<HubTab>('games');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [gameState, setGameState] = useState<GamificationState>(GamificationEngine.getState());
  const [allStats, setAllStats] = useState<Record<GameId, GameStats>>(GamificationEngine.getAllGameStats());

  useFocusEffect(
    useCallback(() => {
      setGameState(GamificationEngine.getState());
      setAllStats(GamificationEngine.getAllGameStats());
      GameAudioService.playBGM('hub');

      return () => {
        // Will be handed over to next screen BGM or stopped
      };
    }, [])
  );

  const handleExitToSanctuary = () => {
    GameAudioService.stopBGM();
    router.replace('/(tabs)');
  };

  const getRankTitle = (lvl: number) => {
    if (lvl <= 1) return 'Novice Shepherd';
    if (lvl === 2) return 'Explorer Shepherd 🤠';
    if (lvl === 3) return 'Scroll Master 📜';
    if (lvl === 4) return 'Golden Shepherd 🦯';
    return 'Saintly Disciple 😇';
  };

  const gamesCatalog = [
    {
      id: 'scramble' as GameId,
      category: 'bible' as GameCategory,
      title: 'Verse Scramble',
      route: '/game/scramble',
      icon: '🧩',
      accentColor: colors.tint,
      bgColor: colors.tintLight,
      tag: 'BIBLE SANCTUARY • EASY TO HARD',
      description: 'Reconstruct scrambled Bible verses word-by-word into their proper sacred sequence.',
      starsRange: '+10 to +30 ⭐',
    },
    {
      id: 'books_sort' as GameId,
      category: 'bible' as GameCategory,
      title: 'Canonical Book Sorter',
      route: '/game/books-sort',
      icon: '📚',
      accentColor: '#FF9500',
      bgColor: 'rgba(255, 149, 0, 0.12)',
      tag: 'BIBLE SANCTUARY • 3 TO 6 BOOKS',
      description: 'Arrange randomized Holy Bible books into chronological canonical order from Genesis to Revelation.',
      starsRange: '+15 to +35 ⭐',
    },
    {
      id: 'trivia' as GameId,
      category: 'bible' as GameCategory,
      title: 'Scripture & Character Trivia',
      route: '/game/trivia',
      icon: '📜',
      accentColor: '#AF52DE',
      bgColor: 'rgba(175, 82, 222, 0.12)',
      tag: 'BIBLE SANCTUARY • 4 CHOICES',
      description: 'Test your biblical wisdom with multiple-choice questions, live score tracking, and scripture citations.',
      starsRange: '+15 to +40 ⭐',
    },
    {
      id: 'crossword' as GameId,
      category: 'other' as GameCategory,
      title: 'English Wordscapes Crossword',
      route: '/game/crossword',
      icon: '✝️',
      accentColor: '#34C759',
      bgColor: 'rgba(52, 199, 89, 0.12)',
      tag: 'WORD & BRAIN • 50 LEVELS',
      description: 'Connect letters on the circular wheel to solve dynamic Wordscapes crossword puzzles with 50 levels.',
      starsRange: '+20 to +50 ⭐',
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Dedicated Game Hub Navigation Header */}
      <View style={[styles.topNavHeader, { borderBottomColor: colors.border, backgroundColor: colors.glassBackground }]}>
        <TouchableOpacity
          onPress={handleExitToSanctuary}
          style={[styles.exitBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color={colors.text} style={{ marginRight: 4 }} />
          <Text style={[styles.exitBtnText, { color: colors.text }]}>Exit Sanctuary</Text>
        </TouchableOpacity>

        <View style={styles.statsBadgesRow}>
          {/* Wool Stars Badge */}
          <View style={[styles.statBadge, { backgroundColor: colors.tintLight, borderColor: colors.tint }]}>
            <Text style={styles.statIcon}>🌟</Text>
            <Text style={[styles.statBadgeText, { color: colors.tint }]}>{gameState.woolStars}</Text>
          </View>

          {/* Daily Streak Badge */}
          <View style={[styles.statBadge, { backgroundColor: 'rgba(255, 149, 0, 0.12)', borderColor: '#FF9500' }]}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={[styles.statBadgeText, { color: '#FF9500' }]}>{gameState.dailyStreak}d</Text>
          </View>

          {/* Settings Button */}
          <TouchableOpacity
            onPress={() => router.push('/game/settings')}
            style={[styles.settingsBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Ionicons name="settings-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* In-Hub Navigation Bar */}
      <View style={[styles.hubNavBar, { borderBottomColor: colors.border, backgroundColor: colors.glassBackground }]}>
        <TouchableOpacity
          onPress={() => setCurrentTab('games')}
          style={[
            styles.hubNavTab,
            currentTab === 'games' && { borderBottomColor: colors.tint, borderBottomWidth: 3 },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="game-controller"
            size={16}
            color={currentTab === 'games' ? colors.tint : colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.hubNavTabText,
              { color: currentTab === 'games' ? colors.tint : colors.textSecondary, fontWeight: currentTab === 'games' ? '800' : '600' },
            ]}
          >
            Games List
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentTab('stats')}
          style={[
            styles.hubNavTab,
            currentTab === 'stats' && { borderBottomColor: colors.tint, borderBottomWidth: 3 },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="stats-chart"
            size={16}
            color={currentTab === 'stats' ? colors.tint : colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.hubNavTabText,
              { color: currentTab === 'stats' ? colors.tint : colors.textSecondary, fontWeight: currentTab === 'stats' ? '800' : '600' },
            ]}
          >
            Stats & Scores
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentTab('badges')}
          style={[
            styles.hubNavTab,
            currentTab === 'badges' && { borderBottomColor: colors.tint, borderBottomWidth: 3 },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="trophy"
            size={16}
            color={currentTab === 'badges' ? colors.tint : colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.hubNavTabText,
              { color: currentTab === 'badges' ? colors.tint : colors.textSecondary, fontWeight: currentTab === 'badges' ? '800' : '600' },
            ]}
          >
            Badges
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentTab === 'games' ? (
          /* TAB 1: GAMES LIST */
          <>
            <View style={styles.hubTitleSection}>
              <Text style={[styles.hubSubtitle, { color: colors.tint }]}>SHEPHERD ARCADE</Text>
              <Text style={[styles.hubTitle, { color: colors.text }]}>Bible & Word Games</Text>
            </View>

            {/* Category Filter Chips */}
            <View style={styles.categoryFilterRow}>
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === 'all'
                    ? { backgroundColor: colors.tint, borderColor: colors.tint }
                    : { backgroundColor: colors.glassInput, borderColor: colors.border },
                ]}
                onPress={() => setSelectedCategory('all')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: selectedCategory === 'all' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  All Games ({gamesCatalog.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === 'bible'
                    ? { backgroundColor: colors.tint, borderColor: colors.tint }
                    : { backgroundColor: colors.glassInput, borderColor: colors.border },
                ]}
                onPress={() => setSelectedCategory('bible')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: selectedCategory === 'bible' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  📖 Bible Sanctuary ({gamesCatalog.filter((g) => g.category === 'bible').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === 'other'
                    ? { backgroundColor: colors.tint, borderColor: colors.tint }
                    : { backgroundColor: colors.glassInput, borderColor: colors.border },
                ]}
                onPress={() => setSelectedCategory('other')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: selectedCategory === 'other' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  🧩 Word & Brain ({gamesCatalog.filter((g) => g.category === 'other').length})
                </Text>
              </TouchableOpacity>
            </View>

            {gamesCatalog
              .filter((game) => selectedCategory === 'all' || game.category === selectedCategory)
              .map((game) => {
                const stats = allStats[game.id];
                return (
                  <TouchableOpacity
                    key={game.id}
                    style={[styles.gameCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}
                    onPress={() => router.push(game.route as any)}
                    activeOpacity={0.8}
                  >
                  <View style={styles.gameCardTop}>
                    <View style={[styles.gameIconBox, { backgroundColor: game.bgColor }]}>
                      <Text style={{ fontSize: 30 }}>{game.icon}</Text>
                    </View>
                    <View style={styles.gameCardContent}>
                      <View style={styles.rewardTagRow}>
                        <View style={[styles.rewardTag, { backgroundColor: game.bgColor, borderColor: game.accentColor }]}>
                          <Text style={[styles.rewardTagText, { color: game.accentColor }]}>{game.starsRange}</Text>
                        </View>
                        <View style={[styles.levelPill, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                          <Text style={[styles.levelPillText, { color: colors.textSecondary }]}>
                            LVL {stats?.level || 1}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.gameTitle, { color: colors.text }]}>{game.title}</Text>
                      <Text style={[styles.gameDescription, { color: colors.textSecondary }]}>
                        {game.description}
                      </Text>

                      {/* High score and wins preview */}
                      <View style={styles.statsPreviewRow}>
                        <Text style={[styles.statsPreviewText, { color: colors.textTertiary }]}>
                          🏆 {stats?.gamesWon || 0} Wins • High Score: {stats?.highScore || 0}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.playBtnRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.playBtnText, { color: game.accentColor }]}>
                      Play {game.title} (Easy / Med / Hard)
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={game.accentColor} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        ) : currentTab === 'stats' ? (
          /* TAB 2: STATS & SCORES BREAKDOWN */
          <>
            <View style={styles.hubTitleSection}>
              <Text style={[styles.hubSubtitle, { color: colors.tint }]}>CAREER RECORDS</Text>
              <Text style={[styles.hubTitle, { color: colors.text }]}>Game Stats & Scores</Text>
            </View>

            {/* Total Summary Row */}
            <View style={[styles.summaryCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: colors.tint }]}>{gameState.woolStars}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Stars</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#FF9500' }]}>{gameState.gamesWonCount}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Victories</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#34C759' }]}>{gameState.dailyStreak} Days</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Streak</Text>
              </View>
            </View>

            {/* Per-Game Detailed Stats Cards */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 14 }]}>
              PER-GAME PERFORMANCE
            </Text>

            {gamesCatalog.map((game) => {
              const stats = allStats[game.id];
              const winRate =
                stats && stats.gamesPlayed > 0
                  ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                  : 0;

              return (
                <View
                  key={game.id}
                  style={[styles.statDetailCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}
                >
                  <View style={styles.statDetailHeader}>
                    <Text style={{ fontSize: 24, marginRight: 10 }}>{game.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statDetailGameTitle, { color: colors.text }]}>{game.title}</Text>
                      <Text style={[styles.statDetailLevel, { color: game.accentColor }]}>
                        Current Level {stats?.level || 1} • {stats?.totalStarsEarned || 0} Total Stars
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statGrid}>
                    <View style={[styles.statGridBox, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                      <Text style={[styles.statGridNum, { color: colors.text }]}>{stats?.gamesWon || 0}</Text>
                      <Text style={[styles.statGridLabel, { color: colors.textSecondary }]}>Games Won</Text>
                    </View>
                    <View style={[styles.statGridBox, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                      <Text style={[styles.statGridNum, { color: colors.text }]}>{stats?.gamesPlayed || 0}</Text>
                      <Text style={[styles.statGridLabel, { color: colors.textSecondary }]}>Attempts</Text>
                    </View>
                    <View style={[styles.statGridBox, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                      <Text style={[styles.statGridNum, { color: '#34C759' }]}>{winRate}%</Text>
                      <Text style={[styles.statGridLabel, { color: colors.textSecondary }]}>Win Rate</Text>
                    </View>
                    <View style={[styles.statGridBox, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                      <Text style={[styles.statGridNum, { color: game.accentColor }]}>{stats?.highScore || 0}</Text>
                      <Text style={[styles.statGridLabel, { color: colors.textSecondary }]}>High Score</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          /* TAB 3: BADGES & LEVEL WARDROBE */
          <>
            <View style={styles.hubTitleSection}>
              <Text style={[styles.hubSubtitle, { color: colors.tint }]}>SHEP COMPANION</Text>
              <Text style={[styles.hubTitle, { color: colors.text }]}>Badges & Wardrobe</Text>
            </View>

            {/* Gamification Hero / Mascot Card */}
            <View style={[styles.heroCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
              <View style={styles.heroTop}>
                <View style={styles.mascotContainer}>
                  <AnimatedMascot width={85} height={95} />
                </View>

                <View style={styles.heroInfo}>
                  <View style={[styles.levelBadge, { backgroundColor: colors.tint }]}>
                    <Text style={styles.levelBadgeText}>LEVEL {gameState.level}</Text>
                  </View>
                  <Text style={[styles.rankTitle, { color: colors.text }]}>{getRankTitle(gameState.level)}</Text>
                  <Text style={[styles.gamesWonText, { color: colors.textSecondary }]}>
                    🏆 {gameState.gamesWonCount} Scripture Victories
                  </Text>
                </View>
              </View>

              {/* Progress Bar to next level */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                    Progress to Level {gameState.level + 1}
                  </Text>
                  <Text style={[styles.progressValues, { color: colors.tint }]}>
                    {gameState.progressPercent}% ({gameState.starsToNextLevel} stars to go)
                  </Text>
                </View>
                <View style={[styles.progressBarTrack, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${gameState.progressPercent}%`,
                        backgroundColor: colors.tint,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Unlockables & Badges Shelf */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 10 }]}>
              ALL SHEPHERD BADGES
            </Text>
            {UNLOCKABLE_BADGES.map((badge) => {
              const isUnlocked = gameState.level >= badge.requiredLevel;
              return (
                <View
                  key={badge.id}
                  style={[
                    styles.badgeFullCard,
                    {
                      backgroundColor: isUnlocked ? colors.glassCard : colors.glassInput,
                      borderColor: isUnlocked ? colors.tint : colors.border,
                      opacity: isUnlocked ? 1 : 0.6,
                    },
                  ]}
                >
                  <Text style={styles.badgeFullIcon}>{badge.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.badgeFullName, { color: colors.text }]}>{badge.name}</Text>
                    <Text style={[styles.badgeFullDesc, { color: colors.textSecondary }]}>{badge.description}</Text>
                  </View>
                  <View style={[styles.badgeStatusPill, { backgroundColor: isUnlocked ? colors.tintLight : colors.glassInput }]}>
                    <Text style={[styles.badgeStatusText, { color: isUnlocked ? colors.tint : colors.textTertiary }]}>
                      {isUnlocked ? 'UNLOCKED ✓' : `LVL ${badge.requiredLevel}`}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Daily Streak Bonus Card */}
            <View style={[styles.streakBonusCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="flame" size={20} color="#FF9500" style={{ marginRight: 6 }} />
                <Text style={[styles.streakBonusTitle, { color: colors.text }]}>Daily Streak Bonus</Text>
              </View>
              <Text style={[styles.streakBonusDesc, { color: colors.textSecondary }]}>
                Play games daily to keep your flame burning and earn a <Text style={{ fontWeight: '700', color: colors.tint }}>+25 Wool Stars</Text> consecutive day bonus!
              </Text>
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
  topNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  exitBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
  },
  statIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  statBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  hubNavBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  hubNavTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  hubNavTabText: {
    fontSize: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  hubTitleSection: {
    marginBottom: 10,
  },
  hubSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  hubTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  categoryFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gameCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 14,
    overflow: 'hidden',
  },
  gameCardTop: {
    flexDirection: 'row',
    padding: 16,
  },
  gameIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  gameCardContent: {
    flex: 1,
  },
  rewardTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rewardTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  rewardTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  levelPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  levelPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  statsPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsPreviewText: {
    fontSize: 11,
    fontWeight: '600',
  },
  playBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  playBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  statDetailCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
  },
  statDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statDetailGameTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  statDetailLevel: {
    fontSize: 11,
    fontWeight: '700',
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statGridBox: {
    flex: 1,
    marginHorizontal: 3,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statGridNum: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  statGridLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  mascotContainer: {
    width: 85,
    height: 95,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroInfo: {
    flex: 1,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  gamesWonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressValues: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  badgeFullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  badgeFullIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  badgeFullName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  badgeFullDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  badgeStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  streakBonusCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 6,
  },
  streakBonusTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  streakBonusDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
});
