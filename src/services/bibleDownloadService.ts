import { type SQLiteDatabase } from 'expo-sqlite';
import { BibleVersionMeta } from '../types/bible';
import { getBookById, getBookByAlias } from '../constants/BibleBooks';
import { getItem, setItem, StorageKeys } from '../utils/storage';
import { PREBUNDLED_BIBLE_VERSIONS } from '../constants/BibleVersions';

interface RawVerseItem {
  pk?: number;
  translation?: string;
  book: number | string;
  chapter: number | string;
  verse: number | string;
  text: string;
}

export const BibleDownloadService = {
  /**
   * Retrieves array of version IDs that are ready offline.
   * KJV and CEB are always available (pre-bundled).
   */
  getDownloadedVersionIds(): string[] {
    const prebundledIds = PREBUNDLED_BIBLE_VERSIONS.map((v) => v.id.toUpperCase());
    const downloaded = getItem<string[]>(StorageKeys.DOWNLOADED_VERSIONS, []);
    const unique = new Set<string>([...prebundledIds, ...downloaded.map((id) => id.toUpperCase())]);
    return Array.from(unique);
  },

  /**
   * Checks if a version is downloaded and ready offline.
   */
  isVersionDownloaded(versionId: string): boolean {
    if (!versionId) return false;
    const normalized = versionId.toUpperCase();
    if (normalized === 'KJV' || normalized === 'CEB') return true;
    const downloaded = getItem<string[]>(StorageKeys.DOWNLOADED_VERSIONS, []);
    return downloaded.some((id) => id.toUpperCase() === normalized);
  },

  /**
   * Checks if the SQLite table for a version exists and has rows.
   */
  async checkDatabaseVersionExists(db: SQLiteDatabase, versionId: string): Promise<boolean> {
    const normalized = versionId.toUpperCase();
    if (normalized === 'KJV') return true;
    const tableName = normalized === 'CEB' ? 'bible_ceb' : `bible_${versionId.toLowerCase()}`;
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
        [tableName]
      );
      if (!result || result.count === 0) return false;

      const verseCheck = await db.getFirstAsync<{ cnt: number }>(
        `SELECT count(*) as cnt FROM ${tableName}`
      );
      return (verseCheck?.cnt || 0) > 0;
    } catch {
      return false;
    }
  },

  /**
   * Downloads a Bible translation from the online CDN, parses its verses,
   * creates an indexed SQLite table, and registers it as ready offline.
   */
  async downloadBibleVersion(
    db: SQLiteDatabase,
    versionMeta: BibleVersionMeta,
    onProgress?: (progress: number, statusText: string) => void
  ): Promise<boolean> {
    const versionId = versionMeta.id.toUpperCase();
    const tableName = `bible_${versionId.toLowerCase()}`;
    const url = versionMeta.sourceUrl || `https://bolls.life/static/translations/${versionId}.json`;

    try {
      onProgress?.(0.05, 'Connecting to Scripture repository...');

      // 1. Fetch JSON data from public domain CDN
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status} (${response.statusText})`);
      }

      onProgress?.(0.35, 'Downloading full Scripture database...');
      const jsonData: any = await response.json();

      let rawVerses: RawVerseItem[] = [];
      if (Array.isArray(jsonData)) {
        rawVerses = jsonData;
      } else if (jsonData && Array.isArray(jsonData.books)) {
        // Handle GetBible v2 format (e.g. Tagalog / Ang Dating Biblia)
        for (const b of jsonData.books) {
          const bookNr = typeof b.nr === 'number' ? b.nr : parseInt(b.nr, 10);
          const bookKey = !isNaN(bookNr) ? bookNr : b.name;
          if (Array.isArray(b.chapters)) {
            for (const c of b.chapters) {
              const chapterNr = typeof c.chapter === 'number' ? c.chapter : parseInt(c.chapter, 10) || 1;
              if (Array.isArray(c.verses)) {
                for (const v of c.verses) {
                  const verseNr = typeof v.verse === 'number' ? v.verse : parseInt(v.verse, 10) || 1;
                  rawVerses.push({
                    book: bookKey,
                    chapter: chapterNr,
                    verse: verseNr,
                    text: v.text || '',
                  });
                }
              }
            }
          }
        }
      }

      if (!Array.isArray(rawVerses) || rawVerses.length === 0) {
        throw new Error('Downloaded data is empty or invalid format.');
      }

      onProgress?.(0.55, `Preparing database for ${rawVerses.length.toLocaleString()} verses...`);

      // 2. Prepare SQLite table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          book TEXT NOT NULL,
          chapter INTEGER NOT NULL,
          verse INTEGER NOT NULL,
          content TEXT NOT NULL
        );
        DELETE FROM ${tableName};
      `);

      // 3. Batch insert verses into SQLite table
      const batchSize = 250;
      const totalVerses = rawVerses.length;
      let insertedCount = 0;

      for (let i = 0; i < totalVerses; i += batchSize) {
        const chunk = rawVerses.slice(i, i + batchSize);
        const placeholders: string[] = [];
        const values: (string | number)[] = [];

        for (const item of chunk) {
          let bookAbbrev: string | null = null;
          if (typeof item.book === 'number') {
            const b = getBookById(item.book);
            if (b) bookAbbrev = b.abbreviation;
          } else {
            const bNum = parseInt(item.book, 10);
            if (!isNaN(bNum)) {
              const b = getBookById(bNum);
              if (b) bookAbbrev = b.abbreviation;
            } else {
              const b = getBookByAlias(item.book);
              if (b) bookAbbrev = b.abbreviation;
            }
          }

          // If not canonical 66 books, skip extra apocrypha
          if (!bookAbbrev) continue;

          const chapterNum = typeof item.chapter === 'number' ? item.chapter : parseInt(item.chapter, 10) || 1;
          const verseNum = typeof item.verse === 'number' ? item.verse : parseInt(item.verse, 10) || 1;
          const textClean = (item.text || '').trim();

          placeholders.push('(?, ?, ?, ?)');
          values.push(bookAbbrev, chapterNum, verseNum, textClean);
        }

        if (placeholders.length > 0) {
          const sql = `INSERT INTO ${tableName} (book, chapter, verse, content) VALUES ${placeholders.join(', ')}`;
          await db.runAsync(sql, values);
        }

        insertedCount += chunk.length;
        const progressRatio = 0.55 + (insertedCount / totalVerses) * 0.4;
        onProgress?.(
          progressRatio,
          `Indexing verses (${Math.round((insertedCount / totalVerses) * 100)}%)...`
        );
      }

      // 4. Create optimized index for instant lookup
      onProgress?.(0.98, 'Finalizing search index...');
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_${tableName}_lookup ON ${tableName}(book, chapter, verse);
      `);

      // 5. Save to persistent storage
      const currentDownloaded = getItem<string[]>(StorageKeys.DOWNLOADED_VERSIONS, []);
      if (!currentDownloaded.some((id) => id.toUpperCase() === versionId)) {
        currentDownloaded.push(versionId);
        setItem(StorageKeys.DOWNLOADED_VERSIONS, currentDownloaded);
      }

      onProgress?.(1.0, 'Download complete!');
      return true;
    } catch (err: any) {
      console.error(`Error downloading Bible version ${versionId}:`, err);
      // Clean up partial table on error
      try {
        await db.execAsync(`DROP TABLE IF EXISTS ${tableName}`);
      } catch {}
      throw err;
    }
  },

  /**
   * Deletes a downloaded version from local database and storage to free up space.
   */
  async deleteDownloadedVersion(db: SQLiteDatabase, versionId: string): Promise<boolean> {
    const normalized = versionId.toUpperCase();
    if (normalized === 'KJV' || normalized === 'CEB') {
      return false; // Cannot delete pre-bundled translations
    }

    const tableName = `bible_${normalized.toLowerCase()}`;
    try {
      await db.execAsync(`DROP TABLE IF EXISTS ${tableName};`);

      const currentDownloaded = getItem<string[]>(StorageKeys.DOWNLOADED_VERSIONS, []);
      const updated = currentDownloaded.filter((id) => id.toUpperCase() !== normalized);
      setItem(StorageKeys.DOWNLOADED_VERSIONS, updated);

      // If active version was deleted, fallback to KJV
      const activeVersion = getItem<string>(StorageKeys.BIBLE_VERSION, 'KJV');
      if (activeVersion.toUpperCase() === normalized) {
        setItem(StorageKeys.BIBLE_VERSION, 'KJV');
      }

      return true;
    } catch (e) {
      console.error(`Error deleting downloaded version ${versionId}:`, e);
      return false;
    }
  },
};
