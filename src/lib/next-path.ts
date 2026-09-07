/**
 * Where to send someone after they sign in.
 *
 * The value arrives in a query string, so it is attacker-controlled: without a
 * check, `/signin?next=https://example.com` would turn our own sign-in page into
 * a redirector to anywhere, which is exactly the shape phishing wants. Only a
 * path on this site is allowed through.
 */
export function safeNext(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;

  // Must be a rooted path. "//host" and "/\host" are protocol-relative in
  // browsers and would leave the site, so both are rejected alongside anything
  // carrying a scheme.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;

  // A newline or a control character can split a header or smuggle a second URL.
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  // Bouncing back to an auth route would loop.
  if (/^\/(signin|signup)(\/|\?|$)/.test(value)) return fallback;

  return value;
}

/** Builds a sign-in link that returns to `from` afterwards. */
export function signInHref(from: string, route: "/signin" | "/signup" = "/signin"): string {
  const target = safeNext(from);
  return target === "/" ? route : `${route}?next=${encodeURIComponent(target)}`;
}
