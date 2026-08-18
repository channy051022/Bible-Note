import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { BibleRepo } from '../../src/db/bibleRepo';
import { useTheme } from '../../src/hooks/useTheme';
import { Bookmark, BibleVersion } from '../../src/types/bible';
import { getItem, StorageKeys } from '../../src/utils/storage';

export default function SavedScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookmarks = useCallback(async () => {
    try {
      setIsLoading(true);
      const version = getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
      const data = await BibleRepo.getBookmarks(db, version);
      setBookmarks(data);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [loadBookmarks])
  );

  const handleOpenBookmark = (bm: Bookmark) => {
    router.push({
      pathname: '/(tabs)',
      params: { bookId: bm.book_id.toString(), chapter: bm.chapter.toString() },
    });
  };

  const handleRemoveBookmark = (bm: Bookmark) => {
    Alert.alert('Remove Bookmark', 'Remove this verse from saved bookmarks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await BibleRepo.toggleBookmark(db, bm.book_id, bm.chapter, bm.verse);
          loadBookmarks();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Bookmarks Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Bookmarks ({bookmarks.length})
        </Text>
      </View>

      {/* Bookmarks List */}
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={44} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Bookmarks Saved</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Tap the bookmark icon beside any verse in the reader to save it here.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.bookmarkCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleOpenBookmark(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.badgeRow}>
                <Ionicons name="bookmark" size={16} color={colors.gold} style={{ marginRight: 6 }} />
                <Text style={[styles.citation, { color: colors.text }]}>
                  {item.book_name} {item.chapter}:{item.verse}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveBookmark(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </TouchableOpacity>
            </View>

            {item.verse_text ? (
              <Text style={[styles.verseSnippet, { color: colors.textSecondary }]} numberOfLines={3}>
                "{item.verse_text}"
              </Text>
            ) : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  bookmarkCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  citation: {
    fontSize: 16,
    fontWeight: '700',
  },
  verseSnippet: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});

