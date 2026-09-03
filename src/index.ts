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

import {
  createNote,
  getNoteList,
  getNoteDetail,
} from "./routes/note_route";

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Tạo note mới
    if (
      request.method === "POST" &&
      url.pathname === "/notes"
    ) {
      return createNote(request, env);
    }

    // Lấy danh sách note
    if (
      request.method === "GET" &&
      url.pathname === "/notes"
    ) {
      return getNoteList(env);
    }

    // Lấy thông tin một note theo ID
    if (
      request.method === "GET" &&
      url.pathname.startsWith("/notes/")
    ) {
      const id = url.pathname.split("/")[2];

      if (!id) {
        return Response.json(
          { error: "Note ID is required." },
          { status: 400 },
        );
      }

      return getNoteDetail(env, id);
    }
    

    return Response.json(
      { error: "Not Found." },
      { status: 404 },
    );
  },
} satisfies ExportedHandler<Env>;

