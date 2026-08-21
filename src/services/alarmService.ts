import * as Notifications from 'expo-notifications';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as FileSystemRoot from 'expo-file-system';
import { Platform } from 'react-native';

const FileSystem: any = (FileSystemLegacy && FileSystemLegacy.documentDirectory)
  ? FileSystemLegacy
  : FileSystemRoot;
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
  classic_bell: {
    soundFile: 'classic_phone_bell.wav',
    channelId: 'spiritual_alarm_classic_bell_v5',
    channelName: 'Spiritual Alarms (Classic Phone Bell)',
  },
  digital_alarm: {
    soundFile: 'digital_alarm_beeps.wav',
    channelId: 'spiritual_alarm_digital_v5',
    channelName: 'Spiritual Alarms (Digital Clock Beeps)',
  },
  marimba: {
    soundFile: 'modern_marimba.wav',
    channelId: 'spiritual_alarm_marimba_v5',
    channelName: 'Spiritual Alarms (Modern Marimba)',
  },
  chimes: {
    soundFile: 'spiritual_chimes.wav',
    channelId: 'spiritual_alarm_chimes_v5',
    channelName: 'Spiritual Alarms (Wake Chimes)',
  },
  sunrise_bell: {
    soundFile: 'radiant_sunrise_bell.wav',
    channelId: 'spiritual_alarm_sunrise_v5',
    channelName: 'Spiritual Alarms (Sunrise Bells)',
  },
  fanfare: {
    soundFile: 'gospel_fanfare.wav',
    channelId: 'spiritual_alarm_fanfare_v5',
    channelName: 'Spiritual Alarms (Joyful Fanfare)',
  },
  cathedral: {
    soundFile: 'cathedral_bells.wav',
    channelId: 'spiritual_alarm_cathedral_v5',
    channelName: 'Spiritual Alarms (Cathedral Bells)',
  },
  harp: {
    soundFile: 'morning_harp.wav',
    channelId: 'spiritual_alarm_harp_v5',
    channelName: 'Spiritual Alarms (Morning Harp)',
  },
  piano: {
    soundFile: 'peaceful_piano.wav',
    channelId: 'spiritual_alarm_piano_v5',
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

        // Clean up any old channels from previous versions
        try {
          const existingChannels = await Notifications.getNotificationChannelsAsync();
          for (const ch of existingChannels) {
            if (
              ch.id.startsWith('spiritual_alarm_') &&
              !ch.id.endsWith('_v5')
            ) {
              await Notifications.deleteNotificationChannelAsync(ch.id).catch(() => {});
            }
          }
        } catch {}

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
        await Notifications.setNotificationChannelAsync('daily_verse_channel_v5', {
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
   * Prepares and resolves custom sound file for native lock screen playback
   */
  async resolveNotificationSound(alarm: SpiritualAlarm, fallbackSound: string): Promise<string> {
    if (alarm.ringtoneId !== 'custom' || !alarm.customAudioUri) {
      return fallbackSound;
    }

    try {
      if (Platform.OS === 'ios' && FileSystem.documentDirectory) {
        const soundsDir = `${FileSystem.documentDirectory}../Library/Sounds/`;
        const dirInfo = await FileSystem.getInfoAsync(soundsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(soundsDir, { intermediates: true });
        }

        const originalExt = alarm.customAudioUri.split('.').pop()?.toLowerCase() || 'wav';
        const safeExt = ['wav', 'm4a', 'caf', 'aiff', 'mp3', 'aac'].includes(originalExt)
          ? originalExt
          : 'wav';
        const customSoundName = `custom_alarm_${alarm.id.replace(/[^a-zA-Z0-9]/g, '_')}.${safeExt}`;
        const destinationUri = `${soundsDir}${customSoundName}`;

        const fileInfo = await FileSystem.getInfoAsync(destinationUri);
        if (!fileInfo.exists) {
          await FileSystem.copyAsync({
            from: alarm.customAudioUri,
            to: destinationUri,
          }).catch(() => {});
        }
        return customSoundName;
      }
    } catch (err) {
      console.warn('Could not resolve custom audio in Library/Sounds:', err);
    }

    return fallbackSound;
  },

  /**
   * Calculates the exact upcoming Date for a given weekday (0=Sun..6=Sat) and time (hour, minute)
   */
  getNextOccurrenceDate(dayOfWeek: number, hour: number, minute: number, baseDate: Date = new Date()): Date {
    const currentDay = baseDate.getDay();
    let daysUntil = (dayOfWeek - currentDay + 7) % 7;

    const target = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + daysUntil,
      hour,
      minute,
      0,
      0
    );

    // If target is today but the scheduled minute has already passed, schedule for next week
    if (daysUntil === 0 && target.getTime() <= baseDate.getTime()) {
      target.setDate(target.getDate() + 7);
    }

    return target;
  },

  /**
   * Calculates all upcoming occurrence Dates for an alarm across its repeat days over the next `daysInAdvance` days (default 14 days)
   */
  getAllUpcomingOccurrences(alarm: SpiritualAlarm, daysInAdvance: number = 14): Date[] {
    const days =
      alarm.days && alarm.days.length > 0 ? alarm.days : [0, 1, 2, 3, 4, 5, 6];
    const now = new Date();
    const occurrences: Date[] = [];

    for (let offset = 0; offset < daysInAdvance; offset++) {
      const checkDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + offset,
        alarm.hour,
        alarm.minute,
        0,
        0
      );
      const dayOfWeek = checkDate.getDay();
      if (days.includes(dayOfWeek)) {
        // Must be in the future (at least 2 seconds ahead of current time)
        if (checkDate.getTime() > now.getTime() + 2000) {
          occurrences.push(checkDate);
        }
      }
    }
    return occurrences.sort((a, b) => a.getTime() - b.getTime());
  },

  /**
   * Calculates the earliest upcoming occurrence Date across all active days of an alarm
   */
  getNextUpcomingOccurrence(alarm: SpiritualAlarm): Date {
    const occurrences = this.getAllUpcomingOccurrences(alarm, 8);
    if (occurrences.length > 0) {
      return occurrences[0];
    }
    const days =
      alarm.days && alarm.days.length > 0 ? alarm.days : [0, 1, 2, 3, 4, 5, 6];
    const candidateDates = days.map((d) =>
      this.getNextOccurrenceDate(d, alarm.hour, alarm.minute)
    );
    candidateDates.sort((a, b) => a.getTime() - b.getTime());
    return candidateDates[0];
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
   * Loops sequentially based on the exact trimmed duration of the selected song / ringtone so audio NEVER overlaps
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
            channelId: Platform.OS === 'android' ? 'daily_verse_channel_v5' : undefined,
          } as any,
        });
      } catch (dailyErr) {
        console.warn('Error rescheduling daily verse along with alarms:', dailyErr);
      }

      // 5. Schedule sequential waves timed precisely to song length and cut point for all upcoming days
      for (const alarm of alarms) {
        if (!alarm.isEnabled) continue;

        const ref = getTodayVerseRef();
        const book = BIBLE_BOOKS.find((b) => b.id === (alarm.bookId || ref.bookId));
        const citation =
          alarm.customCitation || `${book?.name || 'Scripture'} ${ref.chapter}:${ref.verse}`;
        const timeFormatted = AlarmService.formatTime(alarm.hour, alarm.minute);
        const verseBody = alarm.customText || 'The Lord is my shepherd; I shall not want.';

        const ringtoneKey =
          alarm.ringtoneId && RINGTONE_SOUND_MAP[alarm.ringtoneId] ? alarm.ringtoneId : 'classic_bell';
        const ringtoneConf = RINGTONE_SOUND_MAP[ringtoneKey] || RINGTONE_SOUND_MAP.classic_bell;
        const channelId = Platform.OS === 'android' ? ringtoneConf.channelId : undefined;
        const soundFileName = await this.resolveNotificationSound(alarm, ringtoneConf.soundFile);

        // Determine effective wave interval based on trimmed song length (total - startOffset)
        const startOffset = alarm.customAudioStartOffset || 0;
        const rawDuration = alarm.customAudioDuration || 30;
        const effectiveDuration =
          alarm.customAudioDuration && alarm.customAudioDuration > startOffset + 5
            ? Math.ceil(rawDuration - startOffset)
            : 30;
        const waveInterval = Math.max(15, effectiveDuration);
        const waveCount = Math.min(5, Math.max(3, Math.ceil(180 / waveInterval)));

        // A. Multi-Day Advance Scheduled Dates (Guarantees next 14 days of exact alarms trigger even when app is closed)
        const upcomingDates = this.getAllUpcomingOccurrences(alarm, 14);
        for (const occurrenceDate of upcomingDates) {
          const dateKey = `${occurrenceDate.getFullYear()}${(occurrenceDate.getMonth() + 1).toString().padStart(2, '0')}${occurrenceDate.getDate().toString().padStart(2, '0')}`;

          for (let wave = 0; wave < waveCount; wave++) {
            const waveTimestamp = new Date(
              occurrenceDate.getTime() + wave * waveInterval * 1000
            );

            await Notifications.scheduleNotificationAsync({
              identifier: `alarm-wave-${alarm.id}-${dateKey}-w${wave}`,
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
                  customAudioDuration: alarm.customAudioDuration,
                  customAudioStartOffset: alarm.customAudioStartOffset || 0,
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

        // B. Native Recurring Triggers (Permanent recurring schedules maintained by OS indefinitely)
        const days = alarm.days && alarm.days.length > 0 ? alarm.days : [0, 1, 2, 3, 4, 5, 6];
        if (days.length === 7) {
          await Notifications.scheduleNotificationAsync({
            identifier: `alarm-recurring-daily-${alarm.id}`,
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
              },
              interruptionLevel: 'timeSensitive',
            },
            trigger: Platform.OS === 'ios'
              ? {
                  type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                  hour: alarm.hour,
                  minute: alarm.minute,
                  repeats: true,
                } as any
              : {
                  type: Notifications.SchedulableTriggerInputTypes.DAILY,
                  hour: alarm.hour,
                  minute: alarm.minute,
                  channelId,
                } as any,
          });
        } else {
          for (const day of days) {
            const weekdayOneIndexed = day + 1;
            await Notifications.scheduleNotificationAsync({
              identifier: `alarm-recurring-weekly-${alarm.id}-d${day}`,
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
                },
                interruptionLevel: 'timeSensitive',
              },
              trigger: Platform.OS === 'ios'
                ? {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    weekday: weekdayOneIndexed,
                    hour: alarm.hour,
                    minute: alarm.minute,
                    repeats: true,
                  } as any
                : {
                    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                    weekday: weekdayOneIndexed,
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
   * Schedules a delayed test alarm timed precisely to the song length and cut point to test wake-up behavior
   */
  async scheduleTestAlarm(seconds: number = 5, alarm: SpiritualAlarm): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await this.requestNotificationPermissions();
      await this.initNotificationChannels();
      await SoundService.stopAlarmRingtone();
      await SoundService.stopPreview();
      await Notifications.dismissAllNotificationsAsync();

      // Cancel any prior test alarm waves so they do not conflict
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) {
        if (n.identifier.startsWith('alarm-wave-test-')) {
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
      }

      const ref = getTodayVerseRef();
      const book = BIBLE_BOOKS.find((b) => b.id === (alarm.bookId || ref.bookId));
      const citation =
        alarm.customCitation || `${book?.name || 'Scripture'} ${ref.chapter}:${ref.verse}`;
      const timeFormatted = AlarmService.formatTime(alarm.hour, alarm.minute);
      const verseBody = alarm.customText || 'The Lord is my shepherd; I shall not want.';

      const ringtoneKey =
        alarm.ringtoneId && RINGTONE_SOUND_MAP[alarm.ringtoneId] ? alarm.ringtoneId : 'classic_bell';
      const ringtoneConf = RINGTONE_SOUND_MAP[ringtoneKey] || RINGTONE_SOUND_MAP.classic_bell;
      const channelId = Platform.OS === 'android' ? ringtoneConf.channelId : undefined;
      const soundFileName = await this.resolveNotificationSound(alarm, ringtoneConf.soundFile);

      const startOffset = alarm.customAudioStartOffset || 0;
      const rawDuration = alarm.customAudioDuration || 30;
      const effectiveDuration =
        alarm.customAudioDuration && alarm.customAudioDuration > startOffset + 5
          ? Math.ceil(rawDuration - startOffset)
          : 30;
      const waveInterval = Math.max(15, effectiveDuration);
      const waveCount = Math.min(5, Math.max(3, Math.ceil(180 / waveInterval)));

      // Schedule sequential waves spaced precisely according to song duration
      for (let wave = 0; wave < waveCount; wave++) {
        const triggerDelay = Math.max(1, seconds + wave * waveInterval);
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
              customAudioDuration: alarm.customAudioDuration,
              customAudioStartOffset: alarm.customAudioStartOffset || 0,
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
   * Snoozes an alarm for a given number of minutes (default 5 minutes)
   */
  async snoozeAlarm(
    alarm: {
      id: string;
      label: string;
      ringtoneId?: string;
      customAudioUri?: string;
      customAudioDuration?: number;
      customAudioStartOffset?: number;
      customText?: string;
      customCitation?: string;
      bookId?: number;
      chapter?: number;
    },
    snoozeMinutes: number = 5
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await SoundService.stopAlarmRingtone();
      await Notifications.dismissAllNotificationsAsync();
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
        alarm.ringtoneId && RINGTONE_SOUND_MAP[alarm.ringtoneId] ? alarm.ringtoneId : 'classic_bell';
      const ringtoneConf = RINGTONE_SOUND_MAP[ringtoneKey] || RINGTONE_SOUND_MAP.classic_bell;
      const channelId = Platform.OS === 'android' ? ringtoneConf.channelId : undefined;
      const soundFileName = ringtoneConf.soundFile;

      const startOffset = alarm.customAudioStartOffset || 0;
      const rawDuration = alarm.customAudioDuration || 30;
      const effectiveDuration =
        alarm.customAudioDuration && alarm.customAudioDuration > startOffset + 5
          ? Math.ceil(rawDuration - startOffset)
          : 30;
      const waveInterval = Math.max(15, effectiveDuration);
      const waveCount = Math.min(5, Math.max(3, Math.ceil(180 / waveInterval)));

      for (let wave = 0; wave < waveCount; wave++) {
        const triggerDelay = delaySeconds + wave * waveInterval;
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
              customAudioDuration: alarm.customAudioDuration,
              customAudioStartOffset: alarm.customAudioStartOffset || 0,
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
   * Dismisses all active alarm notifications and cancels pending alarm waves
   */
  async dismissActiveAlarm(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await SoundService.stopAlarmRingtone();
      await Notifications.dismissAllNotificationsAsync();
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) {
        if (
          n.identifier.startsWith('alarm-wave-test-') ||
          n.identifier.startsWith('alarm-wave-snooze-')
        ) {
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
      }
      // Re-schedule regular upcoming alarms to guarantee future days remain armed
      await this.rescheduleAllAlarms();
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
