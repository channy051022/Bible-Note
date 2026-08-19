import * as SQLite from 'expo-sqlite';
import { type SQLiteDatabase } from 'expo-sqlite';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as FileSystemRoot from 'expo-file-system';

const FileSystem: any = (FileSystemLegacy && FileSystemLegacy.documentDirectory)
  ? FileSystemLegacy
  : FileSystemRoot;

const STORAGE_FILE_NAME = 'app_persistent_storage.json';
const fallbackMap = new Map<string, string>();
let syncDbInstance: SQLiteDatabase | null = null;

// Universal Storage Interface
interface KeyValueStorage {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
}

let nativeMMKVInstance: KeyValueStorage | null = null;
try {
  const { MMKV } = require('react-native-mmkv');
  nativeMMKVInstance = new MMKV({ id: 'bible-notes-storage' });
} catch {
  nativeMMKVInstance = null;
}

/**
 * Synchronous initialization from SQLite database immediately on module import.
 * This guarantees zero race-conditions and immediate data availability for initial React useState!
 */
try {
  syncDbInstance = SQLite.openDatabaseSync('bible.db');
  syncDbInstance.execSync(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  const rows = syncDbInstance.getAllSync<{ key: string; value: string }>('SELECT key, value FROM kv_store;');
  if (rows && Array.isArray(rows)) {
    for (const r of rows) {
      fallbackMap.set(r.key, r.value);
      if (nativeMMKVInstance) {
        try {
          nativeMMKVInstance.set(r.key, r.value);
        } catch {}
      }
    }
  }
} catch (e) {
  // Graceful fallback on web or before database creation
  console.log('Synchronous SQLite storage initial pass (fallback active):', e);
}

/**
 * Persists the in-memory fallbackMap to a JSON file on disk asynchronously as a secondary safety net
 */
async function persistFallbackToFile(): Promise<void> {
  try {
    const docDir = FileSystem.documentDirectory || (FileSystem as any).Paths?.document?.uri || '';
    if (!docDir) return;
    const filePath = `${docDir}${STORAGE_FILE_NAME}`;
    const obj: Record<string, string> = {};
    fallbackMap.forEach((val, key) => {
      obj[key] = val;
    });
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(obj));
  } catch (err) {
    // Non-blocking background persistence
  }
}

/**
 * Loads persistent storage from file system on startup
 */
export async function initStorageFromDisk(): Promise<void> {
  try {
    const docDir = FileSystem.documentDirectory || (FileSystem as any).Paths?.document?.uri || '';
    if (!docDir) return;
    const filePath = `${docDir}${STORAGE_FILE_NAME}`;

    if (typeof FileSystem.getInfoAsync === 'function') {
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(filePath);
        if (content) {
          const parsed = JSON.parse(content);
          Object.keys(parsed).forEach((k) => {
            if (!fallbackMap.has(k)) {
              fallbackMap.set(k, parsed[k]);
              if (syncDbInstance) {
                try {
                  syncDbInstance.runSync('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?);', [k, parsed[k]]);
                } catch {}
              }
            }
          });
        }
      }
    }
  } catch (e) {
    console.warn('Error reading persistent storage from disk:', e);
  }
}

/**
 * Registers SQLite database and synchronizes all kv_store items into in-memory storage
 */
export async function initStorageFromDatabase(db: SQLiteDatabase): Promise<void> {
  syncDbInstance = db;
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM kv_store;');
    if (rows && Array.isArray(rows)) {
      for (const row of rows) {
        fallbackMap.set(row.key, row.value);
        if (nativeMMKVInstance) {
          try {
            nativeMMKVInstance.set(row.key, row.value);
          } catch {}
        }
      }
    }

    // Sync any existing items in fallbackMap back into SQLite
    fallbackMap.forEach((val, key) => {
      db.runAsync('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?);', [key, val]).catch(() => {});
    });
  } catch (e) {
    console.warn('Error initializing storage from SQLite:', e);
  }
}

// Automatically trigger disk load
initStorageFromDisk().catch(() => {});

export const storage: KeyValueStorage = {
  getString: (key: string): string | undefined => {
    // 1. Direct in-memory cache (ultra fast)
    if (fallbackMap.has(key)) {
      return fallbackMap.get(key);
    }
    // 2. Native MMKV if available
    if (nativeMMKVInstance) {
      try {
        const val = nativeMMKVInstance.getString(key);
        if (val !== undefined && val !== null) {
          fallbackMap.set(key, val);
          return val;
        }
      } catch {}
    }
    // 3. Direct synchronous SQLite query
    if (syncDbInstance) {
      try {
        const row = syncDbInstance.getFirstSync<{ value: string }>('SELECT value FROM kv_store WHERE key = ?;', [key]);
        if (row && row.value) {
          fallbackMap.set(key, row.value);
          return row.value;
        }
      } catch {}
    }
    return undefined;
  },
  set: (key: string, value: string): void => {
    fallbackMap.set(key, value);
    if (nativeMMKVInstance) {
      try {
        nativeMMKVInstance.set(key, value);
      } catch {}
    }
    if (syncDbInstance) {
      try {
        syncDbInstance.runSync('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?);', [key, value]);
      } catch (dbErr) {
        console.warn('Error saving to SQLite kv_store:', dbErr);
      }
    }
    persistFallbackToFile().catch(() => {});
  },
  delete: (key: string): void => {
    fallbackMap.delete(key);
    if (nativeMMKVInstance) {
      try {
        nativeMMKVInstance.delete(key);
      } catch {}
    }
    if (syncDbInstance) {
      try {
        syncDbInstance.runSync('DELETE FROM kv_store WHERE key = ?;', [key]);
      } catch (dbErr) {
        console.warn('Error deleting from SQLite kv_store:', dbErr);
      }
    }
    persistFallbackToFile().catch(() => {});
  },
};

export const StorageKeys = {
  THEME_MODE: 'theme_mode', // 'system' | 'light' | 'dark'
  FONT_SIZE: 'reader_font_size', // number
  LAST_READ_BOOK: 'last_read_book_id', // number
  LAST_READ_CHAPTER: 'last_read_chapter', // number
  ACTIVE_PLAN_ID: 'active_plan_id', // string
  BIBLE_VERSION: 'bible_version', // 'KJV' | 'CEB'
  DAILY_PRAYER: 'custom_daily_prayer', // DailyPrayer
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
