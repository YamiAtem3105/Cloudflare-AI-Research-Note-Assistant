import {
  insertTextNote,
  insertFileNote,
  updateNoteAIResult,
  listNotes,
  getNoteById,
} from "../repositories/note_repo";

import { analyzeNote } from "./ai_services";

// Xử lý logic tạo note bằng text
export async function createTextNote(
  db: D1Database,
  ai: Ai,
  title: unknown,
  content: unknown,
) {
  // Kiểm tra title
  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("Title is required.");
  }

  // Kiểm tra content
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("Content is required.");
  }

  // Giới hạn content
  if (content.length > 20_000) {
    throw new Error("Content must not exceed 20,000 characters.");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // 1. Lưu note vào D1 trước
  await insertTextNote(
    db,
    id,
    title.trim(),
    content,
    now,
  );

  try {
    // 2. Gửi content cho AI phân tích
    const aiResult = await analyzeNote(
      ai,
      content,
    );

    // 3. Lưu kết quả AI vào D1
    await updateNoteAIResult(
      db,
      id,
      aiResult.summary,
      aiResult.category,
      aiResult.tags,
      "done",
      new Date().toISOString(),
    );

    // 4. Trả kết quả cho user
    return {
      id,
      title: title.trim(),
      source_type: "text",
      status: "done",
      summary: aiResult.summary,
      category: aiResult.category,
      tags: aiResult.tags,
    };
  } catch (error) {
    // AI xử lý thất bại → đánh dấu note failed
    await db
      .prepare(`
        UPDATE notes
        SET status = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(
        "failed",
        new Date().toISOString(),
        id,
      )
      .run();

    throw error;
  }
}


// Xử lý logic tạo note bằng file
export async function createFileNote(
  db: D1Database,
  r2: R2Bucket,
  ai: Ai,
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
  if (file.size === 0){
    throw new Error("File must not be empty");
  }

  // Kiểm tra extension
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

  // Đọc content từ file
  const content = await file.text();

  // Lưu file vào R2
  await r2.put(objectKey, file);

  try {
    // Lưu metadata + content vào D1
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
    // D1 thất bại → xóa file đã upload vào R2
    await r2.delete(objectKey);
    throw error;
  }

  try {
    // Phân tích content bằng AI
    const aiResult = await analyzeNote(
      ai,
      content,
    );

    // Lưu kết quả AI vào D1
    await updateNoteAIResult(
      db,
      id,
      aiResult.summary,
      aiResult.category,
      aiResult.tags,
      "done",
      new Date().toISOString(),
    );

    return {
      id,
      title: title.trim(),
      source_type: "file",
      original_name: file.name,
      status: "done",
      summary: aiResult.summary,
      category: aiResult.category,
      tags: aiResult.tags,
    };
  } catch (error) {
    // AI thất bại → note vẫn tồn tại nhưng trạng thái là failed
    await db
      .prepare(`
        UPDATE notes
        SET status = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(
        "failed",
        new Date().toISOString(),
        id,
      )
      .run();

    throw error;
  }
}

// Lấy thông tin trong notes để tạo list cho user
export async function getNotes( db: D1Database,) {

  return listNotes(db);
  
}

// Lấy thông tin của 1 note theo id
export async function get_1_Note(
  db: D1Database,
  id: string,
) {
  return getNoteById(db, id);
}