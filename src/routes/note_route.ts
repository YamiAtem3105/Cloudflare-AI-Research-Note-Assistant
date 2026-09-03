import { 
  createTextNote, 
  createFileNote, 
  getNotes,
  get_1_Note,
  startProcessing,
} from "../services/note_services"; 
 
export async function createNote( 
  request: Request, 
  env: Env, 
): Promise<Response> { 
  // Lấy loại dữ liệu mà client gửi lên 
  const contentType = request.headers.get("content-type") ?? ""; 
 
  try {
    // Xử lý tạo note bằng text (JSON) 
    if (contentType.includes("application/json")) { 
      const body = await request.json() as { 
        title?: unknown; 
        content?: unknown; 
      }; 
 
      const result = await createTextNote( 
        env.ai_research_notes_db, 
        env.AI,
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
        env.AI,
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
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return Response.json(
      { error: "Internal Server Error." },
      { status: 500 },
    );
  }
}

export async function getNoteList(
  env: Env,
): Promise<Response> {
  const notes = await getNotes(
    env.ai_research_notes_db,
  );

  return Response.json(notes);
}

export async function getNoteDetail(
  env: Env,
  id: string,
): Promise<Response> {
  const note = await get_1_Note(
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
}

