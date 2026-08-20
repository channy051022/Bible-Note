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

/**
 * Resolves the SQLite table name for a given translation version ID.
 */
export function getTableNameForVersion(version: BibleVersion = 'KJV'): string {
  const normalized = (version || 'KJV').toUpperCase();
  if (normalized === 'CEB') return 'bible_ceb';
  if (normalized === 'KJV') return 'bible';
  return `bible_${normalized.toLowerCase()}`;
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
    const tableName = getTableNameForVersion(version);

    try {
      // Query bible translation table (bible for KJV, bible_ceb for Cebuano, or bible_{ver})
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

    // Fallback to default bible (KJV) table if needed
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
    const tableName = getTableNameForVersion(version);

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
    const tableName = getTableNameForVersion(version);

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
    const tableName = getTableNameForVersion(version);
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
};
