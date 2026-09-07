"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * The fallback when a route throws. Without it a failed render is a blank page
 * with no way out.
 *
 * The error itself is never shown: it can carry a query, a path or a stack, and
 * none of that belongs in front of a reader (CLAUDE.md §4.4). It goes to the
 * console for the server log instead. `reset` retries the render, which is
 * enough for the common case of a database hiccup.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="col py-xl">
      <div className="max-w-[42ch]">
        <h1 className="text-step-3">Something went wrong</h1>
        <p className="mt-m text-ink-2">
          That page did not load. Trying again usually works; if it does not,
          the links below all still go somewhere.
        </p>

        <div className="mt-l flex flex-wrap items-center gap-s">
          <button type="button" className="btn" onClick={reset}>Try again</button>
          <Link href="/" className="post-action">All articles</Link>
          <Link href="/forum" className="post-action">The forum</Link>
        </div>
      </div>
    </div>
  );
}
