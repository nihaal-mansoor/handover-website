import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listArticles } from "@/lib/actions";
import { isModerator, formatWhen } from "@/lib/queries";

export const metadata: Metadata = { title: "Articles", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ArticlesAdmin() {
  if (!(await isModerator())) redirect("/signin?next=/admin/articles");
  const rows = (await listArticles()) ?? [];

  return (
    <div className="shell py-xl">
      <div className="flex flex-wrap items-center justify-between gap-s">
        <h1 className="text-step-3">Articles</h1>
        <Link href="/admin/articles/new" className="btn">New article</Link>
      </div>
      <p className="meta mt-2xs mb-l">
        {rows.length} in the database.{" "}
        <Link href="/admin">Moderation queue</Link>
      </p>

      <div style={{ overflowX: "auto" }}>
        <table className="w-full border-collapse text-left" style={{ minWidth: "44rem" }}>
          <thead>
            <tr className="border-b-2 border-[var(--ink)]">
              <th className="meta py-xs pr-s">Title</th>
              <th className="meta py-xs pr-s">Topic</th>
              <th className="meta py-xs pr-s">Status</th>
              <th className="meta py-xs pr-s">Published</th>
              <th className="meta py-xs pr-s">SEO</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const desc = a.metaDescription ?? a.dek ?? "";
              const title = a.metaTitle ?? a.title;
              const warn = !desc || desc.length > 155 || title.length > 60 || a.noindex;
              return (
                <tr key={a.id} className="border-b border-rule align-top">
                  <td className="py-s pr-s">
                    <Link href={`/admin/articles/${a.id}`} className="font-medium">{a.title}</Link>
                    <span className="meta block">/{a.slug}</span>
                  </td>
                  <td className="py-s pr-s text-step--1">{a.topic}</td>
                  <td className="py-s pr-s text-step--1">
                    <span style={{ color: a.status === "published" ? "var(--accent)" : "var(--muted)" }}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-s pr-s text-step--1">
                    {a.publishedAt ? formatWhen(a.publishedAt) : "—"}
                  </td>
                  <td className="py-s pr-s text-step--1">
                    {a.noindex ? (
                      <span style={{ color: "#B3271E" }}>noindex</span>
                    ) : warn ? (
                      <span style={{ color: "#8A5B10" }}>needs attention</span>
                    ) : (
                      <span style={{ color: "var(--accent)" }}>ok</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
