import { BIBLE_BOOKS, getBookById } from '../constants/BibleBooks';
import { ReadingPlan, ReadingPlanDay, ReadingPlanReading } from '../types/plan';

export type PlanScopeType =
  | 'custom_books'
  | 'custom_range'
  | 'whole_bible'
  | 'old_testament'
  | 'new_testament'
  | 'gospels'
  | 'wisdom'
  | 'epistles'
  | 'single_book';

export interface PlanScopeConfig {
  type: PlanScopeType;
  selectedBookIds?: number[];
  bookId?: number;
  startBookId?: number;
  startChapter?: number;
  endBookId?: number;
  endChapter?: number;
  durationDays: number;
}

export const POPULAR_PLAN_SCOPES = [
  {
    id: 'gospels' as const,
    title: 'The 4 Gospels',
    description: 'Matthew, Mark, Luke, and John (89 chapters) — Walk with Jesus through His life and ministry.',
    defaultDays: 30,
    category: 'new_testament' as const,
    totalChapters: 89,
  },
  {
    id: 'wisdom' as const,
    title: 'Psalms & Proverbs',
    description: 'Psalms & Proverbs (181 chapters) — Daily worship, comfort, and godly wisdom.',
    defaultDays: 30,
    category: 'topical' as const,
    totalChapters: 181,
  },
  {
    id: 'new_testament' as const,
    title: 'Entire New Testament',
    description: 'All 27 New Testament books (260 chapters) from Matthew to Revelation.',
    defaultDays: 90,
    category: 'new_testament' as const,
    totalChapters: 260,
  },
  {
    id: 'epistles' as const,
    title: 'The Epistles & Letters',
    description: 'Romans through Jude (107 chapters) — Doctrinal foundations and Christian living.',
    defaultDays: 30,
    category: 'new_testament' as const,
    totalChapters: 107,
  },
  {
    id: 'old_testament' as const,
    title: 'Old Testament Journey',
    description: 'All 39 Old Testament books (929 chapters) from Genesis to Malachi.',
    defaultDays: 180,
    category: 'canonical' as const,
    totalChapters: 929,
  },
  {
    id: 'whole_bible' as const,
    title: 'Whole Bible (Genesis - Revelation)',
    description: 'All 66 books of the Holy Bible (1,189 chapters) from creation to eternity.',
    defaultDays: 365,
    category: 'canonical' as const,
    totalChapters: 1189,
  },
];

export const PLAN_PRESETS = POPULAR_PLAN_SCOPES;

/**
 * Computes list of chapters from a given PlanScopeConfig
 */
export function getChaptersForScope(config: PlanScopeConfig): Array<{ bookId: number; bookName: string; chapter: number }> {
  const chapterList: Array<{ bookId: number; bookName: string; chapter: number }> = [];

  if (config.type === 'custom_books' && config.selectedBookIds && config.selectedBookIds.length > 0) {
    // Sort selected books in biblical order
    const sortedIds = [...config.selectedBookIds].sort((a, b) => a - b);
    for (const bId of sortedIds) {
      const book = getBookById(bId);
      if (book) {
        for (let ch = 1; ch <= book.chapters_count; ch++) {
          chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      }
    }
  } else if (config.type === 'custom_range' && config.startBookId && config.endBookId) {
    const startB = Math.min(config.startBookId, config.endBookId);
    const endB = Math.max(config.startBookId, config.endBookId);
    const startCh = config.startChapter || 1;

    for (let bId = startB; bId <= endB; bId++) {
      const book = getBookById(bId);
      if (book) {
        const fromCh = bId === startB ? Math.max(1, startCh) : 1;
        const toCh = bId === endB && config.endChapter ? Math.min(book.chapters_count, config.endChapter) : book.chapters_count;
        for (let ch = fromCh; ch <= toCh; ch++) {
          chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      }
    }
  } else if (config.type === 'whole_bible') {
    for (let bId = 1; bId <= 66; bId++) {
      const book = getBookById(bId);
      if (book) {
        for (let ch = 1; ch <= book.chapters_count; ch++) {
          chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      }
    }
  } else if (config.type === 'old_testament') {
    for (let bId = 1; bId <= 39; bId++) {
      const book = getBookById(bId);
      if (book) {
        for (let ch = 1; ch <= book.chapters_count; ch++) {
          chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      }
    }
  } else if (config.type === 'gospels') {
    for (let bId = 40; bId <= 43; bId++) {
      const book = getBookById(bId);
      if (book) {
        for (let ch = 1; ch <= book.chapters_count; ch++) {
          chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      }
    }
  } else if (config.type === 'new_testament') {
    for (let bId = 40; bId <= 66; bId++) {
      const book = getBookById(bId);
      if (book) {
        for (let ch = 1; ch <= book.chapters_count; ch++) {
          chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      }
    }
  } else if (config.type === 'wisdom') {
    for (const bId of [19, 20]) {
      const book = getBookById(bId);
      if (book) {
        for (let ch = 1; ch <= book.chapters_count; ch++) {
          chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      }
    }
  } else if (config.type === 'epistles') {
    for (let bId = 45; bId <= 65; bId++) {
      const book = getBookById(bId);
      if (book) {
        for (let ch = 1; ch <= book.chapters_count; ch++) {
          chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      }
    }
  } else if (config.type === 'single_book' && config.bookId) {
    const book = getBookById(config.bookId) || BIBLE_BOOKS[0];
    for (let ch = 1; ch <= book.chapters_count; ch++) {
      chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
    }
  } else {
    // Default fallback: Gospel of John
    const book = getBookById(43) || BIBLE_BOOKS[42];
    for (let ch = 1; ch <= book.chapters_count; ch++) {
      chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
    }
  }

  return chapterList;
}

/**
 * Generates an array of ReadingPlanDay objects evenly distributing chapters across the target duration.
 */
export function generatePlanSchedule(
  title: string,
  description: string,
  config: PlanScopeConfig
): ReadingPlan {
  const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const duration = Math.max(1, Math.min(config.durationDays || 30, 365));

  const chapterList = getChaptersForScope(config);
  const totalChapters = chapterList.length;
  const days: ReadingPlanDay[] = [];
  let currentIndex = 0;

  for (let d = 1; d <= duration; d++) {
    const remainingDays = duration - d + 1;
    const remainingChapters = totalChapters - currentIndex;
    const chaptersForThisDay = Math.max(1, Math.ceil(remainingChapters / remainingDays));

    const dayChapters = chapterList.slice(currentIndex, currentIndex + chaptersForThisDay);
    currentIndex += chaptersForThisDay;

    if (dayChapters.length > 0) {
      const first = dayChapters[0];
      const last = dayChapters[dayChapters.length - 1];
      const readings: ReadingPlanReading[] = [];

      if (first.bookId === last.bookId) {
        const passage = first.chapter === last.chapter
          ? `${first.bookName} ${first.chapter}`
          : `${first.bookName} ${first.chapter}-${last.chapter}`;
        readings.push({
          passage,
          bookId: first.bookId,
          chapter: first.chapter,
        });
      } else {
        const byBook = new Map<number, { bookName: string; start: number; end: number }>();
        for (const item of dayChapters) {
          if (!byBook.has(item.bookId)) {
            byBook.set(item.bookId, { bookName: item.bookName, start: item.chapter, end: item.chapter });
          } else {
            const existing = byBook.get(item.bookId)!;
            existing.end = item.chapter;
          }
        }

        byBook.forEach((val, bId) => {
          const passage = val.start === val.end
            ? `${val.bookName} ${val.start}`
            : `${val.bookName} ${val.start}-${val.end}`;
          readings.push({
            passage,
            bookId: bId,
            chapter: val.start,
          });
        });
      }

      days.push({
        day: d,
        title: readings.map((r) => r.passage).join(', '),
        readings,
      });
    }

    if (currentIndex >= totalChapters) break;
  }

  const generatedDaysCount = days.length > 0 ? days.length : 1;

  return {
    id: planId,
    title: title.trim() || 'My Bible Reading Plan',
    description: description.trim() || `${totalChapters} chapters across ${generatedDaysCount} days`,
    durationDays: generatedDaysCount,
    category: config.type === 'wisdom' ? 'topical' : 'canonical',
    days,
  };
}
