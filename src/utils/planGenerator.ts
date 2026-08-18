import { BIBLE_BOOKS, getBookById } from '../constants/BibleBooks';
import { ReadingPlan, ReadingPlanDay, ReadingPlanReading } from '../types/plan';

export interface PlanScopeConfig {
  type: 'gospels' | 'new_testament' | 'wisdom' | 'epistles' | 'single_book' | 'custom_range';
  bookId?: number;
  startBookId?: number;
  endBookId?: number;
  durationDays: number;
}

export const PLAN_PRESETS = [
  {
    id: 'gospels',
    title: 'The 4 Gospels',
    description: 'Matthew, Mark, Luke, and John — walk with Jesus Christ through His life, ministry, and resurrection.',
    defaultDays: 30,
    category: 'new_testament' as const,
  },
  {
    id: 'new_testament',
    title: 'Entire New Testament',
    description: 'All 27 books of the New Testament from Matthew through Revelation.',
    defaultDays: 90,
    category: 'new_testament' as const,
  },
  {
    id: 'wisdom',
    title: 'Psalms & Proverbs',
    description: 'Daily encouragement, worship, and godly wisdom for life.',
    defaultDays: 30,
    category: 'topical' as const,
  },
  {
    id: 'epistles',
    title: 'Epistles of Paul',
    description: 'Romans through Philemon — doctrinal foundations and Christian living.',
    defaultDays: 30,
    category: 'new_testament' as const,
  },
  {
    id: 'single_book',
    title: 'Focus on a Single Book',
    description: 'Choose any specific book of the Bible to study at your own pace.',
    defaultDays: 14,
    category: 'canonical' as const,
  },
];

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

  // Determine list of (bookId, chapter) tuples to cover
  const chapterList: Array<{ bookId: number; bookName: string; chapter: number }> = [];

  if (config.type === 'gospels') {
    // Books 40 to 43 (Matthew, Mark, Luke, John)
    for (let bId = 40; bId <= 43; bId++) {
      const book = getBookById(bId);
      if (book) {
        for (let ch = 1; ch <= book.chapters_count; ch++) {
          chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      }
    }
  } else if (config.type === 'new_testament') {
    // Books 40 to 66 (Matthew to Revelation)
    for (let bId = 40; bId <= 66; bId++) {
      const book = getBookById(bId);
      if (book) {
        for (let ch = 1; ch <= book.chapters_count; ch++) {
          chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      }
    }
  } else if (config.type === 'wisdom') {
    // Psalms (19) & Proverbs (20)
    for (const bId of [19, 20]) {
      const book = getBookById(bId);
      if (book) {
        for (let ch = 1; ch <= book.chapters_count; ch++) {
          chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      }
    }
  } else if (config.type === 'epistles') {
    // Romans (45) to Philemon (57)
    for (let bId = 45; bId <= 57; bId++) {
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
  } else if (config.type === 'custom_range' && config.startBookId && config.endBookId) {
    const start = Math.min(config.startBookId, config.endBookId);
    const end = Math.max(config.startBookId, config.endBookId);
    for (let bId = start; bId <= end; bId++) {
      const book = getBookById(bId);
      if (book) {
        for (let ch = 1; ch <= book.chapters_count; ch++) {
          chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      }
    }
  } else {
    // Fallback: John
    const book = getBookById(43) || BIBLE_BOOKS[42];
    for (let ch = 1; ch <= book.chapters_count; ch++) {
      chapterList.push({ bookId: book.id, bookName: book.name, chapter: ch });
    }
  }

  // Evenly distribute chapters across days
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
      // Group contiguous chapters by book
      const readings: ReadingPlanReading[] = [];
      const first = dayChapters[0];
      const last = dayChapters[dayChapters.length - 1];

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
        // Multi-book split
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

  return {
    id: planId,
    title: title.trim() || 'My Bible Reading Plan',
    description: description.trim() || `${totalChapters} chapters across ${days.length} days`,
    durationDays: days.length,
    category: config.type === 'wisdom' ? 'topical' : 'canonical',
    days,
  };
}
