import { type SQLiteDatabase } from 'expo-sqlite';
import { ReadingPlan } from '../types/plan';

export const PlansRepo = {
  /**
   * Retrieves all user-created reading plans.
   */
  async getUserPlans(db: SQLiteDatabase): Promise<ReadingPlan[]> {
    try {
      const rows = await db.getAllAsync<{
        id: string;
        title: string;
        description: string;
        duration_days: number;
        category: string;
        days_json: string;
        created_at: string;
      }>('SELECT * FROM user_plans ORDER BY created_at DESC');

      if (!rows || rows.length === 0) {
        return [];
      }

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        durationDays: r.duration_days,
        category: (r.category as any) || 'canonical',
        days: JSON.parse(r.days_json || '[]'),
      }));
    } catch (e) {
      console.warn('Error fetching user plans:', e);
      return [];
    }
  },

  /**
   * Retrieves a single reading plan by ID.
   */
  async getPlanById(db: SQLiteDatabase, planId: string): Promise<ReadingPlan | null> {
    try {
      const row = await db.getFirstAsync<{
        id: string;
        title: string;
        description: string;
        duration_days: number;
        category: string;
        days_json: string;
        created_at: string;
      }>('SELECT * FROM user_plans WHERE id = ?', [planId]);

      if (!row) return null;

      return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        durationDays: row.duration_days,
        category: (row.category as any) || 'canonical',
        days: JSON.parse(row.days_json || '[]'),
      };
    } catch (e) {
      console.warn(`Error fetching plan ${planId}:`, e);
      return null;
    }
  },

  /**
   * Creates and stores a new user-created reading plan.
   */
  async createPlan(db: SQLiteDatabase, plan: ReadingPlan): Promise<void> {
    try {
      await db.runAsync(
        `INSERT INTO user_plans (id, title, description, duration_days, category, days_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          plan.id,
          plan.title,
          plan.description,
          plan.durationDays,
          plan.category,
          JSON.stringify(plan.days),
        ]
      );
    } catch (e) {
      console.error('Failed to create plan in SQLite:', e);
      throw e;
    }
  },

  /**
   * Deletes a plan and all its completion progress.
   */
  async deletePlan(db: SQLiteDatabase, planId: string): Promise<void> {
    try {
      await db.runAsync('DELETE FROM user_plans WHERE id = ?', [planId]);
      await db.runAsync('DELETE FROM reading_progress WHERE plan_id = ?', [planId]);
    } catch (e) {
      console.error(`Failed to delete plan ${planId}:`, e);
      throw e;
    }
  },

  /**
   * Retrieves completed day numbers for a plan.
   */
  async getCompletedDays(db: SQLiteDatabase, planId: string): Promise<number[]> {
    try {
      const rows = await db.getAllAsync<{ day: number }>(
        'SELECT day FROM reading_progress WHERE plan_id = ? ORDER BY day ASC',
        [planId]
      );
      return rows.map((r) => r.day);
    } catch (e) {
      console.warn(`Error fetching progress for plan ${planId}:`, e);
      return [];
    }
  },

  /**
   * Toggles completion of a day in a reading plan.
   */
  async toggleDayProgress(db: SQLiteDatabase, planId: string, day: number): Promise<boolean> {
    try {
      const existing = await db.getFirstAsync<{ day: number }>(
        'SELECT day FROM reading_progress WHERE plan_id = ? AND day = ?',
        [planId, day]
      );

      if (existing) {
        await db.runAsync('DELETE FROM reading_progress WHERE plan_id = ? AND day = ?', [planId, day]);
        return false;
      } else {
        await db.runAsync('INSERT INTO reading_progress (plan_id, day) VALUES (?, ?)', [planId, day]);
        return true;
      }
    } catch (e) {
      console.error(`Failed to toggle day ${day} for plan ${planId}:`, e);
      return false;
    }
  },
};
