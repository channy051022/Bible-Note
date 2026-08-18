import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { ParsedPassageRef, PassageDetails, Verse, BibleVersion } from '../types/bible';
import { parseVerseReferences, formatPassageRef, segmentTextWithVerses, TextSegment } from '../utils/verseParser';
import { BibleRepo } from '../db/bibleRepo';
import { getItem, StorageKeys } from '../utils/storage';

export interface UseVerseDetectorResult {
  detectedReferences: ParsedPassageRef[];
  textSegments: TextSegment[];
  selectedPassage: PassageDetails | null;
  isLoadingPassage: boolean;
  openVersePreview: (ref: ParsedPassageRef) => Promise<void>;
  closeVersePreview: () => void;
  fetchPassageQuote: (ref: ParsedPassageRef) => Promise<{ quote: string; title: string }>;
}

/**
 * Formats scripture verses into a clean, markdown blockquote with citation.
 */
export function formatPassageQuote(verses: Verse[], ref: ParsedPassageRef, version: BibleVersion = 'KJV'): string {
  if (!verses || verses.length === 0) return '';

  const citation = formatPassageRef(ref);
  let textBody = '';

  if (verses.length === 1) {
    textBody = `"${verses[0].text}"`;
  } else {
    textBody = verses.map((v) => `${v.verse} ${v.text}`).join('\n');
    textBody = `"${textBody}"`;
  }

  const versionLabel = version === 'CEB' ? 'Cebuano' : 'KJV';
  return `> ${textBody}\n— **${citation}** (${versionLabel})\n\n`;
}

/**
 * Hook that continuously detects Bible verse references inside note content in real time
 * and provides offline SQLite passage fetching for interactive modals and 1-click note insertion.
 *
 * @param content The text/note body to scan.
 * @param debounceMs Delay in ms to debounce heavy operations (default: 120ms).
 */
export function useVerseDetector(content: string, debounceMs: number = 120): UseVerseDetectorResult {
  const db = useSQLiteContext();
  const [debouncedContent, setDebouncedContent] = useState<string>(content);
  const [selectedPassage, setSelectedPassage] = useState<PassageDetails | null>(null);
  const [isLoadingPassage, setIsLoadingPassage] = useState<boolean>(false);

  // Debounce the content parsing for responsive, lag-free typing performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(content);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [content, debounceMs]);

  // Continuously detect all scripture references in the note
  const detectedReferences = useMemo(() => {
    if (!debouncedContent) return [];
    return parseVerseReferences(debouncedContent);
  }, [debouncedContent]);

  // Segment text into plain strings and interactive verse tokens
  const textSegments = useMemo(() => {
    if (!content) return [];
    return segmentTextWithVerses(content);
  }, [content]);

  // Open verse preview modal by querying verses from local SQLite
  const openVersePreview = useCallback(
    async (ref: ParsedPassageRef) => {
      try {
        setIsLoadingPassage(true);
        const version = getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
        const verses: Verse[] = await BibleRepo.getVersesForParsedRef(db, ref, version);
        const formattedTitle = formatPassageRef(ref);

        setSelectedPassage({
          ref,
          verses,
          formattedTitle,
        });
      } catch (error) {
        console.error('Failed to load verses for reference:', ref, error);
        setSelectedPassage(null);
      } finally {
        setIsLoadingPassage(false);
      }
    },
    [db]
  );

  const closeVersePreview = useCallback(() => {
    setSelectedPassage(null);
  }, []);

  // Fetches verses and formats a markdown quotation ready to insert into note
  const fetchPassageQuote = useCallback(
    async (ref: ParsedPassageRef): Promise<{ quote: string; title: string }> => {
      const version = getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
      const verses: Verse[] = await BibleRepo.getVersesForParsedRef(db, ref, version);
      const title = formatPassageRef(ref);
      const quote = formatPassageQuote(verses, ref, version);
      return { quote, title };
    },
    [db]
  );

  return {
    detectedReferences,
    textSegments,
    selectedPassage,
    isLoadingPassage,
    openVersePreview,
    closeVersePreview,
    fetchPassageQuote,
  };
}
