import { insertTextNote,
         insertFileNote,
 } from "../repositories/note_repo";

// Xử lý logic tạo note bằng text
export async function createTextNote(
  db: D1Database,
  title: unknown,
  content: unknown,
) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("Title is required.");
  }

  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("Content is required.");
  }

  if (content.length > 20_000) {
    throw new Error("Content must not exceed 20,000 characters.");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await insertTextNote(
    db,
    id,
    title.trim(),
    content,
    now,
  );

  return {
    id,
    title: title.trim(),
    source_type: "text",
    status: "pending",
  };
}

// Xử lý logic tạo note bằng file
export async function createFileNote(
  db: D1Database,
  r2: R2Bucket,
  title: unknown,
  file: unknown,
) {
  // Kiểm tra title
  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("Title is required.");
  }

  // Kiểm tra file
  if (!(file instanceof File)) {
    throw new Error("File is required.");
  }

  // Kiểm tra dung lượng file
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("File must not exceed 2 MB.");
  }

   const fileName = file.name.toLowerCase();

  if (
    !fileName.endsWith(".txt") &&
    !fileName.endsWith(".md")
  ) {
    throw new Error("Only .txt and .md files are supported.");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const objectKey = `notes/${id}/${file.name}`;
  const content = await file.text();
  
  await r2.put(objectKey, file);

  try {
    await insertFileNote(
      db,
      id,
      title.trim(),
      content,
      objectKey,
      file.name,
      file.type,
      file.size,
      now,
    );
  } catch (error) {
    await r2.delete(objectKey);
    throw error;
  }

  return {
    id,
    title: title.trim(),
    source_type: "file",
    content: content,
    original_name: file.name,
    status: "pending",
  };
}