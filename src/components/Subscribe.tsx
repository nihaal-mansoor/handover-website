"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { subscribe } from "@/lib/actions";

/**
 * One field, no account, no moderation. At this stage the site is trying to be
 * read, not to collect leads, so this asks for the least it can.
 */
export function Subscribe() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  // A field no person can see, and the moment the form appeared. A script fills
  // the first and submits far faster than the second allows.
  const [trap, setTrap] = useState("");
  const shownAt = useRef(Date.now());
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
        start(async () =>
          setResult(await subscribe(email, pathname, trap, Date.now() - shownAt.current)),
        );
      }}
    >
      <label className="meta mb-2xs block" htmlFor="subscribe-email">
        New answers, when they go up. No more than one email a week.
      </label>

      {/* aria-hidden and off the tab order, so it is invisible to a person and
          to a screen reader, but present in the DOM for anything filling fields
          blind. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor="subscribe-company">Company</label>
        <input
          id="subscribe-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
      </div>
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
