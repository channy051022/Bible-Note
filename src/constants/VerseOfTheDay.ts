export interface DailyVerseRef {
  bookId: number;
  chapter: number;
  verse: number;
}

export const DAILY_VERSES: DailyVerseRef[] = [
  { bookId: 43, chapter: 3, verse: 16 }, // John 3:16
  { bookId: 50, chapter: 4, verse: 13 }, // Philippians 4:13
  { bookId: 19, chapter: 23, verse: 1 }, // Psalms 23:1
  { bookId: 20, chapter: 3, verse: 5 },  // Proverbs 3:5
  { bookId: 45, chapter: 8, verse: 28 }, // Romans 8:28
  { bookId: 24, chapter: 29, verse: 11 }, // Jeremiah 29:11
  { bookId: 23, chapter: 40, verse: 31 }, // Isaiah 40:31
  { bookId: 40, chapter: 6, verse: 33 }, // Matthew 6:33
  { bookId: 45, chapter: 12, verse: 2 }, // Romans 12:2
  { bookId: 48, chapter: 5, verse: 22 }, // Galatians 5:22
  { bookId: 50, chapter: 4, verse: 6 },  // Philippians 4:6
  { bookId: 49, chapter: 2, verse: 8 },  // Ephesians 2:8
  { bookId: 6, chapter: 1, verse: 9 },   // Joshua 1:9
  { bookId: 19, chapter: 46, verse: 1 }, // Psalms 46:1
  { bookId: 19, chapter: 119, verse: 105 }, // Psalms 119:105
  { bookId: 40, chapter: 11, verse: 28 }, // Matthew 11:28
  { bookId: 43, chapter: 14, verse: 6 }, // John 14:6
  { bookId: 47, chapter: 5, verse: 17 }, // 2 Corinthians 5:17
  { bookId: 55, chapter: 1, verse: 7 },  // 2 Timothy 1:7
  { bookId: 58, chapter: 11, verse: 1 }, // Hebrews 11:1
  { bookId: 59, chapter: 1, verse: 2 },  // James 1:2
  { bookId: 60, chapter: 5, verse: 7 },  // 1 Peter 5:7
  { bookId: 62, chapter: 1, verse: 9 },  // 1 John 1:9
  { bookId: 19, chapter: 91, verse: 1 }, // Psalms 91:1
  { bookId: 23, chapter: 41, verse: 10 }, // Isaiah 41:10
  { bookId: 20, chapter: 18, verse: 10 }, // Proverbs 18:10
  { bookId: 40, chapter: 28, verse: 19 }, // Matthew 28:19
  { bookId: 43, chapter: 10, verse: 10 }, // John 10:10
  { bookId: 45, chapter: 5, verse: 8 },  // Romans 5:8
  { bookId: 46, chapter: 13, verse: 13 }, // 1 Corinthians 13:13
  { bookId: 48, chapter: 2, verse: 20 }, // Galatians 2:20
  { bookId: 49, chapter: 6, verse: 11 }, // Ephesians 6:11
  { bookId: 50, chapter: 1, verse: 6 },  // Philippians 1:6
  { bookId: 51, chapter: 3, verse: 2 },  // Colossians 3:2
  { bookId: 52, chapter: 5, verse: 16 }, // 1 Thessalonians 5:16
  { bookId: 58, chapter: 4, verse: 12 }, // Hebrews 4:12
  { bookId: 66, chapter: 21, verse: 4 }, // Revelation 21:4
];

export function getTodayVerseRef(): DailyVerseRef {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = Math.abs(dayOfYear) % DAILY_VERSES.length;
  return DAILY_VERSES[index];
}
