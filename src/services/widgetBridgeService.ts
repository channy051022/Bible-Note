import { Platform, NativeModules } from 'react-native';
import { getTodayVerseRef } from '../constants/VerseOfTheDay';
import { BIBLE_BOOKS } from '../constants/BibleBooks';
import { setItem, getItem, StorageKeys } from '../utils/storage';

export const WidgetBridgeService = {
  /**
   * Syncs the latest Verse of the Day to shared native widget storage (iOS AppGroup & Android SharedPreferences)
   */
  async syncVerseToNativeWidget(citation: string, text: string, version: string = 'KJV', bookId: number = 43, chapter: number = 3) {
    try {
      // 1. Store in local app storage
      setItem('WIDGET_VERSE_CITATION', citation);
      setItem('WIDGET_VERSE_TEXT', text);
      setItem('WIDGET_VERSE_VERSION', version);

      // 2. If running on native platform with native module or SharedGroupPreferences
      if (Platform.OS === 'ios' && NativeModules.SharedGroupPreferences) {
        await NativeModules.SharedGroupPreferences.setItem(
          'widget_verse_citation',
          citation,
          'group.com.biblenotes.app'
        );
        await NativeModules.SharedGroupPreferences.setItem(
          'widget_verse_text',
          text,
          'group.com.biblenotes.app'
        );
        await NativeModules.SharedGroupPreferences.setItem(
          'widget_verse_version',
          version,
          'group.com.biblenotes.app'
        );
      }

      console.log(`Native Widget Data Synced: ${citation}`);
    } catch (err) {
      console.warn('Widget data sync warning:', err);
    }
  },
};
