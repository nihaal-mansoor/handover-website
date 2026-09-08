"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { subscribe } from "@/lib/actions";

/**
 * One field, no account, no moderation. At this stage the site is trying to be
 * read, not to collect leads, so this asks for the least it can.
 */
export function Subscribe() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  if (result?.ok) {
    return (
      <p className="meta m-0" role="status" style={{ color: "var(--accent)" }}>
        {result.message}
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setResult(await subscribe(email, pathname)));
      }}
    >
      <label className="meta mb-2xs block" htmlFor="subscribe-email">
        New answers, when they go up. No more than one email a week.
      </label>
      <div className="flex flex-wrap gap-xs">
        <input
          id="subscribe-email"
          className="field"
          /* WCAG 3.3.1: the error is announced by the live region below, and
             these tie it to the field so it is also read when focus lands here. */
          aria-invalid={result && !result.ok ? true : undefined}
          aria-describedby={result && !result.ok ? "subscribe-error" : undefined}
          style={{ flex: "1 1 14rem", minWidth: 0 }}
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="btn shrink-0" disabled={pending || !email}>
          {pending ? "…" : "Subscribe"}
        </button>
      </div>
      {result && !result.ok && (
        <p id="subscribe-error" role="alert" className="meta mt-2xs" style={{ color: "#B3271E" }}>
          {result.message}
        </p>
      )}
    </form>
  );
}
