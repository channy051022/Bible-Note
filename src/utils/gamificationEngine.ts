import { getItem, setItem } from './storage';

export type GameId = 'scramble' | 'books_sort' | 'crossword' | 'trivia';
export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface GameStats {
  gameId: GameId;
  level: number;
  highScore: number;
  gamesPlayed: number;
  gamesWon: number;
  totalStarsEarned: number;
  bestStreak: number;
  currentStreak: number;
}

export interface GamificationState {
  woolStars: number;
  level: number;
  starsToNextLevel: number;
  progressPercent: number; // 0 to 100
  dailyStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD
  gamesWonCount: number;
  unlockedBadgeIds: string[];
}

export interface UnlockableBadge {
  id: string;
  name: string;
  icon: string;
  requiredLevel: number;
  description: string;
}

export const UNLOCKABLE_BADGES: UnlockableBadge[] = [
  {
    id: 'badge_novice',
    name: 'Novice Shepherd',
    icon: '🐑',
    requiredLevel: 1,
    description: 'Beginner seeker in God\'s Word.',
  },
  {
    id: 'badge_explorer_hat',
    name: 'Explorer Hat',
    icon: '🤠',
    requiredLevel: 2,
    description: 'Unlocked Explorer gear for Shep!',
  },
  {
    id: 'badge_scroll_master',
    name: 'Scroll Master',
    icon: '📜',
    requiredLevel: 3,
    description: 'Master of biblical scriptures and passages.',
  },
  {
    id: 'badge_golden_staff',
    name: 'Golden Shepherd Staff',
    icon: '🦯✨',
    requiredLevel: 4,
    description: 'Shepherd\'s golden staff of guidance.',
  },
  {
    id: 'badge_saints_halo',
    name: 'Saint\'s Halo',
    icon: '😇',
    requiredLevel: 5,
    description: 'Shining halo of faith and wisdom.',
  },
];

const STORAGE_KEY_WOOL_STARS = 'gamification_wool_stars';
const STORAGE_KEY_DAILY_STREAK = 'gamification_daily_streak';
const STORAGE_KEY_LAST_PLAYED = 'gamification_last_played_date';
const STORAGE_KEY_GAMES_WON = 'gamification_games_won_count';
const STORAGE_KEY_GAME_STATS_PREFIX = 'gamification_stats_';

const DEFAULT_GAME_STATS = (gameId: GameId): GameStats => ({
  gameId,
  level: 1,
  highScore: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  totalStarsEarned: 0,
  bestStreak: 0,
  currentStreak: 0,
});

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysDifference(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 999;
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export const GamificationEngine = {
  /**
   * Retrieves full current overall gamification progress.
   */
  getState(): GamificationState {
    const woolStars = getItem<number>(STORAGE_KEY_WOOL_STARS, 0);
    const dailyStreak = getItem<number>(STORAGE_KEY_DAILY_STREAK, 0);
    const lastPlayedDate = getItem<string>(STORAGE_KEY_LAST_PLAYED, '');
    const gamesWonCount = getItem<number>(STORAGE_KEY_GAMES_WON, 0);

    const level = Math.floor(woolStars / 100) + 1;
    const remainder = woolStars % 100;
    const starsToNextLevel = 100 - remainder;
    const progressPercent = Math.min(100, Math.max(0, remainder));

    const unlockedBadgeIds = UNLOCKABLE_BADGES
      .filter((b) => level >= b.requiredLevel)
      .map((b) => b.id);

    return {
      woolStars,
      level,
      starsToNextLevel,
      progressPercent,
      dailyStreak,
      lastPlayedDate,
      gamesWonCount,
      unlockedBadgeIds,
    };
  },

  /**
   * Retrieves statistics for a specific game.
   */
  getGameStats(gameId: GameId): GameStats {
    const defaultStats = DEFAULT_GAME_STATS(gameId);
    return getItem<GameStats>(`${STORAGE_KEY_GAME_STATS_PREFIX}${gameId}`, defaultStats);
  },

  /**
   * Retrieves statistics for all available games.
   */
  getAllGameStats(): Record<GameId, GameStats> {
    return {
      scramble: this.getGameStats('scramble'),
      books_sort: this.getGameStats('books_sort'),
      crossword: this.getGameStats('crossword'),
      trivia: this.getGameStats('trivia'),
    };
  },

  /**
   * Record attempt when starting/playing a game.
   */
  recordGameAttempt(gameId: GameId): void {
    const current = this.getGameStats(gameId);
    current.gamesPlayed += 1;
    setItem(`${STORAGE_KEY_GAME_STATS_PREFIX}${gameId}`, current);
  },

  /**
   * Award stars and update per-game stats upon winning a game.
   */
  recordVictory(
    gameId: GameId = 'scramble',
    baseStars: number = 10,
    score: number = 100
  ): {
    newStars: number;
    newLevel: number;
    leveledUp: boolean;
    streakBonus: number;
    streakCount: number;
    gameStats: GameStats;
  } {
    const currentState = this.getState();
    const today = getTodayDateString();
    let streakBonus = 0;
    let newStreak = currentState.dailyStreak;

    // Check global daily streak
    if (!currentState.lastPlayedDate) {
      newStreak = 1;
      streakBonus = 25; // First play bonus
    } else {
      const daysDiff = getDaysDifference(currentState.lastPlayedDate, today);
      if (daysDiff === 1) {
        newStreak = currentState.dailyStreak + 1;
        streakBonus = 25; // Consecutive calendar day streak bonus
      } else if (daysDiff === 0) {
        newStreak = currentState.dailyStreak > 0 ? currentState.dailyStreak : 1;
        streakBonus = 0; // Already claimed streak bonus today
      } else {
        newStreak = 1;
        streakBonus = 25; // Reset streak, first day
      }
    }

    const totalStarsAwarded = baseStars + streakBonus;
    const newTotalStars = currentState.woolStars + totalStarsAwarded;
    const newLevel = Math.floor(newTotalStars / 100) + 1;
    const leveledUp = newLevel > currentState.level;

    // Update global storage
    setItem(STORAGE_KEY_WOOL_STARS, newTotalStars);
    setItem(STORAGE_KEY_DAILY_STREAK, newStreak);
    setItem(STORAGE_KEY_LAST_PLAYED, today);
    setItem(STORAGE_KEY_GAMES_WON, currentState.gamesWonCount + 1);

    // Update per-game statistics
    const gameStats = this.getGameStats(gameId);
    gameStats.gamesWon += 1;
    gameStats.totalStarsEarned += totalStarsAwarded;
    if (score > gameStats.highScore) {
      gameStats.highScore = score;
    }
    gameStats.currentStreak += 1;
    if (gameStats.currentStreak > gameStats.bestStreak) {
      gameStats.bestStreak = gameStats.currentStreak;
    }
    // Per-game level formula (every 5 wins = +1 level)
    gameStats.level = Math.floor(gameStats.gamesWon / 5) + 1;

    setItem(`${STORAGE_KEY_GAME_STATS_PREFIX}${gameId}`, gameStats);

    return {
      newStars: newTotalStars,
      newLevel,
      leveledUp,
      streakBonus,
      streakCount: newStreak,
      gameStats,
    };
  },
};
