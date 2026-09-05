import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, cspWithNonce } from "@uaeprop/site-kit/security";

/**
 * Per-request CSP nonce.
 *
 * Next's hydration bootstrap is an inline script. A CSP of `script-src 'self'`
 * blocks it, React never hydrates, and every form silently degrades to a native
 * submit — which for a sign-in form means the password ends up in the URL.
 *
 * So the CSP has to carry a nonce. Next reads the `x-nonce` request header and
 * stamps it on the scripts it emits; `strict-dynamic` then covers the chunks
 * those scripts load. (CLAUDE.md §4.3)
 */
const CSP = buildCsp({ analytics: true, turnstile: true, useNonce: true });

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = cspWithNonce(CSP, nonce).replace(/\s{2,}/g, " ").trim();

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Documents only. Static assets and images do not execute scripts.
    {
      source: "/((?!_next/static|_next/image|favicon.svg|og.png).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
