import { ThemePresetId } from './ThemePresets';

export interface ThemeColors {
  text: string;
  textSecondary: string;
  textTertiary: string;
  background: string;
  secondaryBackground: string;
  tertiaryBackground: string;
  groupedBackground: string;
  card: string;
  border: string;
  separator: string;
  tint: string;
  tintLight: string;
  accent: string;
  verseHighlight: string;
  versePill: string;
  versePillBorder: string;
  versePillText: string;
  tabBar: string;
  tabBarBorder: string;
  danger: string;
  success: string;
  gold: string;
  // Glassmorphism tokens
  glassBackground: string;
  glassCard: string;
  glassCardElevated: string;
  glassBorder: string;
  glassBorderSubtle: string;
  glassInput: string;
  glassPill: string;
  glassHighlight: string;
}

const PRESET_ACCENTS: Record<
  ThemePresetId,
  {
    primaryLight: string;
    primaryDark: string;
    accentLight: string;
    accentDark: string;
    bgDark: string;
    cardDark: string;
    bgLight: string;
    cardLight: string;
  }
> = {
  celestial: {
    primaryLight: '#007AFF',
    primaryDark: '#60A5FA',
    accentLight: '#5856D6',
    accentDark: '#818CF8',
    bgDark: '#090D16',
    cardDark: '#131926',
    bgLight: '#F4F7FC',
    cardLight: '#FFFFFF',
  },
  gold: {
    primaryLight: '#D97706',
    primaryDark: '#FBBF24',
    accentLight: '#B45309',
    accentDark: '#F59E0B',
    bgDark: '#120E05',
    cardDark: '#21190B',
    bgLight: '#FFFBF2',
    cardLight: '#FFFFFF',
  },
  olive: {
    primaryLight: '#059669',
    primaryDark: '#34D399',
    accentLight: '#047857',
    accentDark: '#10B981',
    bgDark: '#06150F',
    cardDark: '#0E261B',
    bgLight: '#F0FDF4',
    cardLight: '#FFFFFF',
  },
  majesty: {
    primaryLight: '#7C3AED',
    primaryDark: '#A78BFA',
    accentLight: '#6D28D9',
    accentDark: '#C084FC',
    bgDark: '#0F0B1A',
    cardDark: '#1B142D',
    bgLight: '#F6F4FE',
    cardLight: '#FFFFFF',
  },
  rose: {
    primaryLight: '#E11D48',
    primaryDark: '#FB7185',
    accentLight: '#BE123C',
    accentDark: '#F43F5E',
    bgDark: '#17080C',
    cardDark: '#271017',
    bgLight: '#FFF1F2',
    cardLight: '#FFFFFF',
  },
  waters: {
    primaryLight: '#0891B2',
    primaryDark: '#22D3EE',
    accentLight: '#0E7490',
    accentDark: '#06B6D4',
    bgDark: '#061217',
    cardDark: '#0E2028',
    bgLight: '#EDFDFF',
    cardLight: '#FFFFFF',
  },
  parchment: {
    primaryLight: '#B45309',
    primaryDark: '#FBBF24',
    accentLight: '#92400E',
    accentDark: '#D97706',
    bgDark: '#17120B',
    cardDark: '#241C12',
    bgLight: '#FAF7F0',
    cardLight: '#FFFFFF',
  },
  obsidian: {
    primaryLight: '#4B5563',
    primaryDark: '#E4E4E7',
    accentLight: '#1F2937',
    accentDark: '#A1A1AA',
    bgDark: '#050505',
    cardDark: '#141414',
    bgLight: '#F9FAFB',
    cardLight: '#FFFFFF',
  },
};

export function getThemeColors(presetId: ThemePresetId = 'celestial', isDark: boolean = true): ThemeColors {
  const p = PRESET_ACCENTS[presetId] || PRESET_ACCENTS.celestial;
  const tint = isDark ? p.primaryDark : p.primaryLight;
  const accent = isDark ? p.accentDark : p.accentLight;

  if (isDark) {
    return {
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      textTertiary: '#64748B',
      background: p.bgDark,
      secondaryBackground: '#131824',
      tertiaryBackground: '#1C2333',
      groupedBackground: p.bgDark,
      card: p.cardDark,
      border: 'rgba(255, 255, 255, 0.12)',
      separator: 'rgba(255, 255, 255, 0.08)',
      tint,
      tintLight: `${tint}26`, // 15% opacity
      accent,
      verseHighlight: 'rgba(255, 215, 0, 0.18)',
      versePill: `${tint}22`,
      versePillBorder: `${tint}4D`,
      versePillText: tint,
      tabBar: p.bgDark,
      tabBarBorder: 'rgba(255, 255, 255, 0.08)',
      danger: '#FF453A',
      success: '#32D74B',
      gold: '#FFD60A',
      glassBackground: `${p.cardDark}E6`,
      glassCard: `${p.cardDark}F2`,
      glassCardElevated: p.cardDark,
      glassBorder: 'rgba(255, 255, 255, 0.15)',
      glassBorderSubtle: 'rgba(255, 255, 255, 0.08)',
      glassInput: 'rgba(255, 255, 255, 0.06)',
      glassPill: `${tint}26`,
      glassHighlight: 'rgba(255, 215, 0, 0.18)',
    };
  }

  return {
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    background: p.bgLight,
    secondaryBackground: '#EAEFF8',
    tertiaryBackground: '#FFFFFF',
    groupedBackground: p.bgLight,
    card: p.cardLight,
    border: 'rgba(0, 0, 0, 0.09)',
    separator: 'rgba(0, 0, 0, 0.06)',
    tint,
    tintLight: `${tint}1A`, // 10% opacity
    accent,
    verseHighlight: '#FEF3C7',
    versePill: `${tint}14`,
    versePillBorder: `${tint}40`,
    versePillText: tint,
    tabBar: p.cardLight,
    tabBarBorder: 'rgba(0, 0, 0, 0.08)',
    danger: '#DC2626',
    success: '#16A34A',
    gold: '#D97706',
    glassBackground: 'rgba(255, 255, 255, 0.90)',
    glassCard: 'rgba(255, 255, 255, 0.95)',
    glassCardElevated: '#FFFFFF',
    glassBorder: 'rgba(0, 0, 0, 0.10)',
    glassBorderSubtle: 'rgba(0, 0, 0, 0.05)',
    glassInput: 'rgba(0, 0, 0, 0.04)',
    glassPill: `${tint}18`,
    glassHighlight: 'rgba(245, 158, 11, 0.14)',
  };
}

export const Colors = {
  light: getThemeColors('celestial', false),
  dark: getThemeColors('celestial', true),
};
