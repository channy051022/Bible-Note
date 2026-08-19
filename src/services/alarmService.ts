import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SpiritualAlarm } from '../types/alarm';
import { getItem, setItem } from '../utils/storage';
import { getTodayVerseRef } from '../constants/VerseOfTheDay';
import { BIBLE_BOOKS } from '../constants/BibleBooks';

const ALARMS_STORAGE_KEY = 'SHEPHERD_SPIRITUAL_ALARMS';

const DEFAULT_ALARMS: SpiritualAlarm[] = [];

export const AlarmService = {
  /**
   * Loads all saved alarms (starts empty if no alarms have been created)
   */
  async getAlarms(): Promise<SpiritualAlarm[]> {
    const saved = getItem<SpiritualAlarm[] | null>(ALARMS_STORAGE_KEY, null);
    if (!saved) {
      return [];
    }
    // Filter out previously injected built-in default alarm IDs if user wants clean slate
    const filtered = saved.filter(
      (a) => a.id !== 'default-morning-alarm' && a.id !== 'default-evening-alarm'
    );
    if (filtered.length !== saved.length) {
      setItem(ALARMS_STORAGE_KEY, filtered);
      return filtered;
    }
    return saved;
  },

  /**
   * Saves a new or updated alarm and reschedules notifications
   */
  async saveAlarm(alarm: SpiritualAlarm): Promise<SpiritualAlarm[]> {
    const alarms = await this.getAlarms();
    const index = alarms.findIndex((a) => a.id === alarm.id);
    let updated: SpiritualAlarm[];
    if (index >= 0) {
      updated = [...alarms];
      updated[index] = alarm;
    } else {
      updated = [alarm, ...alarms];
    }
    setItem(ALARMS_STORAGE_KEY, updated);
    await this.syncAllAlarmSchedules(updated);
    return updated;
  },

  /**
   * Deletes an alarm by ID
   */
  async deleteAlarm(id: string): Promise<SpiritualAlarm[]> {
    const alarms = await this.getAlarms();
    const updated = alarms.filter((a) => a.id !== id);
    setItem(ALARMS_STORAGE_KEY, updated);
    await this.syncAllAlarmSchedules(updated);
    return updated;
  },

  /**
   * Toggles enabled state of an alarm
   */
  async toggleAlarm(id: string, isEnabled: boolean): Promise<SpiritualAlarm[]> {
    const alarms = await this.getAlarms();
    const updated = alarms.map((a) => (a.id === id ? { ...a, isEnabled } : a));
    setItem(ALARMS_STORAGE_KEY, updated);
    await this.syncAllAlarmSchedules(updated);
    return updated;
  },

  /**
   * Synchronizes active alarms with expo-notifications
   */
  async syncAllAlarmSchedules(alarms: SpiritualAlarm[]) {
    if (Platform.OS === 'web') return;

    try {
      // Clear old alarm notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      for (const alarm of alarms) {
        if (!alarm.isEnabled) continue;

        const ref = getTodayVerseRef();
        const book = BIBLE_BOOKS.find((b) => b.id === (alarm.bookId || ref.bookId));
        const citation = alarm.customCitation || `${book?.name || 'Scripture'} ${ref.chapter}:${ref.verse}`;
        const timeFormatted = AlarmService.formatTime(alarm.hour, alarm.minute);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🔔 ${timeFormatted} • ${alarm.label}`,
            body: `✝️ ${citation}: "${alarm.customText || 'Tap to rise and read Scripture with God today.'}"`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
            data: {
              alarmId: alarm.id,
              citation,
              text: alarm.customText || '',
              bookId: alarm.bookId || ref.bookId,
              chapter: alarm.chapter || ref.chapter,
              isSpiritualAlarm: true,
            },
          },
          trigger: {
            hour: alarm.hour,
            minute: alarm.minute,
            repeats: true,
          } as any,
        });
      }
    } catch (e) {
      console.warn('Error syncing alarm schedules:', e);
    }
  },

  /**
   * Formats hour and minute into a 12-hour AM/PM string (e.g. 7:00 AM)
   */
  formatTime(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  },

  /**
   * Helper to format repeat days string
   */
  formatDays(days: number[]): string {
    if (!days || days.length === 0 || days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((d) => dayLabels[d]).join(', ');
  },
};
