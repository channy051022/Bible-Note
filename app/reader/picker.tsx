import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BIBLE_BOOKS, BibleBookMeta } from '../../src/constants/BibleBooks';
import { useTheme } from '../../src/hooks/useTheme';
import { Testament } from '../../src/types/bible';
import { setItem, StorageKeys } from '../../src/utils/storage';
import { Ionicons } from '@expo/vector-icons';

export default function BookChapterPickerScreen() {
  const params = useLocalSearchParams<{ currentBookId?: string | string[]; currentChapter?: string | string[] }>();
  const router = useRouter();
  const { colors } = useTheme();

  const rawBookId = Array.isArray(params.currentBookId) ? params.currentBookId[0] : params.currentBookId;
  const initialBookId = rawBookId ? parseInt(rawBookId, 10) : 1;
  const initialBook = BIBLE_BOOKS.find((b) => b.id === initialBookId) || BIBLE_BOOKS[0];

  const [selectedTestament, setSelectedTestament] = useState<Testament>(initialBook.testament);
  const [selectedBook, setSelectedBook] = useState<BibleBookMeta>(initialBook);

  const filteredBooks = BIBLE_BOOKS.filter((b) => b.testament === selectedTestament);

  const handleSelectTestament = (testament: Testament) => {
    setSelectedTestament(testament);
    if (selectedBook.testament !== testament) {
      const firstBookOfTestament = BIBLE_BOOKS.find((b) => b.testament === testament);
      if (firstBookOfTestament) {
        setSelectedBook(firstBookOfTestament);
      }
    }
  };

  const handleSelectChapter = (chapterNum: number) => {
    setItem(StorageKeys.LAST_READ_BOOK, selectedBook.id);
    setItem(StorageKeys.LAST_READ_CHAPTER, chapterNum);

    router.dismissAll();
    router.navigate({
      pathname: '/(tabs)',
      params: {
        bookId: selectedBook.id.toString(),
        chapter: chapterNum.toString(),
      },
    });
  };

  // Generate array of chapters [1, 2, ..., chapters_count]
  const chapters = Array.from({ length: selectedBook.chapters_count }, (_, i) => i + 1);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Select Book & Chapter',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.doneHeaderBtn}>
              <Text style={[styles.doneHeaderText, { color: colors.tint }]}>Done</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* Header Testament Segmented Bar */}
      <View style={[styles.testamentHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.segmentedControl, { backgroundColor: colors.secondaryBackground }]}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedTestament === 'OT' && [styles.segmentBtnActive, { backgroundColor: colors.card }],
            ]}
            onPress={() => handleSelectTestament('OT')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentBtnText,
                { color: selectedTestament === 'OT' ? colors.tint : colors.textSecondary },
                selectedTestament === 'OT' && styles.segmentBtnTextActive,
              ]}
            >
              Old Testament (39)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedTestament === 'NT' && [styles.segmentBtnActive, { backgroundColor: colors.card }],
            ]}
            onPress={() => handleSelectTestament('NT')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentBtnText,
                { color: selectedTestament === 'NT' ? colors.tint : colors.textSecondary },
                selectedTestament === 'NT' && styles.segmentBtnTextActive,
              ]}
            >
              New Testament (27)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Body: Split Column Layout */}
      <View style={styles.contentRow}>
        {/* Left Column: Books FlatList */}
        <View style={[styles.booksColumn, { borderRightColor: colors.border, backgroundColor: colors.secondaryBackground }]}>
          <FlatList
            data={filteredBooks}
            keyExtractor={(item) => item.id.toString()}
            extraData={selectedBook.id}
            style={{ flex: 1 }}
            contentContainerStyle={styles.booksScrollContent}
            showsVerticalScrollIndicator={true}
            renderItem={({ item: book }) => {
              const isSelected = book.id === selectedBook.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.bookItem,
                    isSelected ? [styles.bookItemSelected, { backgroundColor: colors.card, borderLeftColor: colors.tint }] : null,
                  ]}
                  onPress={() => setSelectedBook(book)}
                  activeOpacity={0.7}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.bookName,
                      {
                        color: isSelected ? colors.tint : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {book.name}
                  </Text>
                  <Text style={[styles.bookChaptersCount, { color: colors.textTertiary }]}>
                    {book.chapters_count}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Right Column: Chapters Grid */}
        <View style={[styles.chaptersColumn, { backgroundColor: colors.background }]}>
          <View style={[styles.chapterHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.chapterHeaderRow}>
              <Ionicons name="book" size={17} color={colors.tint} style={{ marginRight: 6 }} />
              <Text style={[styles.chapterHeaderTitle, { color: colors.text }]}>
                {selectedBook.name}
              </Text>
            </View>
            <Text style={[styles.chapterHeaderSubtitle, { color: colors.textSecondary }]}>
              {selectedBook.chapters_count} {selectedBook.chapters_count === 1 ? 'Chapter' : 'Chapters'}
            </Text>
          </View>

          <FlatList
            data={chapters}
            keyExtractor={(item) => item.toString()}
            extraData={selectedBook.id}
            numColumns={4}
            columnWrapperStyle={styles.chapterRowWrapper}
            contentContainerStyle={styles.chapterGridContent}
            showsVerticalScrollIndicator={true}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.chapterCell,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleSelectChapter(item)}
                activeOpacity={0.6}
              >
                <Text style={[styles.chapterCellText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  doneHeaderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneHeaderText: {
    fontSize: 17,
    fontWeight: '600',
  },
  testamentHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    fontWeight: '700',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
  },
  booksColumn: {
    width: '46%',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  booksScrollContent: {
    paddingBottom: 80, // Ensures all 39 OT and 27 NT books are 100% scrollable to the bottom
  },
  bookItem: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookItemSelected: {
    borderLeftWidth: 3.5,
  },
  bookName: {
    fontSize: 15,
    flex: 1,
  },
  bookChaptersCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  chaptersColumn: {
    flex: 1,
  },
  chapterHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chapterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  chapterHeaderSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chapterGridContent: {
    padding: 8,
    paddingBottom: 90,
  },
  chapterRowWrapper: {
    justifyContent: 'flex-start',
  },
  chapterCell: {
    width: '22%',
    aspectRatio: 1,
    margin: '1.5%',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  chapterCellText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
