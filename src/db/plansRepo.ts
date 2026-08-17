import { type SQLiteDatabase } from 'expo-sqlite';
import { ReadingProgress } from '../types/plan';

export const PlansRepo = {
  /**
   * Retrieves all completed days for a given plan.
   */
  async getPlanProgress(db: SQLiteDatabase, planId: string): Promise<ReadingProgress[]> {
    return await db.getAllAsync<ReadingProgress>(
      'SELECT plan_id, day, completed_at FROM reading_progress WHERE plan_id = ? ORDER BY day ASC',
      [planId]
    );
  },

  /**
   * Toggles a day's completed state.
   */
  async toggleDayCompletion(db: SQLiteDatabase, planId: string, day: number): Promise<boolean> {
    const existing = await db.getFirstAsync<ReadingProgress>(
      'SELECT day FROM reading_progress WHERE plan_id = ? AND day = ?',
      [planId, day]
    );

    if (existing) {
      await db.runAsync('DELETE FROM reading_progress WHERE plan_id = ? AND day = ?', [planId, day]);
      return false;
    } else {
      await db.runAsync(
        'INSERT INTO reading_progress (plan_id, day, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [planId, day]
      );
      return true;
    }
  },

  /**
   * Checks if a day is marked as completed.
   */
  async isDayCompleted(db: SQLiteDatabase, planId: string, day: number): Promise<boolean> {
    const result = await db.getFirstAsync<{ day: number }>(
      'SELECT day FROM reading_progress WHERE plan_id = ? AND day = ?',
      [planId, day]
    );
    return !!result;
  },
};
