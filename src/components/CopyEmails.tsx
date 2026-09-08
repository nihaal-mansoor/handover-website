"use client";

import { useState } from "react";

/**
 * Copies the whole list to the clipboard.
 *
 * A download would be the obvious thing, but the list is the entire point of
 * this page and copying puts it straight into a mail client's To field without
 * a file landing on disk.
 */
export function CopyEmails({ emails }: { emails: readonly string[] }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-s">
      <button type="button" className="btn" onClick={copy} disabled={emails.length === 0}>
        Copy {emails.length} {emails.length === 1 ? "address" : "addresses"}
      </button>
      <span role="status" className="meta">
        {state === "done" ? "Copied." : state === "failed" ? "Could not copy. Select the column instead." : ""}
      </span>
    </div>
  );
}
