import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { DevotionsRepo } from '../../src/db/devotionsRepo';
import {
  Devotion,
  DevotionCategory,
  DEVOTION_CATEGORIES,
  DevotionStreakInfo,
  DevotionUserEntry,
} from '../../src/types/devotion';
import { CURATED_DEVOTIONS, getTodayDevotion } from '../../src/data/devotionsData';
import { DevotionCard } from '../../src/components/DevotionCard';
import { DevotionMascot } from '../../src/components/DevotionMascot';

type DevotionTab = 'daily' | 'my_devotions' | 'favorites' | 'history';

export default function DevotionScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  // Selected sub-tab
  const [activeTab, setActiveTab] = useState<DevotionTab>('daily');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data states
  const [todayDevotion, setTodayDevotion] = useState<Devotion>(getTodayDevotion());
  const [todayEntry, setTodayEntry] = useState<DevotionUserEntry | null>(null);
  const [userDevotions, setUserDevotions] = useState<Devotion[]>([]);
  const [favoriteEntries, setFavoriteEntries] = useState<{ entry: DevotionUserEntry; devotion: Devotion }[]>([]);
  const [historyEntries, setHistoryEntries] = useState<{ entry: DevotionUserEntry; devotion: Devotion }[]>([]);
  const [streakInfo, setStreakInfo] = useState<DevotionStreakInfo>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompleted: 0,
    encouragingMessage: 'Keep walking with God.',
  });
  const [entriesMap, setEntriesMap] = useState<Record<string, DevotionUserEntry>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load all devotion data
  const loadDevotionData = useCallback(async () => {
    try {
      setIsLoading(true);
      const today = getTodayDevotion();
      setTodayDevotion(today);

      // 1. Fetch today's entry
      const tEntry = await DevotionsRepo.getUserEntry(db, today.id);
      setTodayEntry(tEntry);

      // 2. Fetch user-created devotions
      const uDevs = await DevotionsRepo.getUserCreatedDevotions(db);
      setUserDevotions(uDevs);

      // 3. Fetch favorites & history
      const favs = await DevotionsRepo.getFavoriteDevotions(db);
      setFavoriteEntries(favs);

      const hist = await DevotionsRepo.getCompletedDevotionsHistory(db);
      setHistoryEntries(hist);

      // 4. Calculate streak
      const streak = await DevotionsRepo.getDevotionStreak(db);
      setStreakInfo(streak);

      // 5. Build user entry lookup map for all devotions
      const map: Record<string, DevotionUserEntry> = {};
      if (tEntry) map[today.id] = tEntry;
      favs.forEach((f) => {
        map[f.devotion.id] = f.entry;
      });
      hist.forEach((h) => {
        map[h.devotion.id] = h.entry;
      });
      setEntriesMap(map);
    } catch (e) {
      console.error('Error loading devotion data:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadDevotionData();
    }, [loadDevotionData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDevotionData();
  };

  // Toggle favorite helper
  const handleToggleFavorite = async (devotionId: string) => {
    try {
      const isFav = await DevotionsRepo.toggleFavorite(db, devotionId);
      setEntriesMap((prev) => {
        const existing = prev[devotionId] || {
          devotionId,
          isCompleted: false,
          isFavorite: false,
        };
        return {
          ...prev,
          [devotionId]: {
            ...existing,
            isFavorite: isFav,
          },
        };
      });
      // Refresh favorites list in background
      const favs = await DevotionsRepo.getFavoriteDevotions(db);
      setFavoriteEntries(favs);
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  const handleOpenDevotion = (devotionId: string) => {
    router.push({
      pathname: '/devotion/[id]',
      params: { id: devotionId },
    });
  };

  const handleCreateDevotion = () => {
    router.push('/devotion/new');
  };

  // Filtered lists
  const filteredDailyList = useMemo(() => {
    let list = CURATED_DEVOTIONS;
    if (selectedCategory !== 'All') {
      list = list.filter((d) => d.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.scriptureCitation.toLowerCase().includes(q) ||
          d.reflectionContent.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  const filteredUserList = useMemo(() => {
    let list = userDevotions;
    if (selectedCategory !== 'All') {
      list = list.filter((d) => d.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.scriptureCitation.toLowerCase().includes(q) ||
          d.reflectionContent.toLowerCase().includes(q)
      );
    }
    return list;
  }, [userDevotions, selectedCategory, searchQuery]);

  const filteredFavoriteList = useMemo(() => {
    let list = favoriteEntries;
    if (selectedCategory !== 'All') {
      list = list.filter((item) => item.devotion.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.devotion.title.toLowerCase().includes(q) ||
          item.devotion.scriptureCitation.toLowerCase().includes(q)
      );
    }
    return list;
  }, [favoriteEntries, selectedCategory, searchQuery]);

  const filteredHistoryList = useMemo(() => {
    let list = historyEntries;
    if (selectedCategory !== 'All') {
      list = list.filter((item) => item.devotion.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.devotion.title.toLowerCase().includes(q) ||
          item.devotion.scriptureCitation.toLowerCase().includes(q)
      );
    }
    return list;
  }, [historyEntries, selectedCategory, searchQuery]);

  const isTodayCompleted = todayEntry?.isCompleted ?? false;
  const isTodayFav = todayEntry?.isFavorite ?? false;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Daily Devotion</Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={[styles.streakText, { color: colors.gold }]}>
              {streakInfo.currentStreak > 0
                ? `${streakInfo.currentStreak} Day Devotion Streak`
                : 'Start your streak today'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.tint }]}
          onPress={handleCreateDevotion}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
      >
        {/* Streak & Encouragement Card */}
        <View style={[styles.streakCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          <View style={styles.streakCardLeft}>
            <View style={[styles.streakBadgeIcon, { backgroundColor: colors.glassHighlight }]}>
              <Text style={{ fontSize: 24 }}>🔥</Text>
            </View>
            <View style={styles.streakTextCol}>
              <Text style={[styles.streakCountTitle, { color: colors.text }]}>
                {streakInfo.currentStreak} {streakInfo.currentStreak === 1 ? 'Day' : 'Days'} with God
              </Text>
              <Text style={[styles.streakMessage, { color: colors.textSecondary }]}>
                "{streakInfo.encouragingMessage}"
              </Text>
            </View>
          </View>

          <DevotionMascot mood={isTodayCompleted ? 'happy' : 'reading'} size={48} />
        </View>

        {/* 1. Today's Devotion Hero Card (Aligned with Daily Verse) */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={[
              styles.todayHeroCard,
              {
                backgroundColor: colors.glassCard,
                borderColor: isTodayCompleted ? colors.success : colors.border,
              },
            ]}
            onPress={() => handleOpenDevotion(todayDevotion.id)}
            activeOpacity={0.85}
          >
            {/* Small Label & Date */}
            <View style={styles.heroTopRow}>
              <View style={[styles.todayBadge, { backgroundColor: colors.tintLight }]}>
                <Ionicons name="sunny" size={12} color={colors.tint} style={{ marginRight: 4 }} />
                <Text style={[styles.todayBadgeText, { color: colors.tint }]}>TODAY'S DEVOTION</Text>
              </View>

              <View style={styles.heroMetaRight}>
                <Text style={[styles.heroDateText, { color: colors.textTertiary }]}>
                  {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
                <TouchableOpacity
                  onPress={() => handleToggleFavorite(todayDevotion.id)}
                  style={styles.heroFavBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={isTodayFav ? 'heart' : 'heart-outline'}
                    size={18}
                    color={isTodayFav ? '#E11D48' : colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.heroTitle, { color: colors.text }]}>{todayDevotion.title}</Text>

            {/* Bible Reference */}
            <View style={styles.heroVerseRow}>
              <Text style={[styles.heroVerseRef, { color: colors.tint }]}>
                📖 {todayDevotion.scriptureCitation}
              </Text>
              <View style={[styles.heroCategoryPill, { backgroundColor: colors.glassInput }]}>
                <Text style={[styles.heroCategoryText, { color: colors.textSecondary }]}>
                  {todayDevotion.category}
                </Text>
              </View>
            </View>

            {/* Short Preview */}
            <Text style={[styles.heroPreview, { color: colors.textSecondary }]} numberOfLines={3}>
              "{todayDevotion.reflectionContent.replace(/\n+/g, ' ')}"
            </Text>

            {/* Hero Footer Action */}
            <View style={[styles.heroFooter, { borderTopColor: colors.border }]}>
              <View style={styles.heroTimeBadge}>
                <Ionicons name="time-outline" size={13} color={colors.textTertiary} style={{ marginRight: 4 }} />
                <Text style={[styles.heroTimeText, { color: colors.textTertiary }]}>
                  {todayDevotion.estimatedReadingMinutes} min read
                </Text>
              </View>

              <View style={[styles.heroStartBtn, { backgroundColor: isTodayCompleted ? colors.success : colors.tint }]}>
                <Text style={styles.heroStartBtnText}>
                  {isTodayCompleted ? '✓ Completed • Read Again' : 'Start Devotion →'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 2. Sub-Tabs (Daily & Curated | My Devotions | Favorites | History) */}
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            style={[
              styles.subTabButton,
              activeTab === 'daily' && [styles.subTabActive, { borderBottomColor: colors.tint }],
            ]}
            onPress={() => setActiveTab('daily')}
          >
            <Text
              style={[
                styles.subTabText,
                { color: activeTab === 'daily' ? colors.tint : colors.textSecondary },
              ]}
            >
              Curated ({CURATED_DEVOTIONS.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subTabButton,
              activeTab === 'my_devotions' && [styles.subTabActive, { borderBottomColor: colors.tint }],
            ]}
            onPress={() => setActiveTab('my_devotions')}
          >
            <Text
              style={[
                styles.subTabText,
                { color: activeTab === 'my_devotions' ? colors.tint : colors.textSecondary },
              ]}
            >
              My Devotions ({userDevotions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subTabButton,
              activeTab === 'favorites' && [styles.subTabActive, { borderBottomColor: colors.tint }],
            ]}
            onPress={() => setActiveTab('favorites')}
          >
            <Text
              style={[
                styles.subTabText,
                { color: activeTab === 'favorites' ? colors.tint : colors.textSecondary },
              ]}
            >
              Favorites ({favoriteEntries.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subTabButton,
              activeTab === 'history' && [styles.subTabActive, { borderBottomColor: colors.tint }],
            ]}
            onPress={() => setActiveTab('history')}
          >
            <Text
              style={[
                styles.subTabText,
                { color: activeTab === 'history' ? colors.tint : colors.textSecondary },
              ]}
            >
              History ({historyEntries.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Search Bar */}
        <View style={[styles.searchBarContainer, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search devotions by title or verse..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* 4. Horizontal Categories Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === 'All' ? colors.tint : colors.glassInput,
                borderColor: selectedCategory === 'All' ? colors.tint : colors.border,
              },
            ]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: selectedCategory === 'All' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {DEVOTION_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? colors.tint : colors.glassInput,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. Tab Content Lists */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Opening quiet devotional sanctuary...
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {/* Tab: Daily & Curated */}
            {activeTab === 'daily' && (
              filteredDailyList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={36} color={colors.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No devotions match your filter</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    Try clearing the category filter or search query.
                  </Text>
                </View>
              ) : (
                filteredDailyList.map((dev) => {
                  const entry = entriesMap[dev.id];
                  return (
                    <DevotionCard
                      key={dev.id}
                      devotion={dev}
                      isCompleted={entry?.isCompleted ?? false}
                      isFavorite={entry?.isFavorite ?? false}
                      onPress={() => handleOpenDevotion(dev.id)}
                      onToggleFavorite={() => handleToggleFavorite(dev.id)}
                    />
                  );
                })
              )
            )}

            {/* Tab: My Devotions (User Created) */}
            {activeTab === 'my_devotions' && (
              filteredUserList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <DevotionMascot mood="writing" size={54} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Custom Devotions Yet</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    Write your own devotional reflections on scripture and save them here.
                  </Text>
                  <TouchableOpacity
                    style={[styles.emptyCreateBtn, { backgroundColor: colors.tint }]}
                    onPress={handleCreateDevotion}
                  >
                    <Ionicons name="create-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyCreateBtnText}>Create Your First Devotion</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredUserList.map((dev) => {
                  const entry = entriesMap[dev.id];
                  return (
                    <DevotionCard
                      key={dev.id}
                      devotion={dev}
                      isCompleted={entry?.isCompleted ?? false}
                      isFavorite={entry?.isFavorite ?? false}
                      onPress={() => handleOpenDevotion(dev.id)}
                      onToggleFavorite={() => handleToggleFavorite(dev.id)}
                    />
                  );
                })
              )
            )}

            {/* Tab: Favorites */}
            {activeTab === 'favorites' && (
              filteredFavoriteList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="heart-outline" size={40} color={colors.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Favorite Devotions</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    Tap the heart icon on any devotion to save it here for quick reflection.
                  </Text>
                </View>
              ) : (
                filteredFavoriteList.map(({ entry, devotion }) => (
                  <DevotionCard
                    key={devotion.id}
                    devotion={devotion}
                    isCompleted={entry.isCompleted}
                    isFavorite={true}
                    onPress={() => handleOpenDevotion(devotion.id)}
                    onToggleFavorite={() => handleToggleFavorite(devotion.id)}
                  />
                ))
              )
            )}

            {/* Tab: History */}
            {activeTab === 'history' && (
              filteredHistoryList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={40} color={colors.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Completed Devotions Yet</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    Complete your daily devotions to build a personal history of quiet time with God.
                  </Text>
                </View>
              ) : (
                filteredHistoryList.map(({ entry, devotion }) => (
                  <DevotionCard
                    key={devotion.id}
                    devotion={devotion}
                    isCompleted={true}
                    isFavorite={entry.isFavorite}
                    completionDate={entry.completedAt}
                    onPress={() => handleOpenDevotion(devotion.id)}
                    onToggleFavorite={() => handleToggleFavorite(devotion.id)}
                  />
                ))
              )
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  streakFlame: {
    fontSize: 12,
    marginRight: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  streakCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  streakBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streakTextCol: {
    flex: 1,
  },
  streakCountTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  streakMessage: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  heroSection: {
    marginBottom: 16,
  },
  todayHeroCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroDateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroFavBtn: {
    padding: 2,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 25,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  heroVerseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  heroVerseRef: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroCategoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  heroCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroPreview: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  heroTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  heroStartBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  heroStartBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabNavRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
    marginBottom: 12,
  },
  subTabButton: {
    paddingVertical: 10,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: {
    borderBottomWidth: 2,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  categoriesScroll: {
    paddingBottom: 14,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    marginTop: 4,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
