export type DevotionCategory =
  | 'Faith'
  | 'Hope'
  | 'Love'
  | 'Prayer'
  | 'Strength'
  | 'Guidance'
  | 'Gratitude'
  | 'Forgiveness'
  | 'Peace'
  | 'Wisdom'
  | 'Anxiety & Worry'
  | 'Personal Growth';

export const DEVOTION_CATEGORIES: DevotionCategory[] = [
  'Faith',
  'Hope',
  'Love',
  'Prayer',
  'Strength',
  'Guidance',
  'Gratitude',
  'Forgiveness',
  'Peace',
  'Wisdom',
  'Anxiety & Worry',
  'Personal Growth',
];

export interface Devotion {
  id: string; // e.g. 'daily-2026-08-24' or 'custom-123456789'
  title: string;
  scriptureCitation: string; // e.g. "Proverbs 3:5–6"
  scriptureText: string; // "Trust in the Lord with all your heart..."
  bookId?: number;
  chapter?: number;
  verse?: number;
  category: DevotionCategory;
  reflectionContent: string; // Paragraphs of devotional reflection
  reflectionQuestion: string; // "Think About It" prompt
  prayer: string; // "Today's Prayer"
  estimatedReadingMinutes: number;
  isUserCreated: boolean;
  dateKey?: string; // Format "YYYY-MM-DD" for daily devotions
  createdAt: string;
}

export interface DevotionUserEntry {
  devotionId: string;
  userAnswer?: string; // User answer to "Think About It"
  userReflection?: string; // Personal notes & thoughts
  userPrayer?: string; // User's personal prayer
  isCompleted: boolean;
  completedAt?: string; // ISO date string
  isFavorite: boolean;
  favoritedAt?: string;
  updatedAt?: string;
}

export interface DevotionStreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  lastCompletedDate?: string;
  encouragingMessage: string;
}
