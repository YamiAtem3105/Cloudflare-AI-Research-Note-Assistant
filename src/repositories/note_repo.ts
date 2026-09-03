// Lưu data text vào note
export async function insertTextNote(
  db: D1Database,
  id: string,
  title: string,
  content: string,
  now: string,
): Promise<void> {
  await db
    .prepare(`
      INSERT INTO notes (
        id,
        title,
        source_type,
        content,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, 'text', ?, 'pending', ?, ?)
    `)
    .bind(
      id,
      title,
      content,
      now,
      now,
    )
    .run();
}
// Lưu data file vào note
export async function insertFileNote(
  db: D1Database,
  id: string,
  title: string,
  content:string,
  objectKey: string,
  originalName: string,
  contentType: string,
  size: number,
  now: string,
): Promise<void> {
  await db
    .prepare(`
      INSERT INTO notes (
        id,
        title,
        source_type,
        content,
        object_key,
        original_name,
        content_type,
        size,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, 'file',?, ?, ?, ?, ?, 'pending', ?, ?)
    `)
    .bind(
      id,
      title,
      content,
      objectKey,
      originalName,
      contentType,
      size,
      now,
      now,
    )
    .run();
}
// cập nhật các trường dữ liệu sau khi AI trả về
export async function updateNoteAIResult(
  db: D1Database,
  id: string,
  summary: string,
  category: string,
  tags: string[],
  status: "done" | "failed",
  now: string,
): Promise<void> {
  await db
    .prepare(`
      UPDATE notes
      SET
        summary = ?,
        category = ?,
        tags_json = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `)
    .bind(
      summary,
      category,
      JSON.stringify(tags),
      status,
      now,
      id,
    )
    .run();
}

// Lấy các trường dữ liệu để tạo danh sách cho user
export async function listNotes(
  db: D1Database,
) {
  const result = await db
    .prepare(`
      SELECT
        id,
        title,
        source_type,
        status,
        category,
        created_at
      FROM notes
      ORDER BY created_at DESC
    `)
    .all();

  return result.results;
}

// Lấy toàn bộ thông tin của 1 note theo id
export async function getNoteById(
  db: D1Database,
  id: string,
) {
  const result = await db
    .prepare(`
      SELECT
        id,
        title,
        source_type,
        content,
        object_key,
        original_name,
        content_type,
        size,
        status,
        summary,
        category,
        tags_json,
        error_message,
        created_at,
        updated_at
      FROM notes
      WHERE id = ?
    `)
    .bind(id)
    .first();

  return result;
}