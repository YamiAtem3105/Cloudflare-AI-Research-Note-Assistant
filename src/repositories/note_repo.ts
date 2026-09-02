import {
  analyze,
  retry,
} from "../services/note.service";

export async function analyzeRoute(
  _request: Request,
  env: Env,
  id: string,
) {
  try {
    const result = await analyze(
      env.ai_research_notes_db,
      env.ai_research_notes,
      env.AI,
      id,
    );

    return Response.json({
      status: "done",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Analysis failed.";

    const status =
      message === "Note not found."
        ? 404
        : message.includes("already being processed")
          ? 409
          : 500;

    return Response.json(
      { error: message },
      { status },
    );
  }
}

export async function retryRoute(
  _request: Request,
  env: Env,
  id: string,
) {
  try {
    const result = await retry(
      env.ai_research_notes_db,
      env.ai_research_notes,
      env.AI,
      id,
    );

    return Response.json({
      status: "done",
      ...result,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Retry failed.",
      },
      { status: 500 },
    );
  }
}