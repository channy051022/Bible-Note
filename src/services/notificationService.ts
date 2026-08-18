import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getTodayVerseRef } from '../constants/VerseOfTheDay';
import { BIBLE_BOOKS } from '../constants/BibleBooks';

// Configure notification behavior for phone lock screen & home screen
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  /**
   * Requests permission and automatically registers the daily lock screen verse notification.
   */
  async setupDailyLockscreenVerse(hour: number = 8, minute: number = 0): Promise<boolean> {
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

      // 2. Clear old daily verse schedules
      await Notifications.cancelAllScheduledNotificationsAsync();

      // 3. Compute today's verse citation
      const ref = getTodayVerseRef();
      const book = BIBLE_BOOKS.find((b) => b.id === ref.bookId);
      const citation = `${book?.name || 'Scripture'} ${ref.chapter}:${ref.verse}`;

      // 4. Schedule recurring daily notification for phone lockscreen at 8:00 AM
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `✨ Verse of the Day • ${citation}`,
          body: `May your heart be refreshed by God's Word today. Tap to read ${citation}.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { bookId: ref.bookId, chapter: ref.chapter, verse: ref.verse },
        },
        trigger: {
          hour,
          minute,
          repeats: true,
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
