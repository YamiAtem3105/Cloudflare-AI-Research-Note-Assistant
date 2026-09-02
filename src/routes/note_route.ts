import {
  createTextNote,
  createFileNote,
} from "../services/note_services";

export async function createNote(
  request: Request,
  env: Env,
): Promise<Response> {
  // Lấy loại dữ liệu mà client gửi lên
  const contentType = request.headers.get("content-type") ?? "";

  // Xử lý tạo note bằng text (JSON)
  if (contentType.includes("application/json")) {
    const body = await request.json() as {
      title?: unknown;
      content?: unknown;
    };

    const result = await createTextNote(
      env.ai_research_notes_db,
      body.title,
      body.content,
    );

    return Response.json(result, {
      status: 201,
    });
  }

  // Xử lý tạo note bằng file (formData)
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    const body = {
      title: formData.get("title"),
      file: formData.get("file"),
    };

    const result = await createFileNote(
      env.ai_research_notes_db,
      env.ai_research_notes,
      body.title,
      body.file,
    );

    return Response.json(result, {
      status: 201,
    });
  }

  return Response.json(
    { error: "Unsupported content type." },
    { status: 400 },
  );
}