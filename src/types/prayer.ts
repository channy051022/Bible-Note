export interface DailyPrayer {
  title: string;
  prayer: string;
  reflection?: string;
  scriptureRef?: string;
  updatedAt?: string;
}

export const DEFAULT_DAILY_PRAYER: DailyPrayer = {
  title: 'Daily Prayer & Reflection',
  prayer:
    'Lord, grant me wisdom to understand Your Word, peace to quiet my anxieties, and courage to walk faithfully in Your love today. Amen.',
  reflection: 'Meditate on God\'s steadfast love and presence throughout your day.',
  scriptureRef: 'Psalm 119:105',
};

export const PRAYER_TEMPLATES: { id: string; label: string; prayer: DailyPrayer }[] = [
  {
    id: 'default',
    label: '🕊️ Guidance & Peace',
    prayer: {
      title: 'Daily Prayer for Peace & Guidance',
      prayer:
        'Lord, grant me wisdom to understand Your Word, peace to quiet my anxieties, and courage to walk faithfully in Your love today. Amen.',
      reflection: 'Trust in God\'s guidance as you step into today.',
      scriptureRef: 'Proverbs 3:5-6',
    },
  },
  {
    id: 'morning_gratitude',
    label: '☀️ Morning Gratitude',
    prayer: {
      title: 'Morning Praise & Gratitude',
      prayer:
        'Heavenly Father, thank You for the gift of a new day. May my words, thoughts, and actions bring glory to Your name and bless everyone I meet.',
      reflection: 'God\'s mercies are new every single morning.',
      scriptureRef: 'Lamentations 3:22-23',
    },
  },
  {
    id: 'strength_faith',
    label: '🛡️ Strength & Protection',
    prayer: {
      title: 'Prayer for Strength & Faith',
      prayer:
        'Lord Jesus, be my fortress and my shield. When difficulties arise, remind me that You are greater than any obstacle I face.',
      reflection: 'You are never alone; the Lord fights for you.',
      scriptureRef: 'Philippians 4:13',
    },
  },
  {
    id: 'family_loved_ones',
    label: '👨‍👩‍👧 Family & Loved Ones',
    prayer: {
      title: 'Prayer for Family & Home',
      prayer:
        'Lord, bless my family and loved ones with good health, unity, and salvation. Guard our hearts and fill our home with Your peace.',
      reflection: 'Bring your loved ones before God\'s throne of grace.',
      scriptureRef: 'Joshua 24:15',
    },
  },
];
