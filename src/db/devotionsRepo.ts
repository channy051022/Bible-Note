import { type SQLiteDatabase } from 'expo-sqlite';
import { Devotion, DevotionUserEntry, DevotionStreakInfo, DevotionCategory } from '../types/devotion';
import { CURATED_DEVOTIONS, getTodayDevotion } from '../data/devotionsData';

export const DevotionsRepo = {
  /**
   * Retrieves all user-created devotions from SQLite.
   */
  async getUserCreatedDevotions(db: SQLiteDatabase): Promise<Devotion[]> {
    try {
      const rows = await db.getAllAsync<{
        id: string;
        title: string;
        scripture_citation: string;
        scripture_text: string;
        book_id: number | null;
        chapter: number | null;
        verse: number | null;
        category: string;
        reflection_content: string;
        reflection_question: string;
        prayer: string;
        estimated_reading_minutes: number;
        created_at: string;
      }>('SELECT * FROM user_devotions ORDER BY created_at DESC');

      if (!rows || rows.length === 0) return [];

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        scriptureCitation: r.scripture_citation,
        scriptureText: r.scripture_text,
        bookId: r.book_id || undefined,
        chapter: r.chapter || undefined,
        verse: r.verse || undefined,
        category: (r.category as DevotionCategory) || 'Faith',
        reflectionContent: r.reflection_content,
        reflectionQuestion: r.reflection_question,
        prayer: r.prayer,
        estimatedReadingMinutes: r.estimated_reading_minutes || 3,
        isUserCreated: true,
        createdAt: r.created_at,
      }));
    } catch (e) {
      console.warn('Error fetching user-created devotions:', e);
      return [];
    }
  },

  /**
   * Retrieves a devotion by its ID (from daily verse, curated library, or SQLite user devotions).
   */
  async getDevotionById(db: SQLiteDatabase, devotionId: string): Promise<Devotion | null> {
    try {
      // 1. Check if it's the daily devotion format
      if (devotionId.startsWith('daily-')) {
        return getTodayDevotion();
      }

      // 2. Check curated devotions
      const curated = CURATED_DEVOTIONS.find((d) => d.id === devotionId);
      if (curated) return curated;

      // 3. Check user devotions in SQLite
      const row = await db.getFirstAsync<{
        id: string;
        title: string;
        scripture_citation: string;
        scripture_text: string;
        book_id: number | null;
        chapter: number | null;
        verse: number | null;
        category: string;
        reflection_content: string;
        reflection_question: string;
        prayer: string;
        estimated_reading_minutes: number;
        created_at: string;
      }>('SELECT * FROM user_devotions WHERE id = ?', [devotionId]);

      if (row) {
        return {
          id: row.id,
          title: row.title,
          scriptureCitation: row.scripture_citation,
          scriptureText: row.scripture_text,
          bookId: row.book_id || undefined,
          chapter: row.chapter || undefined,
          verse: row.verse || undefined,
          category: (row.category as DevotionCategory) || 'Faith',
          reflectionContent: row.reflection_content,
          reflectionQuestion: row.reflection_question,
          prayer: row.prayer,
          estimatedReadingMinutes: row.estimated_reading_minutes || 3,
          isUserCreated: true,
          createdAt: row.created_at,
        };
      }

      return null;
    } catch (e) {
      console.warn(`Error fetching devotion ${devotionId}:`, e);
      return null;
    }
  },

  /**
   * Saves a new user-created devotion into SQLite.
   */
  async createUserDevotion(db: SQLiteDatabase, devotion: Devotion): Promise<void> {
    try {
      await db.runAsync(
        `INSERT INTO user_devotions (
          id, title, scripture_citation, scripture_text, book_id, chapter, verse,
          category, reflection_content, reflection_question, prayer, estimated_reading_minutes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          devotion.id,
          devotion.title,
          devotion.scriptureCitation,
          devotion.scriptureText,
          devotion.bookId ?? null,
          devotion.chapter ?? null,
          devotion.verse ?? null,
          devotion.category,
          devotion.reflectionContent,
          devotion.reflectionQuestion,
          devotion.prayer,
          devotion.estimatedReadingMinutes,
          devotion.createdAt || new Date().toISOString(),
        ]
      );
    } catch (e) {
      console.error('Failed to create user devotion in SQLite:', e);
      throw e;
    }
  },

  /**
   * Deletes a user-created devotion and its user entry.
   */
  async deleteUserDevotion(db: SQLiteDatabase, devotionId: string): Promise<void> {
    try {
      await db.runAsync('DELETE FROM user_devotions WHERE id = ?', [devotionId]);
      await db.runAsync('DELETE FROM devotion_entries WHERE devotion_id = ?', [devotionId]);
    } catch (e) {
      console.error(`Failed to delete user devotion ${devotionId}:`, e);
      throw e;
    }
  },

  /**
   * Retrieves the user entry (reflections, answers, completion, favorite) for a devotion.
   */
  async getUserEntry(db: SQLiteDatabase, devotionId: string): Promise<DevotionUserEntry | null> {
    try {
      const row = await db.getFirstAsync<{
        devotion_id: string;
        user_answer: string | null;
        user_reflection: string | null;
        user_prayer: string | null;
        is_completed: number;
        completed_at: string | null;
        is_favorite: number;
        favorited_at: string | null;
        updated_at: string;
      }>('SELECT * FROM devotion_entries WHERE devotion_id = ?', [devotionId]);

      if (!row) return null;

      return {
        devotionId: row.devotion_id,
        userAnswer: row.user_answer || undefined,
        userReflection: row.user_reflection || undefined,
        userPrayer: row.user_prayer || undefined,
        isCompleted: row.is_completed === 1,
        completedAt: row.completed_at || undefined,
        isFavorite: row.is_favorite === 1,
        favoritedAt: row.favorited_at || undefined,
        updatedAt: row.updated_at,
      };
    } catch (e) {
      console.warn(`Error getting user entry for ${devotionId}:`, e);
      return null;
    }
  },

  /**
   * Updates or saves user reflections, thoughts, answers, and prayers for a devotion.
   */
  async saveUserReflection(
    db: SQLiteDatabase,
    devotionId: string,
    data: {
      userAnswer?: string;
      userReflection?: string;
      userPrayer?: string;
    }
  ): Promise<void> {
    try {
      const existing = await this.getUserEntry(db, devotionId);
      const now = new Date().toISOString();

      if (existing) {
        await db.runAsync(
          `UPDATE devotion_entries SET
            user_answer = ?,
            user_reflection = ?,
            user_prayer = ?,
            updated_at = ?
          WHERE devotion_id = ?`,
          [
            data.userAnswer !== undefined ? data.userAnswer : (existing.userAnswer ?? null),
            data.userReflection !== undefined ? data.userReflection : (existing.userReflection ?? null),
            data.userPrayer !== undefined ? data.userPrayer : (existing.userPrayer ?? null),
            now,
            devotionId,
          ]
        );
      } else {
        await db.runAsync(
          `INSERT INTO devotion_entries (
            devotion_id, user_answer, user_reflection, user_prayer, is_completed, completed_at, is_favorite, favorited_at, updated_at
          ) VALUES (?, ?, ?, ?, 0, NULL, 0, NULL, ?)`,
          [
            devotionId,
            data.userAnswer ?? null,
            data.userReflection ?? null,
            data.userPrayer ?? null,
            now,
          ]
        );
      }
    } catch (e) {
      console.error(`Failed to save user reflection for ${devotionId}:`, e);
      throw e;
    }
  },

  /**
   * Toggles the favorite status for a devotion.
   */
  async toggleFavorite(db: SQLiteDatabase, devotionId: string): Promise<boolean> {
    try {
      const existing = await this.getUserEntry(db, devotionId);
      const now = new Date().toISOString();

      if (existing) {
        const nextFav = !existing.isFavorite;
        await db.runAsync(
          `UPDATE devotion_entries SET
            is_favorite = ?,
            favorited_at = ?,
            updated_at = ?
          WHERE devotion_id = ?`,
          [nextFav ? 1 : 0, nextFav ? now : null, now, devotionId]
        );
        return nextFav;
      } else {
        await db.runAsync(
          `INSERT INTO devotion_entries (
            devotion_id, user_answer, user_reflection, user_prayer, is_completed, completed_at, is_favorite, favorited_at, updated_at
          ) VALUES (?, NULL, NULL, NULL, 0, NULL, 1, ?, ?)`,
          [devotionId, now, now]
        );
        return true;
      }
    } catch (e) {
      console.error(`Failed to toggle favorite for ${devotionId}:`, e);
      return false;
    }
  },

  /**
   * Sets or toggles completion status for a devotion.
   */
  async setDevotionCompleted(db: SQLiteDatabase, devotionId: string, completed: boolean = true): Promise<boolean> {
    try {
      const existing = await this.getUserEntry(db, devotionId);
      const now = new Date().toISOString();

      if (existing) {
        await db.runAsync(
          `UPDATE devotion_entries SET
            is_completed = ?,
            completed_at = ?,
            updated_at = ?
          WHERE devotion_id = ?`,
          [completed ? 1 : 0, completed ? now : null, now, devotionId]
        );
      } else {
        await db.runAsync(
          `INSERT INTO devotion_entries (
            devotion_id, user_answer, user_reflection, user_prayer, is_completed, completed_at, is_favorite, favorited_at, updated_at
          ) VALUES (?, NULL, NULL, NULL, ?, ?, 0, NULL, ?)`,
          [devotionId, completed ? 1 : 0, completed ? now : null, now]
        );
      }
      return completed;
    } catch (e) {
      console.error(`Failed to set devotion completion for ${devotionId}:`, e);
      return false;
    }
  },

  /**
   * Retrieves all completed devotion entries with metadata.
   */
  async getCompletedDevotionsHistory(
    db: SQLiteDatabase
  ): Promise<{ entry: DevotionUserEntry; devotion: Devotion }[]> {
    try {
      const rows = await db.getAllAsync<{
        devotion_id: string;
        user_answer: string | null;
        user_reflection: string | null;
        user_prayer: string | null;
        is_completed: number;
        completed_at: string | null;
        is_favorite: number;
        favorited_at: string | null;
        updated_at: string;
      }>('SELECT * FROM devotion_entries WHERE is_completed = 1 ORDER BY completed_at DESC');

      if (!rows || rows.length === 0) return [];

      const results: { entry: DevotionUserEntry; devotion: Devotion }[] = [];

      for (const r of rows) {
        const dev = await this.getDevotionById(db, r.devotion_id);
        if (dev) {
          results.push({
            entry: {
              devotionId: r.devotion_id,
              userAnswer: r.user_answer || undefined,
              userReflection: r.user_reflection || undefined,
              userPrayer: r.user_prayer || undefined,
              isCompleted: true,
              completedAt: r.completed_at || undefined,
              isFavorite: r.is_favorite === 1,
              favoritedAt: r.favorited_at || undefined,
              updatedAt: r.updated_at,
            },
            devotion: dev,
          });
        }
      }

      return results;
    } catch (e) {
      console.warn('Error fetching completed devotions history:', e);
      return [];
    }
  },

  /**
   * Retrieves all favorite devotion entries with metadata.
   */
  async getFavoriteDevotions(
    db: SQLiteDatabase
  ): Promise<{ entry: DevotionUserEntry; devotion: Devotion }[]> {
    try {
      const rows = await db.getAllAsync<{
        devotion_id: string;
        user_answer: string | null;
        user_reflection: string | null;
        user_prayer: string | null;
        is_completed: number;
        completed_at: string | null;
        is_favorite: number;
        favorited_at: string | null;
        updated_at: string;
      }>('SELECT * FROM devotion_entries WHERE is_favorite = 1 ORDER BY favorited_at DESC');

      if (!rows || rows.length === 0) return [];

      const results: { entry: DevotionUserEntry; devotion: Devotion }[] = [];

      for (const r of rows) {
        const dev = await this.getDevotionById(db, r.devotion_id);
        if (dev) {
          results.push({
            entry: {
              devotionId: r.devotion_id,
              userAnswer: r.user_answer || undefined,
              userReflection: r.user_reflection || undefined,
              userPrayer: r.user_prayer || undefined,
              isCompleted: r.is_completed === 1,
              completedAt: r.completed_at || undefined,
              isFavorite: true,
              favoritedAt: r.favorited_at || undefined,
              updatedAt: r.updated_at,
            },
            devotion: dev,
          });
        }
      }

      return results;
    } catch (e) {
      console.warn('Error fetching favorite devotions:', e);
      return [];
    }
  },

  /**
   * Calculates the devotion streak with non-punitive, warm encouragement.
   */
  async getDevotionStreak(db: SQLiteDatabase): Promise<DevotionStreakInfo> {
    try {
      const rows = await db.getAllAsync<{ completed_at: string }>(
        'SELECT completed_at FROM devotion_entries WHERE is_completed = 1 AND completed_at IS NOT NULL ORDER BY completed_at DESC'
      );

      if (!rows || rows.length === 0) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          totalCompleted: 0,
          encouragingMessage: 'Begin your quiet daily walk with God today.',
        };
      }

      const totalCompleted = rows.length;

      // Extract unique calendar days YYYY-MM-DD
      const dateSet = new Set<string>();
      rows.forEach((r) => {
        if (r.completed_at) {
          const d = new Date(r.completed_at);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dateSet.add(`${y}-${m}-${day}`);
        }
      });

      const sortedDates = Array.from(dateSet).sort().reverse();
      const lastCompletedDate = sortedDates[0];

      // Check today's date & yesterday's date
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      let streak = 0;
      let checkDate = new Date(today);

      // If user completed today, streak starts from today.
      // If user hasn't completed today yet, check if they completed yesterday to maintain active streak!
      if (dateSet.has(todayKey)) {
        checkDate = new Date(today);
      } else if (dateSet.has(yesterdayKey)) {
        checkDate = new Date(yesterday);
      } else {
        // Streak is 0, but provide gentle encouragement
        return {
          currentStreak: 0,
          longestStreak: Math.max(1, sortedDates.length),
          totalCompleted,
          lastCompletedDate,
          encouragingMessage: 'Welcome back. Every day is a fresh beginning with God.',
        };
      }

      while (true) {
        const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (dateSet.has(key)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      let message = 'Keep walking with God.';
      if (streak >= 14) {
        message = 'A faithful habit of abiding in His presence.';
      } else if (streak >= 7) {
        message = 'Another day of growing in faith and grace.';
      } else if (streak >= 3) {
        message = 'Your spirit is being renewed day by day.';
      } else if (streak >= 1) {
        message = 'Keep walking with God.';
      }

      return {
        currentStreak: streak,
        longestStreak: Math.max(streak, sortedDates.length),
        totalCompleted,
        lastCompletedDate,
        encouragingMessage: message,
      };
    } catch (e) {
      console.warn('Error calculating devotion streak:', e);
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalCompleted: 0,
        encouragingMessage: 'Keep walking with God.',
      };
    }
  },
};
