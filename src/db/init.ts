import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as FileSystemRoot from 'expo-file-system';
import { Asset } from 'expo-asset';
import { type SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'bible.db';

const FileSystem: any = (FileSystemLegacy && FileSystemLegacy.documentDirectory)
  ? FileSystemLegacy
  : FileSystemRoot;

/**
 * Ensures the pre-bundled SQLite database asset (16.7MB KJV) is extracted and copied
 * to the app's local document directory before expo-sqlite opens it.
 */
export async function copyDatabaseFileIfNotExists(): Promise<void> {
  try {
    const docDir = FileSystem.documentDirectory || (FileSystem as any).Paths?.document?.uri || '';
    if (!docDir) {
      console.warn('Could not determine documentDirectory for SQLite database extraction.');
      return;
    }

    const dbDir = `${docDir}SQLite`;
    const dbPath = `${dbDir}/${DATABASE_NAME}`;

    if (typeof FileSystem.getInfoAsync === 'function') {
      const dirInfo = await FileSystem.getInfoAsync(dbDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      }

      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      // The complete KJV database is ~16.7MB. If the file doesn't exist, or is an empty/old db (<10MB), copy the asset!
      const needsCopy = !fileInfo.exists || !fileInfo.size || fileInfo.size < 10000000;

      if (needsCopy) {
        console.log(`Extracting pre-bundled ${DATABASE_NAME} (16.7MB) to ${dbPath}...`);
        if (fileInfo.exists) {
          try {
            await FileSystem.deleteAsync(dbPath, { idempotent: true });
          } catch (delErr) {
            console.warn('Could not delete old db file before copy:', delErr);
          }
        }

        const asset = Asset.fromModule(require('../../assets/bible.db'));
        await asset.downloadAsync();

        const sourceUri = asset.localUri || asset.uri;
        if (sourceUri) {
          await FileSystem.copyAsync({
            from: sourceUri,
            to: dbPath,
          });
          console.log('Successfully extracted complete 16.7MB KJV bible.db.');
        } else {
          console.warn('Asset downloadAsync did not return localUri or uri.');
        }
      }
    }
  } catch (error) {
    console.error('Error during database file initialization:', error);
  }
}

/**
 * Initializes and migrates all required SQLite tables and FTS5 search indexes.
 * Passed directly into <SQLiteProvider onInit={initializeDatabase}>.
 */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  try {
    // Enable Foreign Keys and WAL Mode for high performance
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);

    // Ensure notes, bookmarks, note_tags, and reading_progress exist
    await db.execAsync(`
      -- 1. Notes Table
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Note Tags Table
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id INTEGER,
        tag TEXT NOT NULL,
        PRIMARY KEY (note_id, tag),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      );

      -- 3. Bookmarks Table
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        label TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. Reading Plan Progress Table
      CREATE TABLE IF NOT EXISTS reading_progress (
        plan_id TEXT NOT NULL,
        day INTEGER NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (plan_id, day)
      );

      -- Fast Indexes
      CREATE INDEX IF NOT EXISTS idx_bookmarks_lookup ON bookmarks(book_id, chapter, verse);
      CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag);
    `);

    // Ensure notes_fts exists
    try {
      await db.execAsync(`
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
          title,
          content,
          content='notes',
          content_rowid='id'
        );
      `);

      await db.execAsync(`
        CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
          INSERT INTO notes_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
        END;
        CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
          INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
        END;
        CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
          INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
          INSERT INTO notes_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
        END;
      `);
    } catch (ftsErr) {
      console.warn('Note FTS initialization note:', ftsErr);
    }

    console.log('SQLite database ready for E-Bible reading and notes.');
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
    throw error;
  }
}
