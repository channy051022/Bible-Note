import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { ParsedPassageRef, PassageDetails, Verse } from '../types/bible';
import { parseVerseReferences, formatPassageRef, segmentTextWithVerses, TextSegment } from '../utils/verseParser';
import { BibleRepo } from '../db/bibleRepo';

export interface UseVerseDetectorResult {
  detectedReferences: ParsedPassageRef[];
  textSegments: TextSegment[];
  selectedPassage: PassageDetails | null;
  isLoadingPassage: boolean;
  openVersePreview: (ref: ParsedPassageRef) => Promise<void>;
  closeVersePreview: () => void;
}

/**
 * Hook that continuously detects Bible verse references inside note content in real time
 * and provides offline SQLite passage fetching for interactive modals/popovers.
 *
 * @param content The text/note body to scan.
 * @param debounceMs Delay in ms to debounce heavy operations (default: 250ms).
 */
export function useVerseDetector(content: string, debounceMs: number = 250): UseVerseDetectorResult {
  const db = useSQLiteContext();
  const [debouncedContent, setDebouncedContent] = useState<string>(content);
  const [selectedPassage, setSelectedPassage] = useState<PassageDetails | null>(null);
  const [isLoadingPassage, setIsLoadingPassage] = useState<boolean>(false);

  // Debounce the content parsing for buttery smooth typing performance
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
        const verses: Verse[] = await BibleRepo.getVersesForParsedRef(db, ref);
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

  return {
    detectedReferences,
    textSegments,
    selectedPassage,
    isLoadingPassage,
    openVersePreview,
    closeVersePreview,
  };
}
