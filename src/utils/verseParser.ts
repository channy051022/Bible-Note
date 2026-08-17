import { ParsedPassageRef } from '../types/bible';
import { BIBLE_BOOKS, BOOK_ALIAS_MAP, getBookByAlias } from '../constants/BibleBooks';

/**
 * Builds a dynamic regex alternation from all known book names, abbreviations, and aliases.
 * Longest names are matched first to prevent partial matches (e.g. "1 Corinthians" before "1 Cor").
 */
function buildBookNamesPattern(): string {
  const allAliases = new Set<string>();

  BIBLE_BOOKS.forEach((book) => {
    allAliases.add(book.name);
    allAliases.add(book.abbreviation);
    book.aliases.forEach((alias) => allAliases.add(alias));
  });

  // Sort descending by length so longer names match first
  const sorted = Array.from(allAliases).sort((a, b) => b.length - a.length);
  const escaped = sorted.map((s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
  return escaped.join('|');
}

const BOOK_PATTERN = buildBookNamesPattern();

/**
 * Bible Verse Regex:
 * Group 1: Book Name (e.g. "John", "1 Cor", "Song of Solomon", "Gen.")
 * Group 2: Chapter number (e.g. "3", "13")
 * Group 3: Optional verse part (e.g. ":16", ":4-8", " v. 16", " 1:1-5")
 * Group 4: Start verse
 * Group 5: Optional End verse
 */
const VERSE_REGEX = new RegExp(
  `\\b(${BOOK_PATTERN})\\.?\\s*(\\d+)(?:(?:\\s*[:.]\\s*|\\s+v(?:erse|v)?\\.?\\s*)(\\d+)(?:\\s*[-–—:]\\s*(\\d+))?)?\\b`,
  'gi'
);

/**
 * Extracts and canonicalizes all Bible verse references from raw text.
 *
 * @param text The input text to scan (e.g., from note content or user input).
 * @returns Array of ParsedPassageRef with character boundaries for UI rendering and database queries.
 */
export function parseVerseReferences(text: string): ParsedPassageRef[] {
  if (!text || typeof text !== 'string') return [];

  const matches: ParsedPassageRef[] = [];
  // Reset regex lastIndex for safety
  VERSE_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;

  while ((match = VERSE_REGEX.exec(text)) !== null) {
    const rawMatch = match[0];
    const bookStr = match[1];
    const chapterStr = match[2];
    const startVerseStr = match[3];
    const endVerseStr = match[4];

    const book = getBookByAlias(bookStr);
    if (!book) {
      continue;
    }

    const chapter = parseInt(chapterStr, 10);
    if (isNaN(chapter) || chapter < 1 || chapter > book.chapters_count) {
      continue;
    }

    let startVerse: number | undefined;
    let endVerse: number | undefined;

    if (startVerseStr !== undefined) {
      startVerse = parseInt(startVerseStr, 10);
      if (isNaN(startVerse) || startVerse < 1) {
        startVerse = undefined;
      }
    }

    if (endVerseStr !== undefined && startVerse !== undefined) {
      endVerse = parseInt(endVerseStr, 10);
      if (isNaN(endVerse) || endVerse < startVerse) {
        endVerse = startVerse;
      }
    } else if (startVerse !== undefined) {
      endVerse = startVerse;
    }

    matches.push({
      raw: rawMatch,
      bookId: book.id,
      bookName: book.name,
      bookAbbrev: book.abbreviation,
      chapter,
      startVerse,
      endVerse,
      startIndex: match.index,
      endIndex: match.index + rawMatch.length,
    });
  }

  return matches;
}

/**
 * Formats a ParsedPassageRef into a standard human-readable citation (e.g., "1 Corinthians 13:4-8").
 */
export function formatPassageRef(ref: ParsedPassageRef | { bookName: string; chapter: number; startVerse?: number; endVerse?: number }): string {
  if (!ref.startVerse) {
    return `${ref.bookName} ${ref.chapter}`;
  }
  if (!ref.endVerse || ref.startVerse === ref.endVerse) {
    return `${ref.bookName} ${ref.chapter}:${ref.startVerse}`;
  }
  return `${ref.bookName} ${ref.chapter}:${ref.startVerse}-${ref.endVerse}`;
}

/**
 * Splits plain text into consecutive string segments and detected verse tokens
 * for rendering clickable inline pills or rich highlights.
 */
export interface TextSegment {
  type: 'text' | 'verse';
  content: string;
  ref?: ParsedPassageRef;
}

export function segmentTextWithVerses(text: string): TextSegment[] {
  const refs = parseVerseReferences(text);
  if (refs.length === 0) {
    return [{ type: 'text', content: text }];
  }

  const segments: TextSegment[] = [];
  let currentIndex = 0;

  for (const ref of refs) {
    if (ref.startIndex > currentIndex) {
      segments.push({
        type: 'text',
        content: text.substring(currentIndex, ref.startIndex),
      });
    }

    segments.push({
      type: 'verse',
      content: ref.raw,
      ref,
    });

    currentIndex = ref.endIndex;
  }

  if (currentIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(currentIndex),
    });
  }

  return segments;
}
