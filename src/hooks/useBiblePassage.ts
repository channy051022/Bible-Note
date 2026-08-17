import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Book, Verse } from '../types/bible';
import { BibleRepo } from '../db/bibleRepo';
import { BIBLE_BOOKS, getBookById } from '../constants/BibleBooks';
import { getItem, setItem, StorageKeys } from '../utils/storage';

export function useBiblePassage(initialBookId: number = 1, initialChapter: number = 1) {
  const db = useSQLiteContext();
  const [bookId, setBookId] = useState<number>(() => {
    return getItem<number>(StorageKeys.LAST_READ_BOOK, initialBookId);
  });
  const [chapter, setChapter] = useState<number>(() => {
    return getItem<number>(StorageKeys.LAST_READ_CHAPTER, initialChapter);
  });

  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());

  // Load verses for current book & chapter
  const loadPassage = useCallback(async () => {
    try {
      setIsLoading(true);
      const book = getBookById(bookId) || (await BibleRepo.getBookById(db, bookId));
      setCurrentBook(book || null);

      const chapterVerses = await BibleRepo.getChapterVerses(db, bookId, chapter);
      setVerses(chapterVerses);

      // Load bookmark statuses for this chapter
      const allBookmarks = await BibleRepo.getBookmarks(db);
      const chapterBookmarks = new Set<number>();
      allBookmarks.forEach((bm) => {
        if (bm.book_id === bookId && bm.chapter === chapter) {
          chapterBookmarks.add(bm.verse);
        }
      });
      setBookmarks(chapterBookmarks);

      // Save position to storage
      setItem(StorageKeys.LAST_READ_BOOK, bookId);
      setItem(StorageKeys.LAST_READ_CHAPTER, chapter);
    } catch (e) {
      console.error('Error loading Bible passage:', e);
    } finally {
      setIsLoading(false);
    }
  }, [db, bookId, chapter]);

  useEffect(() => {
    loadPassage();
  }, [loadPassage]);

  // Navigate to next chapter
  const goToNextChapter = useCallback(() => {
    if (!currentBook) return;
    if (chapter < currentBook.chapters_count) {
      setChapter((prev) => prev + 1);
    } else if (bookId < 66) {
      setBookId((prev) => prev + 1);
      setChapter(1);
    }
  }, [currentBook, chapter, bookId]);

  // Navigate to previous chapter
  const goToPreviousChapter = useCallback(() => {
    if (chapter > 1) {
      setChapter((prev) => prev - 1);
    } else if (bookId > 1) {
      const prevBookId = bookId - 1;
      const prevBook = getBookById(prevBookId);
      setBookId(prevBookId);
      setChapter(prevBook ? prevBook.chapters_count : 1);
    }
  }, [chapter, bookId]);

  // Jump to specific book and chapter
  const setPassage = useCallback((newBookId: number, newChapter: number) => {
    setBookId(newBookId);
    setChapter(newChapter);
  }, []);

  // Toggle bookmark on a verse
  const toggleBookmark = useCallback(
    async (verseNumber: number) => {
      const isNowBookmarked = await BibleRepo.toggleBookmark(db, bookId, chapter, verseNumber);
      setBookmarks((prev) => {
        const next = new Set(prev);
        if (isNowBookmarked) {
          next.add(verseNumber);
        } else {
          next.delete(verseNumber);
        }
        return next;
      });
    },
    [db, bookId, chapter]
  );

  return {
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
    reload: loadPassage,
  };
}
