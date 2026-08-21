export interface RingtoneItem {
  id: string;
  title: string;
  category: 'built-in' | 'custom';
  uri?: string;
  assetKey?: 'chimes' | 'harp' | 'piano' | 'fanfare' | 'cathedral';
}

export interface SpiritualAlarm {
  id: string;
  hour: number; // 0-23
  minute: number; // 0-59
  label: string;
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat (empty = everyday)
  isEnabled: boolean;
  verseSource: 'daily' | 'psalm23' | 'custom';
  customCitation?: string;
  customText?: string;
  bookId?: number;
  chapter?: number;
  verse?: number;
  ringtoneId?: string;
  customAudioUri?: string;
  customAudioName?: string;
  customAudioDuration?: number; // Duration in seconds of custom picked music
  customAudioStartOffset?: number; // Start timestamp in seconds (audio cut/trim point)
  /** @deprecated Alarms now loop continuously until dismissed or snoozed */
  durationSeconds?: number;
}
