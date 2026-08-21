import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getTodayVerseRef } from '../constants/VerseOfTheDay';
import { BIBLE_BOOKS } from '../constants/BibleBooks';


export const NotificationService = {
  /**
   * Requests permission and automatically registers the daily lock screen verse notification.
   */
  async setupDailyLockscreenVerse(hour: number = 6, minute: number = 0): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;

      // 1. Request permissions
      const settings: any = await Notifications.getPermissionsAsync();
      let isGranted = !!(settings.granted || settings.status === 'granted');
      if (!isGranted) {
        const req: any = await Notifications.requestPermissionsAsync();
        isGranted = !!(req.granted || req.status === 'granted');
      }

      if (!isGranted) {
        console.log('Notification permission not granted for daily lockscreen verse.');
        return false;
      }

      // 2. Setup Android daily verse channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily_verse_channel', {
          name: 'Daily Verse of the Day',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
          enableLights: false,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      // 3. Compute today's verse citation
      const ref = getTodayVerseRef();
      const book = BIBLE_BOOKS.find((b) => b.id === ref.bookId);
      const citation = `${book?.name || 'Scripture'} ${ref.chapter}:${ref.verse}`;

      // 4. Schedule or replace recurring daily notification for phone lockscreen at 6:00 AM
      await Notifications.scheduleNotificationAsync({
        identifier: 'daily-verse-of-day-notification',
        content: {
          title: `✨ Verse of the Day • ${citation}`,
          body: `May your heart be refreshed by God's Word today. Tap to read ${citation}.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          data: { bookId: ref.bookId, chapter: ref.chapter, verse: ref.verse },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        } as any,
      });

      console.log(`Automated Daily Lockscreen Verse successfully scheduled for ${hour}:${minute.toString().padStart(2, '0')} AM!`);
      return true;
    } catch (error) {
      console.warn('Error setting up daily lockscreen verse notification:', error);
      return false;
    }
  },
};
