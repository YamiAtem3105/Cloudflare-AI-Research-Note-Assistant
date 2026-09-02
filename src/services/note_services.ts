import {
  createTextNote,
  createFileNote,
  getNote,
  listNotes,
  startProcessing,
  saveAnalysis,
  saveFailure,
  resetNote,
} from "../repositories/note.repository";

import {
  uploadFile,
  getFile,
  deleteFile,
} from "./r2.service";

import { analyzeText } from "./ai.service";

import {
  validateTitle,
  validateContent,
  validateFile,
} from "../validators/note.validator";

export async function createText(
  db: D1Database,
  title: unknown,
  content: unknown,
) {
  const titleError = validateTitle(title);
  if (titleError) throw new Error(titleError);

  const contentError = validateContent(content);
  if (contentError) throw new Error(contentError);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await createTextNote(
    db,
    id,
    (title as string).trim(),
    content as string,
    now,
  );

  return {
    id,
    title: (title as string).trim(),
    source_type: "text",
    status: "pending",
  };
}

export async function createFile(
  db: D1Database,
  bucket: R2Bucket,
  title: unknown,
  file: File | null,
) {
  const titleError = validateTitle(title);
  if (titleError) throw new Error(titleError);

  const fileError = validateFile(file);
  if (fileError) throw new Error(fileError);

  if (!file) throw new Error("File is required.");

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const safeName = file.name.replace(
    /[^a-zA-Z0-9._-]/g,
    "_",
  );

  const objectKey = `notes/${id}/${safeName}`;

  await uploadFile(bucket, objectKey, file);

  try {
    await createFileNote(db, {
      id,
      title: (title as string).trim(),
      objectKey,
      name: file.name,
      type: file.type || "text/plain",
      size: file.size,
      now,
    });
  } catch (error) {
    await deleteFile(bucket, objectKey);
    throw error;
  }

  return {
    id,
    title: (title as string).trim(),
    source_type: "file",
    status: "pending",
  };
}

export async function getNotes(
  db: D1Database,
) {
  return listNotes(db);
}

export async function getNoteDetail(
  db: D1Database,
  id: string,
) {
  const note = await getNote(db, id);

  if (!note) return null;

  return {
    ...note,
    tags: note.tags_json
      ? JSON.parse(note.tags_json)
      : [],
  };
}

export async function analyze(
  db: D1Database,
  bucket: R2Bucket,
  ai: Ai,
  id: string,
) {
  const note = await getNote(db, id);

  if (!note) {
    throw new Error("Note not found.");
  }

  const claimed = await startProcessing(db, id);

  if (!claimed) {
    throw new Error(
      "Note is already being processed.",
    );
  }

  try {
    let content: string;

    if (note.source_type === "text") {
      if (!note.content) {
        throw new Error("Note content is missing.");
      }

      content = note.content;
    } else {
      if (!note.object_key) {
        throw new Error("File reference is missing.");
      }

      const object = await getFile(
        bucket,
        note.object_key,
      );

      if (!object) {
        throw new Error(
          "File is missing from R2.",
        );
      }

      content = await object.text();
    }

    const result = await analyzeText(
      ai,
      content,
    );

    await saveAnalysis(
      db,
      id,
      result,
    );

    return result;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Analysis failed.";

    await saveFailure(
      db,
      id,
      message,
    );

    throw error;
  }
}

export async function retry(
  db: D1Database,
  bucket: R2Bucket,
  ai: Ai,
  id: string,
) {
  const note = await getNote(db, id);

  if (!note) {
    throw new Error("Note not found.");
  }

  if (note.status !== "failed") {
    throw new Error(
      "Only failed notes can be retried.",
    );
  }

  await resetNote(db, id);

  return analyze(
    db,
    bucket,
    ai,
    id,
  );
}