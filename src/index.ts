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

iimport {
  createNote,
  listNoteRoute,
  getNoteRoute,
} from "./routes/note.routes";

import {
  analyzeRoute,
  retryRoute,
} from "./routes/analyze.routes";

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

    if (
      request.method === "GET" &&
      url.pathname === "/notes"
    ) {
      return listNoteRoute(request, env);
    }

    let match = url.pathname.match(
      /^\/notes\/([^/]+)\/analyze$/,
    );

    if (
      request.method === "POST" &&
      match
    ) {
      return analyzeRoute(
        request,
        env,
        match[1],
      );
    }

    match = url.pathname.match(
      /^\/notes\/([^/]+)\/retry$/,
    );

    if (
      request.method === "POST" &&
      match
    ) {
      return retryRoute(
        request,
        env,
        match[1],
      );
    }

    match = url.pathname.match(
      /^\/notes\/([^/]+)$/,
    );

    if (
      request.method === "GET" &&
      match
    ) {
      return getNoteRoute(
        request,
        env,
        match[1],
      );
    }

    return Response.json(
      { error: "Not Found." },
      { status: 404 },
    );
  },
} satisfies ExportedHandler<Env>;