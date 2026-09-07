"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createThread } from "@/lib/actions";

const CATEGORIES = [
  ["buying", "Buying"],
  ["renting", "Renting"],
  ["off-plan", "Off-plan and handover"],
  ["service-charges", "Service charges"],
  ["mortgages", "Mortgages"],
  ["general", "General"],
] as const;

export function NewThreadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await createThread(title, body, category);
          setResult(res);
          if (res.ok && res.slug) {
            // Straight to the thread. Clearing the form and saying "Posted" left
            // the poster on a blank page with no way to reach what they wrote.
            setTitle(""); setBody("");
            router.push(`/forum/${res.slug}`);
          } else if (res.ok) {
            router.push("/forum");
          }
        });
      }}
      className="space-y-s"
    >
      <div>
        <label className="meta mb-2xs block" htmlFor="title">Title</label>
        <input
          id="title" className="field" value={title} maxLength={140} required
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Something specific. What happened, where, and when."
        />
      </div>

      <div>
        <label className="meta mb-2xs block" htmlFor="category">Category</label>
        <select
          id="category" className="field" value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      <div>
        <label className="meta mb-2xs block" htmlFor="body">Post</label>
        <textarea
          id="body" className="field" value={body} maxLength={5000} required
          onChange={(e) => setBody(e.target.value)}
          style={{ minHeight: "12rem" }}
          placeholder="What happened. Dates, amounts and names of processes are what make a post useful to the next person."
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-s">
        <button
          type="submit" className="btn"
          disabled={pending || title.trim().length < 10 || body.trim().length < 15}
        >
          {pending ? "Sending…" : "Post thread"}
        </button>
      </div>

      {result && (
        <p role="status" className="meta" style={{ color: result.ok ? "var(--accent)" : "#B3271E" }}>
          {result.message}
        </p>
      )}
    </form>
  );
}
