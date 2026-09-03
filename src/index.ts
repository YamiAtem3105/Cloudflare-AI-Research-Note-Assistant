/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { createNote } from "./routes/note_route";
import { analyzeNote } from "./services/ai_services";

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (
      request.method === "POST" &&
      url.pathname === "/notes"
    ) {
      return createNote(request, env);
    }

    // TEST AI
    if (
      request.method === "POST" &&
      url.pathname === "/test-ai"
    ) {
      const body = await request.json() as {
        content?: unknown;
      };

      if (typeof body.content !== "string") {
        return Response.json(
          { error: "Content is required." },
          { status: 400 },
        );
      }

      const result = await analyzeNote(
        env.AI,
        body.content,
      );

      return Response.json(result);
    }

    return Response.json(
      { error: "Not Found." },
      { status: 404 },
    );
  },
} satisfies ExportedHandler<Env>;