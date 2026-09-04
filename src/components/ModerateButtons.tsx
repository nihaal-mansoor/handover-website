"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderate } from "@/lib/actions";

export function ModerateButtons({
  kind,
  id,
}: {
  kind: "comment" | "thread" | "reply";
  id: string;
}) {
  const router = useRouter();
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) return <p className="meta mt-s" style={{ color: "var(--accent)" }}>{done}</p>;

  const decide = (decision: "approved" | "rejected") =>
    start(async () => {
      const res = await moderate(kind, id, decision);
      setDone(res.message);
      router.refresh();
    });

  return (
    <div className="mt-s flex gap-s">
      <button type="button" className="btn" disabled={pending} onClick={() => decide("approved")}>
        Approve
      </button>
      <button
        type="button" className="btn btn-quiet" disabled={pending}
        onClick={() => decide("rejected")}
      >
        Reject
      </button>
    </div>
  );
}
