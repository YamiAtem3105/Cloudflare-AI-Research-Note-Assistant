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
export async function insertFileNote(
  db: D1Database,
  id: string,
  title: string,
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
        object_key,
        original_name,
        content_type,
        size,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, 'file', ?, ?, ?, ?, 'pending', ?, ?)
    `)
    .bind(
      id,
      title,
      objectKey,
      originalName,
      contentType,
      size,
      now,
      now,
    )
    .run();
}