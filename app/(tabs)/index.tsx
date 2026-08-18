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
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBiblePassage } from '../../src/hooks/useBiblePassage';
import { useTheme } from '../../src/hooks/useTheme';
import { VerseItem } from '../../src/components/VerseItem';
import { Verse, BibleSearchMatch, BibleVersion } from '../../src/types/bible';
import { BibleRepo } from '../../src/db/bibleRepo';
import { BIBLE_VERSIONS } from '../../src/constants/BibleVersions';
import { useSQLiteContext } from 'expo-sqlite';

export default function EBibleScreen() {
  const params = useLocalSearchParams<{ bookId?: string | string[]; chapter?: string | string[] }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [fontSize, setFontSize] = useState<number>(18);
  const flatListRef = useRef<FlatList<Verse>>(null);

  // Selected verse to display in reader modal
  const [readingVerse, setReadingVerse] = useState<Verse | null>(null);
  const [showVersionPicker, setShowVersionPicker] = useState<boolean>(false);

  // Top Quick Jump Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<BibleSearchMatch[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  const {
    bookId,
    chapter,
    version,
    currentBook,
    verses,
    isLoading,
    bookmarks,
    goToNextChapter,
    goToPreviousChapter,
    setPassage,
    setVersion,
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
  }, [bookId, chapter, version, verses.length]);

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
        const results = await BibleRepo.searchBible(db, searchQuery, 8, version);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (e) {
        console.error('Quick search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, db, version]);

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
    const versionLabel = version === 'CEB' ? 'Cebuano' : 'KJV';
    const initialContent = `> "${verse.text}"\n— **${citation}** (${versionLabel})\n\n`;
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
          End of {currentBook?.name} Chapter {chapter} ({verses.length} Verses • {version === 'CEB' ? 'Cebuano Pinadayag' : 'KJV'})
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
      {/* Top Header & Search Area */}
      <View style={[styles.topHeaderArea, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {/* Book / Chapter Picker & Font / Nav Controls */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              onPress={handleOpenPicker}
              style={[styles.pickerButton, { backgroundColor: colors.secondaryBackground }]}
              activeOpacity={0.7}
            >
              <Ionicons name="book" size={16} color={colors.tint} style={{ marginRight: 6 }} />
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {currentBook ? `${currentBook.name} ${chapter}` : 'Select Passage'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            {/* Interactive Translation Switcher Badge */}
            <TouchableOpacity
              onPress={() => setShowVersionPicker(true)}
              style={[styles.versionBadgeBtn, { backgroundColor: colors.tintLight, borderColor: colors.tint }]}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <Text style={[styles.versionBadgeBtnText, { color: colors.tint }]}>{version}</Text>
              <Ionicons name="caret-down" size={9} color={colors.tint} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>

          {/* Font Controls & Chapter Nav Buttons */}
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
            </View>
          </View>
        </View>

        {/* Top Search Bar */}
        <View style={styles.topSearchContainer}>
          <View style={[styles.topSearchInputWrapper, { backgroundColor: colors.secondaryBackground }]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.topSearchInput, { color: colors.text }]}
              placeholder={`Search in ${version === 'CEB' ? 'Cebuano' : 'KJV'} (e.g. ${version === 'CEB' ? 'Juan 3:16, gugma' : 'John 3:16, love'})...`}
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

        {/* Search Results Dropdown (Under top search bar) */}
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
              style={{ maxHeight: 240 }}
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
              onPressVerse={setReadingVerse}
            />
          )}
          contentContainerStyle={styles.versesList}
          showsVerticalScrollIndicator={true}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* Verse Reading Modal (Centered Dialog displaying full verse content) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!readingVerse}
        onRequestClose={() => setReadingVerse(null)}
      >
        <TouchableWithoutFeedback onPress={() => setReadingVerse(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header */}
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <View style={styles.modalHeaderTitleRow}>
                    <Ionicons name="book" size={20} color={colors.tint} style={{ marginRight: 8 }} />
                    <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>
                      {currentBook?.name} {chapter}:{readingVerse?.verse}
                    </Text>
                    <View style={[styles.modalVersionBadge, { backgroundColor: colors.tintLight }]}>
                      <Text style={[styles.modalVersionBadgeText, { color: colors.tint }]}>{version}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setReadingVerse(null)}
                    style={[styles.modalCloseBtn, { backgroundColor: colors.secondaryBackground }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Verse Text Display (Fully Scrollable) */}
                <ScrollView
                  style={styles.modalScrollArea}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {readingVerse && (
                    <Text
                      style={[
                        styles.modalVerseText,
                        {
                          color: colors.text,
                          fontSize: fontSize + 3,
                          lineHeight: (fontSize + 3) * 1.6,
                        },
                      ]}
                      selectable={true}
                    >
                      "{readingVerse.text}"
                    </Text>
                  )}
                </ScrollView>

                {/* Modal Navigation & Action Controls */}
                {readingVerse && (
                  <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                    {/* Prev / Next Verse Step Navigation */}
                    <View style={styles.modalVerseNavRow}>
                      <TouchableOpacity
                        style={[
                          styles.modalNavVerseBtn,
                          {
                            backgroundColor: colors.secondaryBackground,
                            opacity: readingVerse.verse > 1 ? 1 : 0.35,
                          },
                        ]}
                        disabled={readingVerse.verse <= 1}
                        onPress={() => {
                          const prev = verses.find((v) => v.verse === readingVerse.verse - 1);
                          if (prev) setReadingVerse(prev);
                        }}
                      >
                        <Ionicons name="chevron-back" size={16} color={colors.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.modalNavVerseBtnText, { color: colors.text }]}>
                          Prev Verse
                        </Text>
                      </TouchableOpacity>

                      <Text style={[styles.modalVerseIndicator, { color: colors.textSecondary }]}>
                        {readingVerse.verse} of {verses.length}
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.modalNavVerseBtn,
                          {
                            backgroundColor: colors.secondaryBackground,
                            opacity: readingVerse.verse < verses.length ? 1 : 0.35,
                          },
                        ]}
                        disabled={readingVerse.verse >= verses.length}
                        onPress={() => {
                          const next = verses.find((v) => v.verse === readingVerse.verse + 1);
                          if (next) setReadingVerse(next);
                        }}
                      >
                        <Text style={[styles.modalNavVerseBtnText, { color: colors.text }]}>
                          Next Verse
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.text} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>

                    {/* Action Buttons: Bookmark & Study Note */}
                    <View style={styles.modalActionButtonsRow}>
                      <TouchableOpacity
                        style={[
                          styles.modalActionBtn,
                          {
                            backgroundColor: bookmarks.has(readingVerse.verse)
                              ? colors.verseHighlight
                              : colors.secondaryBackground,
                            borderColor: bookmarks.has(readingVerse.verse) ? colors.gold : colors.border,
                          },
                        ]}
                        onPress={() => toggleBookmark(readingVerse.verse)}
                      >
                        <Ionicons
                          name={bookmarks.has(readingVerse.verse) ? 'bookmark' : 'bookmark-outline'}
                          size={18}
                          color={bookmarks.has(readingVerse.verse) ? colors.gold : colors.textSecondary}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.modalActionBtnText,
                            {
                              color: bookmarks.has(readingVerse.verse) ? colors.gold : colors.text,
                              fontWeight: '600',
                            },
                          ]}
                        >
                          {bookmarks.has(readingVerse.verse) ? 'Bookmarked' : 'Bookmark'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modalActionBtn, { backgroundColor: colors.tint, borderColor: colors.tint, marginLeft: 10 }]}
                        onPress={() => {
                          const v = readingVerse;
                          setReadingVerse(null);
                          handleAddNoteForVerse(v);
                        }}
                      >
                        <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={[styles.modalActionBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                          Study Note
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Translation Switcher Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showVersionPicker}
        onRequestClose={() => setShowVersionPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowVersionPicker(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.versionModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <View style={styles.modalHeaderTitleRow}>
                    <Ionicons name="globe-outline" size={20} color={colors.tint} style={{ marginRight: 8 }} />
                    <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>
                      Select Translation
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowVersionPicker(false)}
                    style={[styles.modalCloseBtn, { backgroundColor: colors.secondaryBackground }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.versionList}>
                  {BIBLE_VERSIONS.map((v) => {
                    const isSelected = version === v.id;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        style={[
                          styles.versionOptionItem,
                          {
                            backgroundColor: isSelected ? colors.tintLight : colors.secondaryBackground,
                            borderColor: isSelected ? colors.tint : colors.border,
                          },
                        ]}
                        onPress={() => {
                          setVersion(v.id);
                          setShowVersionPicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.versionOptionTextContainer}>
                          <View style={styles.versionOptionTitleRow}>
                            <Text
                              style={[
                                styles.versionOptionTitle,
                                {
                                  color: isSelected ? colors.tint : colors.text,
                                  fontWeight: isSelected ? '700' : '600',
                                },
                              ]}
                            >
                              {v.name} ({v.shortName})
                            </Text>
                            <View
                              style={[
                                styles.versionLangBadge,
                                { backgroundColor: isSelected ? colors.tint : colors.border },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.versionLangBadgeText,
                                  { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                                ]}
                              >
                                {v.language}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.versionOptionDesc, { color: colors.textSecondary }]}>
                            {v.description}
                          </Text>
                        </View>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={22} color={colors.tint} />
                        ) : (
                          <Ionicons name="radio-button-off" size={20} color={colors.textTertiary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeaderArea: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
  versionBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 6,
  },
  versionBadgeBtnText: {
    fontSize: 11,
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
  topSearchContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
  },
  topSearchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
  },
  topSearchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchResultsOverlay: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
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
    paddingBottom: 30,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    minHeight: 250,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalVersionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  modalVersionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollArea: {
    flexGrow: 1,
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  modalVerseText: {
    fontFamily: 'System',
    fontStyle: 'normal',
    fontWeight: '400',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalVerseNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalVerseIndicator: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalNavVerseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  modalNavVerseBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalActionBtnText: {
    fontSize: 15,
  },
  versionModalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  versionList: {
    padding: 16,
  },
  versionOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  versionOptionTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  versionOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  versionOptionTitle: {
    fontSize: 15,
  },
  versionLangBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  versionLangBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  versionOptionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
