import { handleLead } from "@uaeprop/site-kit/leads";
import config from "../site.config.ts";

/**
 * Vercel Function. Deliberately NOT an Astro route — the site is fully static,
 * and a native function keeps the Astro build adapter-free. (One fewer
 * dependency across 33 sites, and the Vercel adapter currently ships a
 * vulnerable path-to-regexp with no patched release.)
 */

function respond(result: Awaited<ReturnType<typeof handleLead>>): Response {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...result.headers,
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  return respond(await handleLead(request, config));
}

/** Anything other than POST is rejected by the handler itself. */
export async function GET(request: Request): Promise<Response> {
  return respond(await handleLead(request, config));
}
