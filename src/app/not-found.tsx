import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/**
 * A missing page is a normal thing to hit from a stale link or a search result
 * for something since renamed. Without this the visitor gets a bare framework
 * page with nothing to click, which is a guaranteed bounce, so this offers the
 * routes that actually go somewhere.
 */
export default function NotFound() {
  return (
    <div className="col py-xl">
      <div className="max-w-[42ch]">
        <h1 className="text-step-3">That page is not here</h1>
        <p className="mt-m text-ink-2">
          The link may be out of date, or the page may have moved. Nothing is
          lost: everything on the site is reachable from these.
        </p>

        <ul className="mt-l space-y-s">
          <li><Link href="/">All articles</Link></li>
          <li><Link href="/topics">Browse by topic</Link></li>
          <li><Link href="/forum">The forum</Link></li>
          <li><Link href="/search">Search</Link></li>
        </ul>
      </div>
    </div>
  );
}
