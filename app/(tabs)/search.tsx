import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { BibleRepo } from '../../src/db/bibleRepo';
import { NotesRepo } from '../../src/db/notesRepo';
import { useTheme } from '../../src/hooks/useTheme';
import { SearchBar } from '../../src/components/SearchBar';
import { BibleSearchMatch, BibleVersion } from '../../src/types/bible';
import { NoteSearchMatch } from '../../src/types/note';
import { getItem, StorageKeys } from '../../src/utils/storage';

type SearchScope = 'bible' | 'notes';

export default function SearchScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('bible');
  const [isSearching, setIsSearching] = useState(false);
  const [bibleResults, setBibleResults] = useState<BibleSearchMatch[]>([]);
  const [noteResults, setNoteResults] = useState<NoteSearchMatch[]>([]);

  // Execute search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setBibleResults([]);
      setNoteResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (scope === 'bible') {
          const version = getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
          const results = await BibleRepo.searchBible(db, query, 60, version);
          setBibleResults(results);
        } else {
          const results = await NotesRepo.searchNotes(db, query);
          setNoteResults(results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, scope, db]);

  const handleSelectBibleMatch = (match: BibleSearchMatch) => {
    router.navigate({
      pathname: '/(tabs)',
      params: { bookId: match.book_id.toString(), chapter: match.chapter.toString() },
    });
  };

  const handleSelectNoteMatch = (note: NoteSearchMatch) => {
    router.push({
      pathname: '/note/[id]',
      params: { id: note.id.toString() },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Input Bar */}
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={scope === 'bible' ? 'Search books, citations (John 3:16), or keywords...' : 'Search note titles & content...'}
        onClear={() => setQuery('')}
      />

      {/* Scope Segmented Control */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.secondaryBackground }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, scope === 'bible' ? [styles.segmentBtnActive, { backgroundColor: colors.card }] : null]}
          onPress={() => setScope('bible')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="book"
            size={16}
            color={scope === 'bible' ? colors.tint : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, { color: scope === 'bible' ? colors.tint : colors.textSecondary, fontWeight: scope === 'bible' ? '700' : '500' }]}>
            Bible ({bibleResults.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, scope === 'notes' ? [styles.segmentBtnActive, { backgroundColor: colors.card }] : null]}
          onPress={() => setScope('notes')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="document-text"
            size={16}
            color={scope === 'notes' ? colors.tint : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, { color: scope === 'notes' ? colors.tint : colors.textSecondary, fontWeight: scope === 'notes' ? '700' : '500' }]}>
            Notes ({noteResults.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Results List */}
      {isSearching ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.tint} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>Searching 66 books & 31,102 verses...</Text>
        </View>
      ) : query.trim() && (scope === 'bible' ? bibleResults.length === 0 : noteResults.length === 0) ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={44} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            No matches found for "{query}". Try book names (e.g. Genesis, Matthew), citations (John 3:16), or keywords (love, faith).
          </Text>
        </View>
      ) : scope === 'bible' ? (
        <FlatList
          data={bibleResults}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => {
            if (item.is_book_match) {
              return (
                <TouchableOpacity
                  style={[styles.bookMatchCard, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}
                  onPress={() => handleSelectBibleMatch(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bookMatchIconWrapper}>
                    <Ionicons name="book" size={22} color={colors.tint} />
                  </View>
                  <View style={styles.bookMatchInfo}>
                    <View style={styles.bookMatchTitleRow}>
                      <Text style={[styles.bookMatchName, { color: colors.text }]}>{item.book_name}</Text>
                      <View style={[styles.bookMatchBadge, { backgroundColor: colors.tintLight }]}>
                        <Text style={[styles.bookMatchBadgeText, { color: colors.tint }]}>Book</Text>
                      </View>
                    </View>
                    <Text style={[styles.bookMatchSubtitle, { color: colors.textSecondary }]}>
                      {item.chapters_count} Chapters • Tap to Open Chapter 1
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                style={[styles.resultItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectBibleMatch(item)}
                activeOpacity={0.7}
              >
                <View style={styles.resultHeader}>
                  <Text style={[styles.referenceTitle, { color: colors.tint }]}>
                    {item.book_name} {item.chapter}:{item.verse}
                  </Text>
                </View>
                <Text style={[styles.resultSnippet, { color: colors.text }]} numberOfLines={3}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <FlatList
          data={noteResults}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.resultItem, { borderBottomColor: colors.border }]}
              onPress={() => handleSelectNoteMatch(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.noteTitle, { color: colors.text }]}>{item.title || 'Untitled Note'}</Text>
              <Text style={[styles.resultSnippet, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.content}
              </Text>
              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {item.tags.map((t) => (
                    <Text key={t} style={[styles.tagText, { color: colors.tint }]}>
                      #{t}{' '}
                    </Text>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 9,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 7,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    marginTop: 8,
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 60,
  },
  bookMatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bookMatchIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookMatchInfo: {
    flex: 1,
  },
  bookMatchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookMatchName: {
    fontSize: 16,
    fontWeight: '700',
  },
  bookMatchBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  bookMatchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bookMatchSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultHeader: {
    marginBottom: 4,
  },
  referenceTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultSnippet: {
    fontSize: 15,
    lineHeight: 21,
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
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
