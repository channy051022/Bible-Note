import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SpiritualAlarm } from '../types/alarm';
import { getItem, setItem } from '../utils/storage';
import { getTodayVerseRef } from '../constants/VerseOfTheDay';
import { BIBLE_BOOKS } from '../constants/BibleBooks';
import { SoundService } from './soundService';

const ALARMS_STORAGE_KEY = 'SHEPHERD_SPIRITUAL_ALARMS';

export interface RingtoneChannelConfig {
  soundFile: string;
  channelId: string;
  channelName: string;
}

export const RINGTONE_SOUND_MAP: Record<string, RingtoneChannelConfig> = {
  chimes: {
    soundFile: 'spiritual_chimes.wav',
    channelId: 'spiritual_alarm_chimes_v4',
    channelName: 'Spiritual Alarms (Wake Chimes)',
  },
  sunrise_bell: {
    soundFile: 'radiant_sunrise_bell.wav',
    channelId: 'spiritual_alarm_sunrise_v4',
    channelName: 'Spiritual Alarms (Sunrise Bells)',
  },
  fanfare: {
    soundFile: 'gospel_fanfare.wav',
    channelId: 'spiritual_alarm_fanfare_v4',
    channelName: 'Spiritual Alarms (Joyful Fanfare)',
  },
  cathedral: {
    soundFile: 'cathedral_bells.wav',
    channelId: 'spiritual_alarm_cathedral_v4',
    channelName: 'Spiritual Alarms (Cathedral Bells)',
  },
  harp: {
    soundFile: 'morning_harp.wav',
    channelId: 'spiritual_alarm_harp_v4',
    channelName: 'Spiritual Alarms (Morning Harp)',
  },
  piano: {
    soundFile: 'peaceful_piano.wav',
    channelId: 'spiritual_alarm_piano_v4',
    channelName: 'Spiritual Alarms (Peaceful Piano)',
  },
};

// 10 continuous waves spaced 28s apart = ~5 minutes of continuous non-stop ringing
const ALARM_WAVES_COUNT = 10;
const WAVE_INTERVAL_SECONDS = 28;

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
   * Requests notification permissions across iOS & Android 13+
   */
  async requestNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
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
      return granted;
    } catch (e) {
      console.warn('Error requesting notification permissions:', e);
      return false;
    }
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

        // Register each ringtone's dedicated channel with ALARM audio attributes and maximum importance
        for (const [, conf] of Object.entries(RINGTONE_SOUND_MAP)) {
          await Notifications.setNotificationChannelAsync(conf.channelId, {
            name: conf.channelName,
            description: "Spiritual wake-up alarm with God's Word and chime melodies",
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
            enableVibrate: true,
            enableLights: true,
            lightColor: '#E5A93C',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
            showBadge: true,
          });
        }

        // Daily verse background channel
        await Notifications.setNotificationChannelAsync('daily_verse_channel_v4', {
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
   * Calculates the exact upcoming Date for a given weekday (0=Sun..6=Sat) and time (hour, minute)
   */
  getNextOccurrenceDate(dayOfWeek: number, hour: number, minute: number): Date {
    const now = new Date();
    const currentDay = now.getDay();
    let daysUntil = (dayOfWeek - currentDay + 7) % 7;

    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysUntil,
      hour,
      minute,
      0,
      0
    );

    // If target is today but the scheduled minute has already passed, schedule for next week
    if (daysUntil === 0 && target.getTime() <= now.getTime() + 5000) {
      target.setDate(target.getDate() + 7);
    }

    return target;
  },

  /**
   * Reschedules all saved alarms from disk (called on app startup and focus)
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
   * Uses multi-wave bursts for upcoming alarm times to guarantee continuous looping on iOS & Android
   */
  async syncAllAlarmSchedules(alarms: SpiritualAlarm[]) {
    if (Platform.OS === 'web') return;

    try {
      // 1. Request notification permissions if not already granted
      await this.requestNotificationPermissions();

      // 2. Ensure channels are initialized
      await this.initNotificationChannels();

      // 3. Cancel previously scheduled alarm notifications
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
            channelId: Platform.OS === 'android' ? 'daily_verse_channel_v4' : undefined,
          } as any,
        });
      } catch (dailyErr) {
        console.warn('Error rescheduling daily verse along with alarms:', dailyErr);
      }

      // 5. Schedule all active alarms with continuous wave bursts
      for (const alarm of alarms) {
        if (!alarm.isEnabled) continue;

        const ref = getTodayVerseRef();
        const book = BIBLE_BOOKS.find((b) => b.id === (alarm.bookId || ref.bookId));
        const citation =
          alarm.customCitation || `${book?.name || 'Scripture'} ${ref.chapter}:${ref.verse}`;
        const timeFormatted = AlarmService.formatTime(alarm.hour, alarm.minute);
        const verseBody = alarm.customText || 'The Lord is my shepherd; I shall not want.';

        const ringtoneKey =
          alarm.ringtoneId && RINGTONE_SOUND_MAP[alarm.ringtoneId] ? alarm.ringtoneId : 'chimes';
        const ringtoneConf = RINGTONE_SOUND_MAP[ringtoneKey] || RINGTONE_SOUND_MAP.chimes;
        const channelId = Platform.OS === 'android' ? ringtoneConf.channelId : undefined;
        const soundFileName = ringtoneConf.soundFile;

        const days =
          alarm.days && alarm.days.length > 0 ? alarm.days : [0, 1, 2, 3, 4, 5, 6];

        // For each active day, calculate the next upcoming occurrence
        for (const day of days) {
          const nextDate = this.getNextOccurrenceDate(day, alarm.hour, alarm.minute);

          // Schedule consecutive waves (28s apart) for continuous looping
          for (let wave = 0; wave < ALARM_WAVES_COUNT; wave++) {
            const waveTimestamp = new Date(
              nextDate.getTime() + wave * WAVE_INTERVAL_SECONDS * 1000
            );

            await Notifications.scheduleNotificationAsync({
              identifier: `alarm-wave-${alarm.id}-d${day}-w${wave}`,
              content: {
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
                  waveIndex: wave,
                },
                interruptionLevel: 'timeSensitive',
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: waveTimestamp,
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
   * Schedules a delayed test alarm with consecutive waves (looping) to test lockscreen wake-up behavior
   */
  async scheduleTestAlarm(seconds: number = 5, alarm: SpiritualAlarm): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await this.requestNotificationPermissions();
      await this.initNotificationChannels();
      await this.dismissActiveAlarm();

      const ref = getTodayVerseRef();
      const book = BIBLE_BOOKS.find((b) => b.id === (alarm.bookId || ref.bookId));
      const citation =
        alarm.customCitation || `${book?.name || 'Scripture'} ${ref.chapter}:${ref.verse}`;
      const timeFormatted = AlarmService.formatTime(alarm.hour, alarm.minute);
      const verseBody = alarm.customText || 'The Lord is my shepherd; I shall not want.';

      const ringtoneKey =
        alarm.ringtoneId && RINGTONE_SOUND_MAP[alarm.ringtoneId] ? alarm.ringtoneId : 'chimes';
      const ringtoneConf = RINGTONE_SOUND_MAP[ringtoneKey] || RINGTONE_SOUND_MAP.chimes;
      const channelId = Platform.OS === 'android' ? ringtoneConf.channelId : undefined;
      const soundFileName = ringtoneConf.soundFile;

      // Schedule consecutive waves (28s apart) so it loops continuously for ~5 minutes
      for (let wave = 0; wave < ALARM_WAVES_COUNT; wave++) {
        const triggerDelay = Math.max(1, seconds + wave * WAVE_INTERVAL_SECONDS);
        await Notifications.scheduleNotificationAsync({
          identifier: `alarm-wave-test-${alarm.id}-${wave}`,
          content: {
            title: `🔔 Spiritual Alarm • ${alarm.label}`,
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
              waveIndex: wave,
            },
            interruptionLevel: 'timeSensitive',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: triggerDelay,
            repeats: false,
            channelId,
          } as any,
        });
      }
    } catch (e) {
      console.warn('Error scheduling test alarm:', e);
      throw e;
    }
  },

  /**
   * Snoozes an alarm for a given number of minutes (default 5 minutes) with continuous waves
   */
  async snoozeAlarm(
    alarm: {
      id: string;
      label: string;
      ringtoneId?: string;
      customAudioUri?: string;
      customText?: string;
      customCitation?: string;
      bookId?: number;
      chapter?: number;
    },
    snoozeMinutes: number = 5
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await this.dismissActiveAlarm();
      const delaySeconds = Math.max(10, snoozeMinutes * 60);

      const ref = getTodayVerseRef();
      const book = BIBLE_BOOKS.find((b) => b.id === (alarm.bookId || ref.bookId));
      const citation =
        alarm.customCitation || `${book?.name || 'Scripture'} ${ref.chapter}:${ref.verse}`;
      const now = new Date();
      now.setMinutes(now.getMinutes() + snoozeMinutes);
      const timeFormatted = AlarmService.formatTime(now.getHours(), now.getMinutes());
      const verseBody = alarm.customText || 'The Lord is my shepherd; I shall not want.';

      const ringtoneKey =
        alarm.ringtoneId && RINGTONE_SOUND_MAP[alarm.ringtoneId] ? alarm.ringtoneId : 'chimes';
      const ringtoneConf = RINGTONE_SOUND_MAP[ringtoneKey] || RINGTONE_SOUND_MAP.chimes;
      const channelId = Platform.OS === 'android' ? ringtoneConf.channelId : undefined;
      const soundFileName = ringtoneConf.soundFile;

      for (let wave = 0; wave < ALARM_WAVES_COUNT; wave++) {
        const triggerDelay = delaySeconds + wave * WAVE_INTERVAL_SECONDS;
        await Notifications.scheduleNotificationAsync({
          identifier: `alarm-wave-snooze-${alarm.id}-${wave}`,
          content: {
            title: `🔔 Snoozed Alarm • ${alarm.label}`,
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
              waveIndex: wave,
            },
            interruptionLevel: 'timeSensitive',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: triggerDelay,
            repeats: false,
            channelId,
          } as any,
        });
      }
    } catch (e) {
      console.warn('Error scheduling snooze alarm:', e);
    }
  },

  /**
   * Dismisses all active alarm notifications and cancels pending alarm wave bursts
   */
  async dismissActiveAlarm(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await SoundService.stopAlarmRingtone();
      await Notifications.dismissAllNotificationsAsync();
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) {
        if (
          n.identifier.startsWith('alarm-wave-') ||
          n.identifier.startsWith('alarm-') ||
          n.identifier.startsWith('test-alarm-')
        ) {
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
      }
      // Re-schedule regular upcoming alarms in background so future days remain armed
      setTimeout(() => {
        this.rescheduleAllAlarms().catch(() => {});
      }, 500);
    } catch (e) {
      console.warn('Error dismissing active alarms:', e);
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
