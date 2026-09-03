import type { APIRoute } from "astro";
import { originOf } from "@uaeprop/site-kit";
import config from "../../site.config.ts";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${originOf(config)}/sitemap-index.xml\n`,
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
