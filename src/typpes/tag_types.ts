export type NoteStatus =
  | "pending"
  | "processing"
  | "done"
  | "failed";

export type NoteSource = "text" | "file";

export interface Note {
  id: string;
  title: string;
  source_type: NoteSource;
  content: string | null;
  object_key: string | null;
  original_name: string | null;
  content_type: string | null;
  size: number | null;
  status: NoteStatus;
  summary: string | null;
  category: string | null;
  tags_json: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}