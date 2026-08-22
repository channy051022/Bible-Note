import { Platform, NativeModules } from 'react-native';
import { getTodayVerseRef } from '../constants/VerseOfTheDay';
import { BIBLE_BOOKS } from '../constants/BibleBooks';
import { setItem, getItem, StorageKeys } from '../utils/storage';

export const WidgetBridgeService = {
  /**
   * Syncs the latest Verse of the Day or Custom Verse & Theme to shared native widget storage (iOS AppGroup & Android SharedPreferences)
   */
  async syncVerseToNativeWidget(
    citation: string,
    text: string,
    version: string = 'KJV',
    bookId: number = 43,
    chapter: number = 3,
    theme: string = 'glass'
  ) {
    try {
      // 1. Store in local app storage
      setItem('WIDGET_VERSE_CITATION', citation);
      setItem('WIDGET_VERSE_TEXT', text);
      setItem('WIDGET_VERSE_VERSION', version);
      setItem('WIDGET_THEME', theme);

      // 2. Call Native iOS WidgetBridge module to write directly to shared UserDefaults
      if (Platform.OS === 'ios') {
        if (NativeModules.WidgetBridge?.setWidgetData) {
          await NativeModules.WidgetBridge.setWidgetData(
            citation,
            text,
            version,
            theme,
            bookId,
            chapter
          );
        } else if (NativeModules.SharedGroupPreferences) {
          await NativeModules.SharedGroupPreferences.setItem('widget_verse_citation', citation, 'group.com.biblenotes.app');
          await NativeModules.SharedGroupPreferences.setItem('widget_verse_text', text, 'group.com.biblenotes.app');
          await NativeModules.SharedGroupPreferences.setItem('widget_verse_version', version, 'group.com.biblenotes.app');
          await NativeModules.SharedGroupPreferences.setItem('widget_theme', theme, 'group.com.biblenotes.app');
        }
      }

      console.log(`Native Widget Data Synced: ${citation} (Theme: ${theme})`);
    } catch (err) {
      console.warn('Widget data sync warning:', err);
    }
  },
};
