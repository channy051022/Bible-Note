export interface ReadingPlanReading {
  passage: string; // e.g. "Genesis 1-3" or "Matthew 1"
  bookId?: number;
  chapter?: number;
}

export interface ReadingPlanDay {
  day: number;
  title?: string;
  readings: ReadingPlanReading[];
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  category: 'chronological' | 'canonical' | 'new_testament' | 'topical';
  days: ReadingPlanDay[];
}

export interface ReadingProgress {
  plan_id: string;
  day: number;
  completed_at: string;
}
