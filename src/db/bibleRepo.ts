import { type SQLiteDatabase } from 'expo-sqlite';
import { Book, Verse, Bookmark, BibleSearchMatch, ParsedPassageRef } from '../types/bible';
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
  async getChapterVerses(db: SQLiteDatabase, bookId: number, chapter: number): Promise<Verse[]> {
    const book = getBookById(bookId) || BIBLE_BOOKS[0];
    const abbrev = book.abbreviation;

    try {
      // Query full KJV bible table
      const rows = await db.getAllAsync<{
        book: string;
        chapter: number;
        verse: number;
        content: string;
      }>(
        'SELECT book, chapter, verse, content FROM bible WHERE book = ? AND chapter = ? ORDER BY verse ASC',
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
      console.warn('bible table query notice:', e);
    }

    // Fallback to verses table if present
    try {
      const fallbackRows = await db.getAllAsync<Verse>(
        `SELECT v.id, v.book_id, v.chapter, v.verse, v.text, b.name as book_name, b.abbreviation as book_abbreviation
         FROM verses v
         JOIN books b ON b.id = v.book_id
         WHERE v.book_id = ? AND v.chapter = ?
         ORDER BY v.verse ASC`,
        [bookId, chapter]
      );
      return fallbackRows;
    } catch {
      return [];
    }
  },

  /**
   * Retrieves a specific verse range (e.g. John 3:16-18) from the E-Bible.
   */
  async getVerseRange(
    db: SQLiteDatabase,
    bookId: number,
    chapter: number,
    startVerse?: number,
    endVerse?: number
  ): Promise<Verse[]> {
    if (!startVerse) {
      return this.getChapterVerses(db, bookId, chapter);
    }

    const book = getBookById(bookId) || BIBLE_BOOKS[0];
    const abbrev = book.abbreviation;
    const end = endVerse ?? startVerse;

    try {
      const rows = await db.getAllAsync<{
        book: string;
        chapter: number;
        verse: number;
        content: string;
      }>(
        'SELECT book, chapter, verse, content FROM bible WHERE book = ? AND chapter = ? AND verse >= ? AND verse <= ? ORDER BY verse ASC',
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
      console.warn('bible range query notice:', e);
    }

    try {
      return await db.getAllAsync<Verse>(
        `SELECT v.id, v.book_id, v.chapter, v.verse, v.text, b.name as book_name, b.abbreviation as book_abbreviation
         FROM verses v
         JOIN books b ON b.id = v.book_id
         WHERE v.book_id = ? AND v.chapter = ? AND v.verse >= ? AND v.verse <= ?
         ORDER BY v.verse ASC`,
        [bookId, chapter, startVerse, end]
      );
    } catch {
      return [];
    }
  },

  /**
   * Resolves a parsed passage reference into complete verses.
   */
  async getVersesForParsedRef(db: SQLiteDatabase, ref: ParsedPassageRef): Promise<Verse[]> {
    return await this.getVerseRange(db, ref.bookId, ref.chapter, ref.startVerse, ref.endVerse);
  },

  /**
   * Universal Scripture Search:
   * 1. Detects Bible Book name searches (e.g. "Genesis", "Matthew", "Romans", "Psalms")
   * 2. Detects exact citations (e.g. "John 3:16", "Genesis 1", "Psalm 23")
   * 3. Searches full text across the 31,102 verses with instant LIKE & FTS
   */
  async searchBible(db: SQLiteDatabase, query: string, limit = 50): Promise<BibleSearchMatch[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const matches: BibleSearchMatch[] = [];
    const seenIds = new Set<number>();
    const lowerQuery = cleanQuery.toLowerCase();

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

    // 2. Check if user typed a specific scripture reference (e.g. "John 3:16" or "Genesis 1")
    try {
      const parsedRefs = parseVerseReferences(cleanQuery);
      for (const ref of parsedRefs) {
        const refVerses = await this.getVersesForParsedRef(db, ref);
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

    // 3. Perform text search across all 31,102 verses
    try {
      const rows = await db.getAllAsync<{
        book: string;
        chapter: number;
        verse: number;
        content: string;
      }>(
        'SELECT book, chapter, verse, content FROM bible WHERE content LIKE ? LIMIT ?',
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
  async getBookmarks(db: SQLiteDatabase): Promise<Bookmark[]> {
    try {
      const bookmarks = await db.getAllAsync<Bookmark>(
        'SELECT id, book_id, chapter, verse, label, created_at FROM bookmarks ORDER BY created_at DESC'
      );

      for (const bm of bookmarks) {
        const book = getBookById(bm.book_id);
        if (book) {
          bm.book_name = book.name;
          const verseRow = await db.getFirstAsync<{ content: string }>(
            'SELECT content FROM bible WHERE book = ? AND chapter = ? AND verse = ?',
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
