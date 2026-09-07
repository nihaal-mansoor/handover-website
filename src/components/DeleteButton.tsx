"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/lib/actions";

/**
 * Delete your own post. A moderator sees it on everyone's.
 *
 * The confirm step is inline rather than a window.confirm, which is blocked in
 * some embedded browsers and cannot be styled or reached consistently by a
 * keyboard. Deleting is not undoable, so it always asks.
 */
export function DeleteButton({
  kind,
  id,
  redirectTo,
}: {
  kind: "comment" | "thread" | "reply";
  id: string;
  /** Where to go after deleting a whole thread, whose page stops existing. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!asking) {
    return (
      <button type="button" className="post-action" onClick={() => setAsking(true)}>
        Delete
      </button>
    );
  }

  return (
    <span className="post-confirm">
      <span className="meta">Delete this?</span>
      <button
        type="button"
        className="post-action post-action-danger"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await deletePost(kind, id);
            if (!res.ok) {
              setError(res.message);
              setAsking(false);
              return;
            }
            if (redirectTo) router.push(redirectTo);
            router.refresh();
          })
        }
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button type="button" className="post-action" onClick={() => setAsking(false)}>
        Cancel
      </button>
      {error && <span role="status" className="meta">{error}</span>}
    </span>
  );
}
