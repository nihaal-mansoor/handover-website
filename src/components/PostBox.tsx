"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * The shared write box. Used for article comments and forum replies.
 *
 * A rejection message is shown in full, because a poster who has tripped the
 * listings rule needs to know what to change. It never names the rule.
 */
export function PostBox({
  action,
  signedIn,
  placeholder,
  submitLabel,
}: {
  action: (body: string) => Promise<{ ok: boolean; message: string }>;
  signedIn: boolean;
  placeholder: string;
  submitLabel: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  if (!signedIn) {
    return (
      <p className="meta rounded-[6px] p-s" style={{ background: "var(--surface)" }}>
        <Link href="/signin">Sign in</Link> or <Link href="/signup">create an account</Link> to
        join the discussion. Reading needs no account.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await action(body);
          setResult(res);
          if (res.ok) {
            setBody("");
            router.refresh();
          }
        });
      }}
    >
      <label className="sr-only" htmlFor="post-body">Your post</label>
      <textarea
        id="post-body"
        className="field"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        maxLength={5000}
        required
      />
      <div className="mt-s flex flex-wrap items-center justify-between gap-s">
        <p className="meta m-0">
          Posts are reviewed before they appear. No property advertising.
        </p>
        <button type="submit" className="btn" disabled={pending || body.trim().length < 15}>
          {pending ? "Sending…" : submitLabel}
        </button>
      </div>

      {result && (
        <p
          role="status"
          className="meta mt-s"
          style={{ color: result.ok ? "var(--accent)" : "#B3271E" }}
        >
          {result.message}
        </p>
      )}
    </form>
  );
}
