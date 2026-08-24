import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { BibleRepo } from '../src/db/bibleRepo';
import { useTheme } from '../src/hooks/useTheme';
import { Bookmark, BibleVersion } from '../src/types/bible';
import { getItem, StorageKeys } from '../src/utils/storage';

export default function SavedModalScreen() {
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
    router.replace({
      pathname: '/(tabs)/bible',
      params: {
        bookId: bm.book_id.toString(),
        chapter: bm.chapter.toString(),
        verse: bm.verse.toString(),
      },
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
      <Stack.Screen
        options={{
          title: 'Saved Bookmarks',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.doneBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.doneBtnText, { color: colors.tint }]}>Done</Text>
            </TouchableOpacity>
          ),
        }}
      />

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
            style={[styles.bookmarkCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}
            onPress={() => handleOpenBookmark(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.badgeRow}>
                <View style={[styles.bookmarkIconBadge, { backgroundColor: colors.glassHighlight }]}>
                  <Ionicons name="bookmark" size={14} color={colors.gold} />
                </View>
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
  doneBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  bookmarkCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  citation: {
    fontSize: 16,
    fontWeight: '700',
  },
  verseSnippet: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
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
