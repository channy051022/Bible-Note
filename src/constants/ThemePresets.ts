export type ThemePresetId =
  | 'celestial'
  | 'gold'
  | 'olive'
  | 'majesty'
  | 'rose'
  | 'waters'
  | 'parchment'
  | 'obsidian';

export interface ThemePresetInfo {
  id: ThemePresetId;
  name: string;
  subtitle: string;
  primaryColor: string;
  secondaryColor: string;
  icon: string;
}

export const THEME_PRESETS: ThemePresetInfo[] = [
  {
    id: 'celestial',
    name: 'Midnight Celestial',
    subtitle: 'Royal Sapphire & Starry Blue',
    primaryColor: '#3B82F6',
    secondaryColor: '#60A5FA',
    icon: '🌌',
  },
  {
    id: 'gold',
    name: 'Golden Glory',
    subtitle: 'Sunrise Amber & Divine Warmth',
    primaryColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    icon: '👑',
  },
  {
    id: 'olive',
    name: 'Mount Olive',
    subtitle: 'Peaceful Emerald & Sage Garden',
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
    icon: '🌿',
  },
  {
    id: 'majesty',
    name: 'Majesty of Zion',
    subtitle: 'Royal Purple & Lavender Grace',
    primaryColor: '#8B5CF6',
    secondaryColor: '#A78BFA',
    icon: '💜',
  },
  {
    id: 'rose',
    name: 'Rose of Sharon',
    subtitle: 'Warm Crimson & Velvet Coral',
    primaryColor: '#F43F5E',
    secondaryColor: '#FB7185',
    icon: '🌹',
  },
  {
    id: 'waters',
    name: 'Living Waters',
    subtitle: 'Ocean Cyan & Azure Stream',
    primaryColor: '#06B6D4',
    secondaryColor: '#22D3EE',
    icon: '🌊',
  },
  {
    id: 'parchment',
    name: 'Ancient Parchment',
    subtitle: 'Warm Earth & Ancient Scripture',
    primaryColor: '#D97706',
    secondaryColor: '#B45309',
    icon: '📜',
  },
  {
    id: 'obsidian',
    name: 'Pure Obsidian',
    subtitle: 'Minimalist Monochrome & AMOLED',
    primaryColor: '#A1A1AA',
    secondaryColor: '#E4E4E7',
    icon: '🖤',
  },
];
