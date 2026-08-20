import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SpiritualAlarm } from '../types/alarm';
import { getItem, setItem } from '../utils/storage';
import { getTodayVerseRef } from '../constants/VerseOfTheDay';
import { BIBLE_BOOKS } from '../constants/BibleBooks';

const ALARMS_STORAGE_KEY = 'SHEPHERD_SPIRITUAL_ALARMS';

export interface RingtoneChannelConfig {
  soundFile: string;
  channelId: string;
  channelName: string;
}

export const RINGTONE_SOUND_MAP: Record<string, RingtoneChannelConfig> = {
  chimes: {
    soundFile: 'spiritual_chimes.wav',
    channelId: 'spiritual_alarm_chimes_v3',
    channelName: 'Spiritual Alarms (Wake Chimes)',
  },
  sunrise_bell: {
    soundFile: 'radiant_sunrise_bell.wav',
    channelId: 'spiritual_alarm_sunrise_v3',
    channelName: 'Spiritual Alarms (Sunrise Bells)',
  },
  fanfare: {
    soundFile: 'gospel_fanfare.wav',
    channelId: 'spiritual_alarm_fanfare_v3',
    channelName: 'Spiritual Alarms (Joyful Fanfare)',
  },
  cathedral: {
    soundFile: 'cathedral_bells.wav',
    channelId: 'spiritual_alarm_cathedral_v3',
    channelName: 'Spiritual Alarms (Cathedral Bells)',
  },
  harp: {
    soundFile: 'morning_harp.wav',
    channelId: 'spiritual_alarm_harp_v3',
    channelName: 'Spiritual Alarms (Morning Harp)',
  },
  piano: {
    soundFile: 'peaceful_piano.wav',
    channelId: 'spiritual_alarm_piano_v3',
    channelName: 'Spiritual Alarms (Peaceful Piano)',
  },
};

export const AlarmService = {
  /**
   * Loads all saved alarms
   */
  async getAlarms(): Promise<SpiritualAlarm[]> {
    const saved = getItem<SpiritualAlarm[] | null>(ALARMS_STORAGE_KEY, null);
    if (!saved) {
      return [];
    }
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
   * Ensures high-priority alarm notification channels & categories are registered
   */
  async initNotificationChannels() {
    if (Platform.OS === 'web') return;

    try {
      // 1. Android Alarm Notification Channels
      if (Platform.OS === 'android') {
        const vibrationPattern = [0, 800, 400, 800, 400, 800, 400, 800];

        // Register each ringtone's dedicated channel with ALARM audio attributes
        for (const [, conf] of Object.entries(RINGTONE_SOUND_MAP)) {
          await Notifications.setNotificationChannelAsync(conf.channelId, {
            name: conf.channelName,
            description: 'Spiritual wake-up alarm with God\'s Word and chime melodies',
            importance: Notifications.AndroidImportance.MAX,
            sound: conf.soundFile,
            audioAttributes: {
              usage: Notifications.AndroidAudioUsage.ALARM,
              contentType: Notifications.AndroidAudioContentType.SONIFICATION,
              flags: {
                enforceAudibility: true,
                requestHardwareAudioVideoSynchronization: false,
              },
            },
            vibrationPattern,
            enableLights: true,
            lightColor: '#E5A93C',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
            showBadge: true,
          });
        }

        // Daily verse background channel
        await Notifications.setNotificationChannelAsync('daily_verse_channel_v3', {
          name: 'Daily Verse of the Day',
          description: 'Daily scripture inspiration notification',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
          enableLights: false,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      // 2. Notification Category for interactive lock screen actions
      await Notifications.setNotificationCategoryAsync('spiritual_alarm', [
        {
          identifier: 'OPEN_VERSE',
          buttonTitle: '📖 Read Scripture',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'DISMISS_ALARM',
          buttonTitle: 'Dismiss',
          options: {
            isDestructive: true,
            opensAppToForeground: false,
          },
        },
      ]);
    } catch (e) {
      console.warn('Error setting up notification channels & categories:', e);
    }
  },

  /**
   * Reschedules all saved alarms from disk (called on app startup)
   */
  async rescheduleAllAlarms(): Promise<void> {
    try {
      const alarms = await this.getAlarms();
      await this.syncAllAlarmSchedules(alarms);
    } catch (e) {
      console.warn('Error during rescheduleAllAlarms:', e);
    }
  },

  /**
   * Synchronizes active alarms with expo-notifications
   */
  async syncAllAlarmSchedules(alarms: SpiritualAlarm[]) {
    if (Platform.OS === 'web') return;

    try {
      // 1. Request notification permissions if not already granted
      const settings = await Notifications.getPermissionsAsync();
      let granted = settings.granted || settings.status === 'granted';
      if (!granted) {
        const req = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: true,
            provideAppNotificationSettings: true,
          },
        });
        granted = req.granted || req.status === 'granted';
      }

      // 2. Ensure channels are initialized
      await this.initNotificationChannels();

      // 3. Cancel previously scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // 4. Re-register daily 6:00 AM lockscreen verse notification
      try {
        const ref = getTodayVerseRef();
        const book = BIBLE_BOOKS.find((b) => b.id === ref.bookId);
        const citation = `${book?.name || 'Scripture'} ${ref.chapter}:${ref.verse}`;
        await Notifications.scheduleNotificationAsync({
          identifier: 'daily-verse-of-day-notification',
          content: {
            title: `✨ Verse of the Day • ${citation}`,
            body: `May your heart be refreshed by God's Word today. Tap to read ${citation}.`,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
            data: { bookId: ref.bookId, chapter: ref.chapter, verse: ref.verse },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 6,
            minute: 0,
            channelId: Platform.OS === 'android' ? 'daily_verse_channel_v3' : undefined,
          } as any,
        });
      } catch (dailyErr) {
        console.warn('Error rescheduling daily verse along with alarms:', dailyErr);
      }

      // 5. Schedule all active alarms
      for (const alarm of alarms) {
        if (!alarm.isEnabled) continue;

        const ref = getTodayVerseRef();
        const book = BIBLE_BOOKS.find((b) => b.id === (alarm.bookId || ref.bookId));
        const citation = alarm.customCitation || `${book?.name || 'Scripture'} ${ref.chapter}:${ref.verse}`;
        const timeFormatted = AlarmService.formatTime(alarm.hour, alarm.minute);
        const verseBody = alarm.customText || 'The Lord is my shepherd; I shall not want.';

        const ringtoneKey = alarm.ringtoneId && RINGTONE_SOUND_MAP[alarm.ringtoneId] ? alarm.ringtoneId : 'chimes';
        const ringtoneConf = RINGTONE_SOUND_MAP[ringtoneKey] || RINGTONE_SOUND_MAP.chimes;
        const channelId = Platform.OS === 'android' ? ringtoneConf.channelId : undefined;
        const soundFileName = ringtoneConf.soundFile;

        const contentInput: Notifications.NotificationContentInput = {
          title: `🔔 ${timeFormatted} • ${alarm.label}`,
          body: `✝️ ${citation}\n"${verseBody}"`,
          sound: soundFileName,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 800, 400, 800, 400, 800, 400, 800],
          categoryIdentifier: 'spiritual_alarm',
          color: '#E5A93C',
          autoDismiss: false,
          sticky: false,
          data: {
            alarmId: alarm.id,
            timeString: timeFormatted,
            citation,
            text: verseBody,
            bookId: alarm.bookId || ref.bookId,
            chapter: alarm.chapter || ref.chapter,
            ringtoneId: ringtoneKey,
            customAudioUri: alarm.customAudioUri,
            isSpiritualAlarm: true,
          },
          interruptionLevel: 'timeSensitive',
        };

        const days = alarm.days && alarm.days.length > 0 ? alarm.days : [0, 1, 2, 3, 4, 5, 6];

        if (days.length === 7) {
          // Every day -> Daily repeating trigger
          await Notifications.scheduleNotificationAsync({
            identifier: `alarm-${alarm.id}`,
            content: contentInput,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: alarm.hour,
              minute: alarm.minute,
              channelId,
            } as any,
          });
        } else {
          // Specific days of the week -> Weekly repeating trigger per selected day
          for (const day of days) {
            // In expo-notifications, 1 = Sunday, 2 = Monday, ..., 7 = Saturday
            const weekday = day + 1;
            await Notifications.scheduleNotificationAsync({
              identifier: `alarm-${alarm.id}-day-${day}`,
              content: contentInput,
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                weekday,
                hour: alarm.hour,
                minute: alarm.minute,
                channelId,
              } as any,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error syncing alarm schedules:', e);
    }
  },

  /**
   * Schedules a delayed test alarm (e.g. 5 seconds) to test lockscreen wake-up behavior
   */
  async scheduleTestAlarm(seconds: number = 5, alarm: SpiritualAlarm): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await this.initNotificationChannels();

      const ref = getTodayVerseRef();
      const book = BIBLE_BOOKS.find((b) => b.id === (alarm.bookId || ref.bookId));
      const citation = alarm.customCitation || `${book?.name || 'Scripture'} ${ref.chapter}:${ref.verse}`;
      const timeFormatted = AlarmService.formatTime(alarm.hour, alarm.minute);
      const verseBody = alarm.customText || 'The Lord is my shepherd; I shall not want.';

      const ringtoneKey = alarm.ringtoneId && RINGTONE_SOUND_MAP[alarm.ringtoneId] ? alarm.ringtoneId : 'chimes';
      const ringtoneConf = RINGTONE_SOUND_MAP[ringtoneKey] || RINGTONE_SOUND_MAP.chimes;
      const channelId = Platform.OS === 'android' ? ringtoneConf.channelId : undefined;
      const soundFileName = ringtoneConf.soundFile;

      await Notifications.scheduleNotificationAsync({
        identifier: `test-alarm-${Date.now()}`,
        content: {
          title: `🔔 Spiritual Alarm Test • ${alarm.label}`,
          body: `✝️ ${citation}\n"${verseBody}"`,
          sound: soundFileName,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 800, 400, 800, 400, 800, 400, 800],
          categoryIdentifier: 'spiritual_alarm',
          color: '#E5A93C',
          autoDismiss: false,
          sticky: false,
          data: {
            alarmId: alarm.id,
            timeString: timeFormatted,
            citation,
            text: verseBody,
            bookId: alarm.bookId || ref.bookId,
            chapter: alarm.chapter || ref.chapter,
            ringtoneId: ringtoneKey,
            customAudioUri: alarm.customAudioUri,
            isSpiritualAlarm: true,
          },
          interruptionLevel: 'timeSensitive',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, seconds),
          repeats: false,
          channelId,
        } as any,
      });
    } catch (e) {
      console.warn('Error scheduling test alarm:', e);
      throw e;
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
