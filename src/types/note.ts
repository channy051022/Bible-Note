export interface Note {
  id: number;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface NoteTag {
  note_id: number;
  tag: string;
}

export interface NoteSearchMatch {
  id: number;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  snippet?: string;
}
