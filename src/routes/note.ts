import {
  createText,
  createFile,
  getNotes,
  getNoteDetail,
} from "../services/note.service";

export async function createNote(
  request: Request,
  env: Env,
) {
  try {
    const type =
      request.headers.get("content-type") || "";

    if (type.includes("multipart/form-data")) {
      const form = await request.formData();

      return Response.json(
        await createFile(
          env.ai_research_notes_db,
          env.ai_research_notes,
          form.get("title"),
          form.get("file") instanceof File
            ? form.get("file")
            : null,
        ),
        { status: 201 },
      );
    }

    if (type.includes("application/json")) {
      const body = await request.json();

      return Response.json(
        await createText(
          env.ai_research_notes_db,
          body?.title,
          body?.content,
        ),
        { status: 201 },
      );
    }

    return Response.json(
      { error: "Unsupported Content-Type." },
      { status: 400 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create note.",
      },
      { status: 400 },
    );
  }
}

export async function listNoteRoute(
  _request: Request,
  env: Env,
) {
  try {
    return Response.json({
      notes: await getNotes(
        env.ai_research_notes_db,
      ),
    });
  } catch {
    return Response.json(
      { error: "Failed to list notes." },
      { status: 500 },
    );
  }
}

export async function getNoteRoute(
  _request: Request,
  env: Env,
  id: string,
) {
  try {
    const note = await getNoteDetail(
      env.ai_research_notes_db,
      id,
    );

    if (!note) {
      return Response.json(
        { error: "Note not found." },
        { status: 404 },
      );
    }

    return Response.json(note);
  } catch {
    return Response.json(
      { error: "Failed to get note." },
      { status: 500 },
    );
  }
}