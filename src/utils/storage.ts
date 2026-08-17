// Universal Storage Interface for Expo Go & Bare/EAS workflows
interface KeyValueStorage {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
}

// In-Memory fallback storage for Expo Go environment
const fallbackMap = new Map<string, string>();
const fallbackStorage: KeyValueStorage = {
  getString: (key: string) => fallbackMap.get(key),
  set: (key: string, value: string) => {
    fallbackMap.set(key, value);
  },
  delete: (key: string) => {
    fallbackMap.delete(key);
  },
};

let storageInstance: KeyValueStorage;

try {
  const { MMKV } = require('react-native-mmkv');
  storageInstance = new MMKV({ id: 'bible-notes-storage' });
} catch {
  // Gracefully fallback when running inside Expo Go
  storageInstance = fallbackStorage;
}

export const storage = storageInstance;

export const StorageKeys = {
  THEME_MODE: 'theme_mode', // 'system' | 'light' | 'dark'
  FONT_SIZE: 'reader_font_size', // number
  LAST_READ_BOOK: 'last_read_book_id', // number
  LAST_READ_CHAPTER: 'last_read_chapter', // number
  ACTIVE_PLAN_ID: 'active_plan_id', // string
} as const;

export const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const value = storage.getString(key);
    if (value === undefined || value === null) return defaultValue;
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

export const setItem = <T>(key: string, value: T): void => {
  try {
    storage.set(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Storage notice on key ${key}:`, e);
  }
};

export const deleteItem = (key: string): void => {
  try {
    storage.delete(key);
  } catch (e) {
    console.warn(`Storage delete notice on key ${key}:`, e);
  }
};
