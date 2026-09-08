"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveArticle, deleteArticle, type ArticleInput } from "@/lib/actions";

const TITLE_MAX = 60;
const DESC_MAX = 155;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}

/** A meter that tells you where you are against the limit, not just the count. */
function Counter({ n, max }: { n: number; max: number }) {
  const state = n === 0 ? "empty" : n > max ? "over" : n > max * 0.9 ? "near" : "ok";
  const colour = state === "over" ? "#B3271E" : state === "near" ? "#8A5B10" : "var(--muted)";
  return (
    <span className="meta" style={{ color: colour }}>
      {n}/{max}
      {state === "over" ? ": Google will truncate this" : ""}
    </span>
  );
}

export function ArticleEditor({ initial }: { initial?: Partial<ArticleInput> & { id?: string } }) {
  const router = useRouter();
  const [f, setF] = useState<ArticleInput>({
    id: initial?.id,
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    dek: initial?.dek ?? "",
    body: initial?.body ?? "",
    topic: initial?.topic ?? "",
    status: (initial?.status as "draft" | "published") ?? "draft",
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    canonicalUrl: initial?.canonicalUrl ?? "",
    noindex: initial?.noindex ?? false,
    focusKeyword: initial?.focusKeyword ?? "",
    featuredImageUrl: initial?.featuredImageUrl ?? "",
    featuredImageAlt: initial?.featuredImageAlt ?? "",
    sourceNote: initial?.sourceNote ?? "",
  });
  // Track whether the slug has been edited by hand. Testing `!f.slug` instead
  // froze the slug after the first keystroke, because it was no longer empty.
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof ArticleInput>(k: K, v: ArticleInput[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = (status: "draft" | "published") =>
    start(async () => {
      const res = await saveArticle({ ...f, status });
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) { set("status", status); router.refresh(); }
    });

  const effTitle = f.metaTitle || f.title;
  const effDesc = f.metaDescription || f.dek;

  return (
    <div className="grid gap-l lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* ---- the writing ---- */}
      <div className="space-y-s">
        <div>
          <label className="meta mb-2xs block" htmlFor="title">Title</label>
          <input
            id="title" className="field" value={f.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
          />
        </div>

        <div>
          <label className="meta mb-2xs block" htmlFor="slug">
            Slug <span style={{ color: "var(--faint)" }}>/answers/{f.slug || "…"}</span>
          </label>
          <input
            id="slug" className="field" value={f.slug}
            onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }}
          />
        </div>

        <div>
          <label className="meta mb-2xs block" htmlFor="dek">Standfirst</label>
          <input id="dek" className="field" value={f.dek} onChange={(e) => set("dek", e.target.value)} />
        </div>

        <div>
          <label className="meta mb-2xs block" htmlFor="body">Body (Markdown)</label>
          <textarea
            id="body" className="field" value={f.body}
            onChange={(e) => set("body", e.target.value)}
            style={{ minHeight: "32rem", fontFamily: "var(--font-sans)", fontSize: "0.9rem", lineHeight: 1.6 }}
          />
          <p className="meta mt-2xs">
            {f.body.trim() ? f.body.trim().split(/\s+/).length.toLocaleString() : 0} words ·
            about {Math.max(1, Math.round((f.body.trim().split(/\s+/).length || 0) / 200))} min read
          </p>
        </div>
      </div>

      {/* ---- the controls ---- */}
      <aside className="space-y-l">
        <section>
          <h2 className="text-step-0">Publish</h2>
          <p className="meta mt-2xs">
            Status: <strong>{f.status === "published" ? "Published" : "Draft"}</strong>
          </p>
          <div className="mt-s flex flex-wrap gap-xs">
            <button type="button" className="btn btn-quiet" disabled={pending} onClick={() => save("draft")}>
              Save draft
            </button>
            <button type="button" className="btn" disabled={pending} onClick={() => save("published")}>
              {pending ? "…" : "Publish"}
            </button>
          </div>
          {msg && (
            <p role="status" className="meta mt-s" style={{ color: msg.ok ? "var(--accent)" : "#B3271E" }}>
              {msg.text}
            </p>
          )}
          {f.slug && f.status === "published" && (
            <p className="meta mt-2xs"><Link href={`/answers/${f.slug}`}>View live</Link></p>
          )}
        </section>

        <section className="border-t border-rule pt-m">
          <h2 className="text-step-0">Featured image</h2>
          {f.featuredImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.featuredImageUrl} alt="" className="mt-s"
                 style={{ width: "100%", borderRadius: 4, border: "1px solid var(--rule)" }} />
          )}
          <label className="meta mt-s mb-2xs block" htmlFor="img">Image URL</label>
          <input id="img" className="field" value={f.featuredImageUrl}
                 placeholder="https://…" onChange={(e) => set("featuredImageUrl", e.target.value)} />
          <label className="meta mt-s mb-2xs block" htmlFor="alt">Alt text</label>
          <input id="alt" className="field" value={f.featuredImageAlt}
                 onChange={(e) => set("featuredImageAlt", e.target.value)} />
          <p className="meta mt-2xs">
            Describe what the image shows. Leave empty only if it is purely decorative.
          </p>
        </section>

        <section className="border-t border-rule pt-m">
          <h2 className="text-step-0">SEO</h2>

          <label className="meta mt-s mb-2xs block" htmlFor="topic">Topic</label>
          <input id="topic" className="field" value={f.topic} placeholder="Market data"
                 onChange={(e) => set("topic", e.target.value)} />

          <div className="mt-s flex items-baseline justify-between">
            <label className="meta" htmlFor="mt">Meta title</label>
            <Counter n={effTitle.length} max={TITLE_MAX} />
          </div>
          <input id="mt" className="field" value={f.metaTitle} placeholder={f.title || "Defaults to the title"}
                 onChange={(e) => set("metaTitle", e.target.value)} />

          <div className="mt-s flex items-baseline justify-between">
            <label className="meta" htmlFor="md">Meta description</label>
            <Counter n={effDesc.length} max={DESC_MAX} />
          </div>
          <textarea id="md" className="field" value={f.metaDescription}
                    placeholder={f.dek || "Defaults to the standfirst"}
                    onChange={(e) => set("metaDescription", e.target.value)} style={{ minHeight: "5rem" }} />

          <label className="meta mt-s mb-2xs block" htmlFor="fk">Focus keyword</label>
          <input id="fk" className="field" value={f.focusKeyword} placeholder="For your reference only"
                 onChange={(e) => set("focusKeyword", e.target.value)} />
          {f.focusKeyword && (
            <p className="meta mt-2xs">
              In title: {effTitle.toLowerCase().includes(f.focusKeyword.toLowerCase()) ? "yes" : "no"} ·
              in body: {f.body.toLowerCase().includes(f.focusKeyword.toLowerCase()) ? "yes" : "no"}
            </p>
          )}

          <label className="meta mt-s mb-2xs block" htmlFor="canon">Canonical URL</label>
          <input id="canon" className="field" value={f.canonicalUrl} placeholder="Leave empty unless republished"
                 onChange={(e) => set("canonicalUrl", e.target.value)} />

          <label className="mt-s flex items-center gap-xs text-step--1">
            <input type="checkbox" checked={f.noindex} onChange={(e) => set("noindex", e.target.checked)} />
            Hide from search engines
          </label>

          <label className="meta mt-s mb-2xs block" htmlFor="sn">Source note (private)</label>
          <input id="sn" className="field" value={f.sourceNote}
                 onChange={(e) => set("sourceNote", e.target.value)} />
        </section>

        {/* Search preview, so the meta fields are judged as they will appear */}
        <section className="border-t border-rule pt-m">
          <h2 className="text-step-0">Search preview</h2>
          <div className="mt-s rounded p-s" style={{ background: "var(--surface)" }}>
            <p className="meta m-0" style={{ color: "var(--muted)" }}>
              dubairealestateadvice.com › answers › {f.slug || "…"}
            </p>
            <p className="m-0 mt-2xs" style={{ color: "#1a0dab", fontSize: "1.05rem", lineHeight: 1.3 }}>
              {effTitle.slice(0, TITLE_MAX) || "Untitled"}
              {effTitle.length > TITLE_MAX ? "…" : ""}
            </p>
            <p className="meta m-0 mt-2xs">
              {effDesc.slice(0, DESC_MAX) || "No description yet."}
              {effDesc.length > DESC_MAX ? "…" : ""}
            </p>
          </div>
        </section>

        {initial?.id && (
          <section className="border-t border-rule pt-m">
            <button
              type="button" className="btn btn-quiet" disabled={pending}
              onClick={() => {
                if (!confirm("Delete this article? This cannot be undone.")) return;
                start(async () => {
                  const res = await deleteArticle(initial.id!);
                  if (res.ok) router.push("/admin/articles");
                  else setMsg({ ok: false, text: res.message });
                });
              }}
            >
              Delete article
            </button>
          </section>
        )}
      </aside>
    </div>
  );
}
