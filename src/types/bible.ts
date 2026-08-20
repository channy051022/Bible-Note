export type Testament = 'OT' | 'NT';
export type BibleVersion = string;

export interface BibleVersionMeta {
  id: BibleVersion;
  name: string;
  shortName: string;
  language: string;
  description: string;
  isPrebundled?: boolean;
  category?: 'English' | 'Filipino' | 'Spanish' | 'European' | 'Asian' | 'Other';
  fileSizeApprox?: string;
  sourceUrl?: string;
  totalVerses?: number;
}

export interface Book {
  id: number;
  name: string;
  abbreviation: string;
  testament: Testament;
  chapters_count: number;
}

export interface Verse {
  id: number;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
  book_name?: string;
  book_abbreviation?: string;
}

export interface Bookmark {
  id: number;
  book_id: number;
  chapter: number;
  verse: number;
  label: string | null;
  created_at: string;
  book_name?: string;
  verse_text?: string;
}

export interface BibleSearchMatch {
  id: number;
  book_id: number;
  book_name: string;
  book_abbrev: string;
  chapter: number;
  verse: number;
  text: string;
  rank?: number;
  is_book_match?: boolean;
  chapters_count?: number;
}

export interface ParsedPassageRef {
  raw: string;
  bookId: number;
  bookName: string;
  bookAbbrev: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  startIndex: number;
  endIndex: number;
}

export interface PassageDetails {
  ref: ParsedPassageRef;
  verses: Verse[];
  formattedTitle: string;
}
