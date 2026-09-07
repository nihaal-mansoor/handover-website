"use client";

import { useId, useState, useTransition } from "react";
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
  compact = false,
}: {
  action: (body: string) => Promise<{ ok: boolean; message: string }>;
  signedIn: boolean;
  placeholder: string;
  submitLabel: string;
  /** Nested reply boxes sit inside a comment, so they lose the sign-in card. */
  compact?: boolean;
}) {
  const router = useRouter();
  // A thread renders one of these per comment, so the id cannot be a constant:
  // duplicate ids break the label association and fail HTML validation.
  const fieldId = useId();
  const [body, setBody] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  if (!signedIn) {
    if (compact) {
      return (
        <p className="meta m-0">
          <Link href="/signin">Sign in</Link> to reply.
        </p>
      );
    }
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
      <label className="sr-only" htmlFor={fieldId}>Your post</label>
      <textarea
        id={fieldId}
        className="field"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        maxLength={5000}
        required
      />
      <div className="mt-s flex flex-wrap items-center justify-end gap-s">
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
