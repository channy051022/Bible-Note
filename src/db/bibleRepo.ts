import { type SQLiteDatabase } from 'expo-sqlite';
import { Book, Verse, Bookmark, BibleSearchMatch, ParsedPassageRef, BibleVersion } from '../types/bible';
import { BIBLE_BOOKS, getBookById, getBookByAlias } from '../constants/BibleBooks';
import { parseVerseReferences } from '../utils/verseParser';

/**
 * Strips XML/HTML tags (like <verse num="1"> or <i>...</i>) from raw SQLite content.
 */
export function cleanVerseText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<verse[^>]*>/gi, '')
    .replace(/<\/verse>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export const BibleRepo = {
  /**
   * Retrieves all 66 books of the Bible.
   */
  async getAllBooks(db: SQLiteDatabase): Promise<Book[]> {
    return BIBLE_BOOKS;
  },

  /**
   * Retrieves a single book by ID.
   */
  async getBookById(db: SQLiteDatabase, bookId: number): Promise<Book | null> {
    return getBookById(bookId) || null;
  },

  /**
   * Retrieves all verses for a given book and chapter from the E-Bible database.
   */
  async getChapterVerses(
    db: SQLiteDatabase,
    bookId: number,
    chapter: number,
    version: BibleVersion = 'KJV'
  ): Promise<Verse[]> {
    const book = getBookById(bookId) || BIBLE_BOOKS[0];
    const abbrev = book.abbreviation;
    const tableName = version === 'CEB' ? 'bible_ceb' : 'bible';

    try {
      // Query bible translation table (bible for KJV, bible_ceb for Cebuano)
      const rows = await db.getAllAsync<{
        book: string;
        chapter: number;
        verse: number;
        content: string;
      }>(
        `SELECT book, chapter, verse, content FROM ${tableName} WHERE book = ? AND chapter = ? ORDER BY verse ASC`,
        [abbrev, chapter]
      );

      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: (bookId * 100000) + (chapter * 1000) + r.verse,
          book_id: bookId,
          chapter: r.chapter,
          verse: r.verse,
          text: cleanVerseText(r.content),
          book_name: book.name,
          book_abbreviation: book.abbreviation,
        }));
      }
    } catch (e) {
      console.warn(`${tableName} query notice:`, e);
    }

    // Fallback to default bible table if needed
    try {
      const fallbackRows = await db.getAllAsync<{
        book: string;
        chapter: number;
        verse: number;
        content: string;
      }>(
        'SELECT book, chapter, verse, content FROM bible WHERE book = ? AND chapter = ? ORDER BY verse ASC',
        [abbrev, chapter]
      );
      if (fallbackRows && fallbackRows.length > 0) {
        return fallbackRows.map((r) => ({
          id: (bookId * 100000) + (chapter * 1000) + r.verse,
          book_id: bookId,
          chapter: r.chapter,
          verse: r.verse,
          text: cleanVerseText(r.content),
          book_name: book.name,
          book_abbreviation: book.abbreviation,
        }));
      }
    } catch {
      return [];
    }

    return [];
  },

  /**
   * Retrieves a specific verse range (e.g. John 3:16-18) from the E-Bible.
   */
  async getVerseRange(
    db: SQLiteDatabase,
    bookId: number,
    chapter: number,
    startVerse?: number,
    endVerse?: number,
    version: BibleVersion = 'KJV'
  ): Promise<Verse[]> {
    if (!startVerse) {
      return this.getChapterVerses(db, bookId, chapter, version);
    }

    const book = getBookById(bookId) || BIBLE_BOOKS[0];
    const abbrev = book.abbreviation;
    const end = endVerse ?? startVerse;
    const tableName = version === 'CEB' ? 'bible_ceb' : 'bible';

    try {
      const rows = await db.getAllAsync<{
        book: string;
        chapter: number;
        verse: number;
        content: string;
      }>(
        `SELECT book, chapter, verse, content FROM ${tableName} WHERE book = ? AND chapter = ? AND verse >= ? AND verse <= ? ORDER BY verse ASC`,
        [abbrev, chapter, startVerse, end]
      );

      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: (bookId * 100000) + (chapter * 1000) + r.verse,
          book_id: bookId,
          chapter: r.chapter,
          verse: r.verse,
          text: cleanVerseText(r.content),
          book_name: book.name,
          book_abbreviation: book.abbreviation,
        }));
      }
    } catch (e) {
      console.warn(`${tableName} range query notice:`, e);
    }

    return [];
  },

  /**
   * Resolves a parsed passage reference into complete verses.
   */
  async getVersesForParsedRef(
    db: SQLiteDatabase,
    ref: ParsedPassageRef,
    version: BibleVersion = 'KJV'
  ): Promise<Verse[]> {
    return await this.getVerseRange(db, ref.bookId, ref.chapter, ref.startVerse, ref.endVerse, version);
  },

  /**
   * Universal Scripture Search:
   * 1. Detects Bible Book name searches (e.g. "Genesis", "Matthew", "Juan", "Salmo")
   * 2. Detects exact citations (e.g. "John 3:16", "Juan 3:16", "Salmo 23")
   * 3. Searches full text across the 31,102 verses with instant LIKE & FTS
   */
  async searchBible(
    db: SQLiteDatabase,
    query: string,
    limit = 50,
    version: BibleVersion = 'KJV'
  ): Promise<BibleSearchMatch[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const matches: BibleSearchMatch[] = [];
    const seenIds = new Set<number>();
    const lowerQuery = cleanQuery.toLowerCase();
    const tableName = version === 'CEB' ? 'bible_ceb' : 'bible';

    // 1. Search Bible Book Names & Aliases
    for (const book of BIBLE_BOOKS) {
      const matchesName = book.name.toLowerCase().includes(lowerQuery);
      const matchesAbbrev = book.abbreviation.toLowerCase().startsWith(lowerQuery);
      const matchesAlias = book.aliases.some((a) => a.toLowerCase().startsWith(lowerQuery));

      if (matchesName || matchesAbbrev || matchesAlias) {
        const bookMatchId = book.id * 1000000;
        if (!seenIds.has(bookMatchId)) {
          seenIds.add(bookMatchId);
          matches.push({
            id: bookMatchId,
            book_id: book.id,
            book_name: book.name,
            book_abbrev: book.abbreviation,
            chapter: 1,
            verse: 1,
            text: `Book of ${book.name} (${book.testament === 'OT' ? 'Old' : 'New'} Testament) • ${book.chapters_count} Chapters — Tap to open Chapter 1`,
            is_book_match: true,
            chapters_count: book.chapters_count,
          });
        }
      }
    }

    // 2. Check if user typed a specific scripture reference (e.g. "John 3:16", "Juan 3:16", or "Genesis 1")
    try {
      const parsedRefs = parseVerseReferences(cleanQuery);
      for (const ref of parsedRefs) {
        const refVerses = await this.getVersesForParsedRef(db, ref, version);
        for (const v of refVerses) {
          if (!seenIds.has(v.id)) {
            seenIds.add(v.id);
            matches.push({
              id: v.id,
              book_id: v.book_id,
              book_name: v.book_name || getBookById(v.book_id)?.name || 'Bible',
              book_abbrev: v.book_abbreviation || 'Bib',
              chapter: v.chapter,
              verse: v.verse,
              text: v.text,
            });
          }
        }
      }
    } catch (parseErr) {
      console.warn('Citation search notice:', parseErr);
    }

    // 3. Perform text search across all 31,102 verses in the active version
    try {
      const rows = await db.getAllAsync<{
        book: string;
        chapter: number;
        verse: number;
        content: string;
      }>(
        `SELECT book, chapter, verse, content FROM ${tableName} WHERE content LIKE ? LIMIT ?`,
        [`%${cleanQuery}%`, limit]
      );

      if (rows && rows.length > 0) {
        for (const r of rows) {
          const bookMeta = getBookByAlias(r.book) || { id: 1, name: r.book, abbreviation: r.book };
          const verseId = (bookMeta.id * 100000) + (Number(r.chapter) * 1000) + Number(r.verse);
          if (!seenIds.has(verseId)) {
            seenIds.add(verseId);
            matches.push({
              id: verseId,
              book_id: bookMeta.id,
              book_name: bookMeta.name,
              book_abbrev: bookMeta.abbreviation,
              chapter: Number(r.chapter),
              verse: Number(r.verse),
              text: cleanVerseText(r.content),
            });
          }
        }
      }
    } catch (e) {
      console.warn('Text search fallback notice:', e);
    }

    return matches;
  },

  /**
   * Retrieves all saved bookmarks.
   */
  async getBookmarks(db: SQLiteDatabase, version: BibleVersion = 'KJV'): Promise<Bookmark[]> {
    const tableName = version === 'CEB' ? 'bible_ceb' : 'bible';
    try {
      const bookmarks = await db.getAllAsync<Bookmark>(
        'SELECT id, book_id, chapter, verse, label, created_at FROM bookmarks ORDER BY created_at DESC'
      );

      for (const bm of bookmarks) {
        const book = getBookById(bm.book_id);
        if (book) {
          bm.book_name = book.name;
          const verseRow = await db.getFirstAsync<{ content: string }>(
            `SELECT content FROM ${tableName} WHERE book = ? AND chapter = ? AND verse = ?`,
            [book.abbreviation, bm.chapter, bm.verse]
          );
          if (verseRow) {
            bm.verse_text = cleanVerseText(verseRow.content);
          }
        }
      }

      return bookmarks;
    } catch (e) {
      console.warn('Failed to load bookmarks:', e);
      return [];
    }
  },

  /**
   * Checks if a specific verse is bookmarked.
   */
  async isVerseBookmarked(
    db: SQLiteDatabase,
    bookId: number,
    chapter: number,
    verse: number
  ): Promise<boolean> {
    try {
      const result = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM bookmarks WHERE book_id = ? AND chapter = ? AND verse = ?',
        [bookId, chapter, verse]
      );
      return !!result;
    } catch {
      return false;
    }
  },

  /**
   * Toggles bookmark state for a verse.
   */
  async toggleBookmark(
    db: SQLiteDatabase,
    bookId: number,
    chapter: number,
    verse: number,
    label?: string
  ): Promise<boolean> {
    try {
      const existing = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM bookmarks WHERE book_id = ? AND chapter = ? AND verse = ?',
        [bookId, chapter, verse]
      );

      if (existing) {
        await db.runAsync('DELETE FROM bookmarks WHERE id = ?', [existing.id]);
        return false;
      } else {
        await db.runAsync(
          'INSERT INTO bookmarks (book_id, chapter, verse, label) VALUES (?, ?, ?, ?)',
          [bookId, chapter, verse, label || null]
        );
        return true;
      }
    } catch (e) {
      console.error('Error toggling bookmark:', e);
      return false;
    }
  },

  /**
   * Retrieves a random popular verse for games like Verse Scramble with difficulty filter.
   */
  async getRandomScrambleVerse(
    db: SQLiteDatabase,
    version: BibleVersion = 'KJV',
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<Verse> {
    const easyVerses = [
      { bookId: 19, chapter: 23, verse: 1 }, // Psalm 23:1 (7 words)
      { bookId: 50, chapter: 4, verse: 13 }, // Philippians 4:13 (10 words)
      { bookId: 1, chapter: 1, verse: 1 }, // Genesis 1:1 (10 words)
      { bookId: 19, chapter: 46, verse: 1 }, // Psalm 46:1 (11 words)
      { bookId: 52, chapter: 5, verse: 16 }, // 1 Thessalonians 5:16 (2 words)
      { bookId: 52, chapter: 5, verse: 17 }, // 1 Thessalonians 5:17 (3 words)
      { bookId: 62, chapter: 4, verse: 19 }, // 1 John 4:19 (8 words)
    ];

    const mediumVerses = [
      { bookId: 43, chapter: 3, verse: 16 }, // John 3:16
      { bookId: 20, chapter: 3, verse: 5 }, // Proverbs 3:5
      { bookId: 40, chapter: 6, verse: 33 }, // Matthew 6:33
      { bookId: 6, chapter: 1, verse: 9 }, // Joshua 1:9
      { bookId: 23, chapter: 40, verse: 31 }, // Isaiah 40:31
      { bookId: 20, chapter: 16, verse: 3 }, // Proverbs 16:3
      { bookId: 46, chapter: 13, verse: 4 }, // 1 Corinthians 13:4
    ];

    const hardVerses = [
      { bookId: 45, chapter: 8, verse: 28 }, // Romans 8:28
      { bookId: 24, chapter: 29, verse: 11 }, // Jeremiah 29:11
      { bookId: 19, chapter: 119, verse: 105 }, // Psalm 119:105
      { bookId: 50, chapter: 4, verse: 6 }, // Philippians 4:6
      { bookId: 20, chapter: 3, verse: 6 }, // Proverbs 3:6
      { bookId: 43, chapter: 14, verse: 6 }, // John 14:6
      { bookId: 45, chapter: 12, verse: 2 }, // Romans 12:2
    ];

    const pool = difficulty === 'easy' ? easyVerses : difficulty === 'hard' ? hardVerses : mediumVerses;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const list = await this.getChapterVerses(db, pick.bookId, pick.chapter, version);
    const found = list.find((v) => v.verse === pick.verse);
    if (found) return found;

    return (
      list[0] || {
        id: 43003016,
        book_id: 43,
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
        book_name: 'John',
        book_abbreviation: 'John',
      }
    );
  },
};
