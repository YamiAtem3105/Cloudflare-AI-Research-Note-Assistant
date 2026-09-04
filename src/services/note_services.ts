
import {
  insertTextNote,
  insertFileNote,
  updateNoteAIResult,
  listNotes,
  getNoteById,
  updateProcessing,
  updateErrorMessage,
} from "../repositories/note_repo";

import { AppError } from "../error/app_error";
import { analyzeNote } from "../services/ai_services";

// Xử lý logic tạo note bằng text
export async function createTextNote(
  db: D1Database,
  ai: Ai,
  title: unknown,
  content: unknown,
) {
  // Kiểm tra title
  if (typeof title !== "string" || title.trim() === "") {
    throw new AppError("Title is required.", 400);
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

  // Lưu note vào D1
  await insertTextNote(
    db,
    id,
    title.trim(),
    content,
    now,
  );
  
  // Xử lý note bằng AI
  return processNote(
    db,
    ai,
    id,
    'pending',
);
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
  // Kiểm tra title
  if (typeof title !== "string" || title.trim() === "") {
    throw new AppError("Title is required.", 400);
  }

  // Kiểm tra file
  if (!(file instanceof File)) {
    throw new AppError("File is required.", 400);
  }

  // Kiểm tra dung lượng file
  if (file.size > 2 * 1024 * 1024) {
    throw new AppError("File must not exceed 2 MB.", 400);
  }

  if (file.size === 0) {
    throw new AppError("File must not be empty.", 400);
  }

  // Kiểm tra extension
  const fileName = file.name.toLowerCase();

  if (
    !fileName.endsWith(".txt") &&
    !fileName.endsWith(".md")
  ) {
    throw new AppError("Only .txt and .md files are supported.", 400);
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
  // D1 thất bại → cố gắng xóa file đã upload vào R2
  try {
    await r2.delete(objectKey);
  } catch (cleanupError) {
    // R2 cleanup cũng thất bại → ghi lại Worker Log
    console.error({
      type: "R2_CLEANUP_FAILED",
      objectKey,
      error:
        cleanupError instanceof Error
          ? cleanupError.message
          : String(cleanupError),
    });
  }

  // Giữ lại lỗi D1 ban đầu
  throw error;
}
  // Xử lý note bằng AI
  return processNote(
    db,
    ai,
    id,
    "pending",
    r2,
  );
}

// Chuyển note sang trạng thái processing
export async function startProcessing(
  db: D1Database,
  id: string,
  currentStatus: "pending" | "failed" ,
): Promise<boolean> {
  return updateProcessing(db, id, currentStatus);
}


// Hàm xử lý note chung của cả text và file
export async function processNote(
  db: D1Database,
  ai: Ai,
  id: string,
  currentStatus: "pending" | "failed" ,
  r2?: R2Bucket,
) {

  // Lấy thông tin note
  const note = await getNoteById(db, id);

    if (!note) {
      throw new AppError(
        "Note not found.",
         404,
      );
    }
    
  // Chuyển currentStatus -> processing
  const started = await startProcessing(db, id, currentStatus);



  if (!started) {
    throw new AppError(
      "Note is already being processed.",
      409,
      );
    }

  try {
    let content: string;

    // Lấy content tùy theo loại note
    if (note.source_type === "text") {
      content = note.content ?? "";
    } else {
      if (!r2) {
        throw new Error("R2 bucket is required for file note.");
      }

      if (!note.object_key) {
        throw new Error("File object key is missing.");
      }

      const object = await r2.get(note.object_key);

      if (!object) {
        throw new AppError("File not found in storage.", 404);
      }

      content = await object.text();
    }

    // Gửi content cho AI phân tích
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
      title: note.title,
      source_type: note.source_type,
      status: "done",
      summary: aiResult.summary,
      category: aiResult.category,
      tags: aiResult.tags,
    };
  } catch (error) {
  const errorMessage =
    error instanceof AppError
      ? error.message
      : "Note processing failed.";

  try {
    await updateErrorMessage(
      db,
      id,
      errorMessage,
      new Date().toISOString(),
    );
  } catch (updateError) {
    console.error({
      type: "FAILED_STATUS_UPDATE_FAILED",
      error: updateError,
    });
  }

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


