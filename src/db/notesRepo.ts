import { type SQLiteDatabase } from 'expo-sqlite';
import { Note, NoteSearchMatch } from '../types/note';

export const NotesRepo = {
  /**
   * Retrieves all notes with their assigned tags.
   */
  async getAllNotes(db: SQLiteDatabase, tagFilter?: string): Promise<Note[]> {
    let notes: Note[] = [];

    if (tagFilter) {
      notes = await db.getAllAsync<Note>(
        `SELECT DISTINCT n.id, n.title, n.content, n.created_at, n.updated_at
         FROM notes n
         JOIN note_tags nt ON nt.note_id = n.id
         WHERE nt.tag = ?
         ORDER BY n.updated_at DESC`,
        [tagFilter]
      );
    } else {
      notes = await db.getAllAsync<Note>(
        'SELECT id, title, content, created_at, updated_at FROM notes ORDER BY updated_at DESC'
      );
    }

    // Attach tags to notes
    for (const note of notes) {
      const tags = await db.getAllAsync<{ tag: string }>(
        'SELECT tag FROM note_tags WHERE note_id = ? ORDER BY tag ASC',
        [note.id]
      );
      note.tags = tags.map((t) => t.tag);
    }

    return notes;
  },

  /**
   * Retrieves a single note by ID with its tags.
   */
  async getNoteById(db: SQLiteDatabase, noteId: number): Promise<Note | null> {
    const note = await db.getFirstAsync<Note>(
      'SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?',
      [noteId]
    );

    if (!note) return null;

    const tags = await db.getAllAsync<{ tag: string }>(
      'SELECT tag FROM note_tags WHERE note_id = ? ORDER BY tag ASC',
      [note.id]
    );
    note.tags = tags.map((t) => t.tag);

    return note;
  },

  /**
   * Creates a new note with optional tags.
   */
  async createNote(
    db: SQLiteDatabase,
    title: string | null,
    content: string,
    tags: string[] = []
  ): Promise<number> {
    const result = await db.runAsync(
      'INSERT INTO notes (title, content, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [title, content]
    );

    const noteId = result.lastInsertRowId;

    if (tags && tags.length > 0) {
      for (const tag of tags) {
        const cleanTag = tag.trim();
        if (cleanTag) {
          await db.runAsync(
            'INSERT OR IGNORE INTO note_tags (note_id, tag) VALUES (?, ?)',
            [noteId, cleanTag]
          );
        }
      }
    }

    return noteId;
  },

  /**
   * Updates an existing note title, content, and tags.
   */
  async updateNote(
    db: SQLiteDatabase,
    noteId: number,
    title: string | null,
    content: string,
    tags?: string[]
  ): Promise<void> {
    await db.runAsync(
      'UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, noteId]
    );

    if (tags !== undefined) {
      // Replace tags
      await db.runAsync('DELETE FROM note_tags WHERE note_id = ?', [noteId]);
      for (const tag of tags) {
        const cleanTag = tag.trim();
        if (cleanTag) {
          await db.runAsync(
            'INSERT OR IGNORE INTO note_tags (note_id, tag) VALUES (?, ?)',
            [noteId, cleanTag]
          );
        }
      }
    }
  },

  /**
   * Deletes a note. Note tags and FTS triggers handle cascading.
   */
  async deleteNote(db: SQLiteDatabase, noteId: number): Promise<void> {
    await db.runAsync('DELETE FROM notes WHERE id = ?', [noteId]);
  },

  /**
   * Retrieves all distinct tags used across all notes.
   */
  async getAllTags(db: SQLiteDatabase): Promise<{ tag: string; count: number }[]> {
    return await db.getAllAsync<{ tag: string; count: number }>(
      'SELECT tag, COUNT(note_id) as count FROM note_tags GROUP BY tag ORDER BY count DESC, tag ASC'
    );
  },

  /**
   * SQLite FTS5 Full-Text Search across note titles and content.
   */
  async searchNotes(db: SQLiteDatabase, query: string): Promise<NoteSearchMatch[]> {
    const cleanQuery = query.trim().replace(/['"*]/g, '');
    if (!cleanQuery) return [];

    const ftsQuery = `"${cleanQuery}"*`;

    try {
      const results = await db.getAllAsync<NoteSearchMatch>(
        `SELECT n.id, n.title, n.content, n.created_at, n.updated_at,
                snippet(notes_fts, 1, '<b>', '</b>', '...', 15) as snippet
         FROM notes_fts fts
         JOIN notes n ON n.id = fts.rowid
         WHERE notes_fts MATCH ?
         ORDER BY n.updated_at DESC`,
        [ftsQuery]
      );

      for (const note of results) {
        const tags = await db.getAllAsync<{ tag: string }>(
          'SELECT tag FROM note_tags WHERE note_id = ? ORDER BY tag ASC',
          [note.id]
        );
        note.tags = tags.map((t) => t.tag);
      }

      return results;
    } catch (e) {
      console.warn('Notes FTS5 search failed, using LIKE fallback:', e);
      return await db.getAllAsync<NoteSearchMatch>(
        `SELECT id, title, content, created_at, updated_at
         FROM notes
         WHERE title LIKE ? OR content LIKE ?
         ORDER BY updated_at DESC`,
        [`%${cleanQuery}%`, `%${cleanQuery}%`]
      );
    }
  },
};
