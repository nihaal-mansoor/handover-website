import type { APIRoute } from "astro";
import { consentBootstrapScript } from "@uaeprop/site-kit";
import config from "../../site.config.ts";

/**
 * Served as a static file rather than inlined, so the CSP needs no nonce and
 * no 'unsafe-inline'. (CLAUDE.md §4.3)
 */
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(consentBootstrapScript(config), {
    headers: {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
