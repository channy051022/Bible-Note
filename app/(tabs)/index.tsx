import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBiblePassage } from '../../src/hooks/useBiblePassage';
import { useTheme } from '../../src/hooks/useTheme';
import { VerseItem } from '../../src/components/VerseItem';
import { Verse, BibleSearchMatch } from '../../src/types/bible';
import { BibleRepo } from '../../src/db/bibleRepo';
import { useSQLiteContext } from 'expo-sqlite';

export default function EBibleScreen() {
  const params = useLocalSearchParams<{ bookId?: string | string[]; chapter?: string | string[] }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [fontSize, setFontSize] = useState<number>(18);
  const flatListRef = useRef<FlatList<Verse>>(null);

  // Bottom Quick Jump Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<BibleSearchMatch[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  const {
    bookId,
    chapter,
    currentBook,
    verses,
    isLoading,
    bookmarks,
    goToNextChapter,
    goToPreviousChapter,
    setPassage,
    toggleBookmark,
  } = useBiblePassage();

  // Listen to params from Picker or Search
  useEffect(() => {
    const rawBookId = Array.isArray(params.bookId) ? params.bookId[0] : params.bookId;
    const rawChapter = Array.isArray(params.chapter) ? params.chapter[0] : params.chapter;
    if (rawBookId && rawChapter) {
      const pBook = parseInt(rawBookId, 10);
      const pChap = parseInt(rawChapter, 10);
      if (!isNaN(pBook) && !isNaN(pChap)) {
        setPassage(pBook, pChap);
      }
    }
  }, [params.bookId, params.chapter, setPassage]);

  // Scroll to top whenever chapter changes
  useEffect(() => {
    if (flatListRef.current && verses.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [bookId, chapter, verses.length]);

  // Quick bottom search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await BibleRepo.searchBible(db, searchQuery, 8);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (e) {
        console.error('Quick search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, db]);

  const handleOpenPicker = () => {
    router.push({
      pathname: '/reader/picker',
      params: { currentBookId: bookId.toString(), currentChapter: chapter.toString() },
    });
  };

  const handleJumpToSearchMatch = (match: BibleSearchMatch) => {
    setPassage(match.book_id, match.chapter);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleAddNoteForVerse = (verse: Verse) => {
    const citation = `${currentBook?.name} ${chapter}:${verse.verse}`;
    const initialContent = `> "${verse.text}"\n— **${citation}** (KJV)\n\n`;
    router.push({
      pathname: '/note/new',
      params: {
        initialTitle: `Study Note: ${citation}`,
        initialContent,
      },
    });
  };

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 2, 28));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 2, 14));
  };

  const renderFooter = () => {
    if (verses.length === 0) return null;
    return (
      <View style={[styles.chapterFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerNotice, { color: colors.textSecondary }]}>
          End of {currentBook?.name} Chapter {chapter} ({verses.length} Verses)
        </Text>
        <View style={styles.footerNavRow}>
          {chapter > 1 || bookId > 1 ? (
            <TouchableOpacity
              onPress={goToPreviousChapter}
              style={[styles.footerNavBtn, { backgroundColor: colors.secondaryBackground }]}
            >
              <Ionicons name="arrow-back" size={16} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.footerNavBtnText, { color: colors.text }]}>Prev Chapter</Text>
            </TouchableOpacity>
          ) : <View style={{ flex: 1 }} />}

          {currentBook && (chapter < currentBook.chapters_count || bookId < 66) ? (
            <TouchableOpacity
              onPress={goToNextChapter}
              style={[styles.footerNavBtn, { backgroundColor: colors.tint, marginLeft: 12 }]}
            >
              <Text style={[styles.footerNavBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>Next Chapter</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={handleOpenPicker}
          style={[styles.pickerButton, { backgroundColor: colors.secondaryBackground }]}
          activeOpacity={0.7}
        >
          <Ionicons name="book" size={16} color={colors.tint} style={{ marginRight: 6 }} />
          <Text style={[styles.pickerText, { color: colors.text }]}>
            {currentBook ? `${currentBook.name} ${chapter}` : 'Select Passage'}
          </Text>
          <View style={[styles.versionBadge, { backgroundColor: colors.tintLight }]}>
            <Text style={[styles.versionBadgeText, { color: colors.tint }]}>KJV</Text>
          </View>
          <Ionicons name="chevron-down" size={15} color={colors.textSecondary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Font Controls & Settings Button */}
        <View style={styles.controlsRow}>
          <View style={[styles.fontControls, { backgroundColor: colors.secondaryBackground }]}>
            <TouchableOpacity onPress={decreaseFontSize} style={styles.fontBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={[styles.fontBtnText, { color: colors.textSecondary }]}>A-</Text>
            </TouchableOpacity>
            <View style={[styles.fontDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity onPress={increaseFontSize} style={styles.fontBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={[styles.fontBtnText, { color: colors.textSecondary, fontWeight: '700' }]}>A+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.navButtons}>
            <TouchableOpacity
              onPress={goToPreviousChapter}
              style={[styles.navBtn, { backgroundColor: colors.secondaryBackground }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToNextChapter}
              style={[styles.navBtn, { backgroundColor: colors.secondaryBackground, marginLeft: 6 }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={[styles.settingsBtn, { backgroundColor: colors.secondaryBackground, marginLeft: 8 }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="settings-outline" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Verses Reader */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Scripture...</Text>
        </View>
      ) : verses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Verses Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {currentBook?.name} Chapter {chapter} text is loading.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={verses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <VerseItem
              verse={item}
              fontSize={fontSize}
              isBookmarked={bookmarks.has(item.verse)}
              onToggleBookmark={toggleBookmark}
              onAddNote={handleAddNoteForVerse}
            />
          )}
          contentContainerStyle={styles.versesList}
          showsVerticalScrollIndicator={true}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* Bottom Search Popup Dropdown (when searching) */}
      {showSearchResults && (
        <View style={[styles.searchResultsOverlay, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.resultsHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.resultsHeaderTitle, { color: colors.textSecondary }]}>
              {searchResults.length > 0 ? `Matches for "${searchQuery}"` : `No matches for "${searchQuery}"`}
            </Text>
            <TouchableOpacity onPress={() => setShowSearchResults(false)}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 220 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.searchMatchItem, { borderBottomColor: colors.border }]}
                onPress={() => handleJumpToSearchMatch(item)}
              >
                <View style={styles.matchReferenceRow}>
                  <Ionicons name="book-outline" size={14} color={colors.tint} style={{ marginRight: 4 }} />
                  <Text style={[styles.matchReferenceText, { color: colors.tint }]}>
                    {item.book_name} {item.chapter}:{item.verse}
                  </Text>
                </View>
                <Text style={[styles.matchVerseSnippet, { color: colors.text }]} numberOfLines={1}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Bottom Search Bar */}
      <View style={[styles.bottomSearchContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={[styles.bottomSearchInputWrapper, { backgroundColor: colors.secondaryBackground }]}>
          <Ionicons name="search" size={17} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.bottomSearchInput, { color: colors.text }]}
            placeholder="Quick search verse or chapter (e.g. John 3:16, love)..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.tint} style={{ marginLeft: 6 }} />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  pickerText: {
    fontSize: 15,
    fontWeight: '700',
  },
  versionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  versionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 8,
  },
  fontBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  fontBtnText: {
    fontSize: 12,
  },
  fontDivider: {
    width: 1,
    height: 12,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  versesList: {
    paddingBottom: 40,
  },
  chapterFooter: {
    marginTop: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  footerNotice: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  footerNavRow: {
    flexDirection: 'row',
    width: '100%',
  },
  footerNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  footerNavBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomSearchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
  },
  bottomSearchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchResultsOverlay: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultsHeaderTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchMatchItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  matchReferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  matchReferenceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  matchVerseSnippet: {
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  },
});
