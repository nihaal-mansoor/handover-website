import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isModerator } from "@/lib/queries";
import { getArticleForEdit } from "@/lib/actions";
import { ArticleEditor } from "@/components/ArticleEditor";

export const metadata: Metadata = { title: "Edit article", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isModerator())) redirect("/signin");
  const { id } = await params;
  const row = await getArticleForEdit(id);
  if (!row) notFound();

  return (
    <div className="shell py-xl">
      <p className="meta"><Link href="/admin/articles">Articles</Link></p>
      <h1 className="mt-2xs mb-l text-step-3">{row.title}</h1>
      <ArticleEditor
        initial={{
          id: row.id, slug: row.slug, title: row.title, dek: row.dek, body: row.body,
          topic: row.topic, status: row.status as "draft" | "published",
          metaTitle: row.metaTitle ?? "", metaDescription: row.metaDescription ?? "",
          canonicalUrl: row.canonicalUrl ?? "", noindex: row.noindex,
          focusKeyword: row.focusKeyword ?? "",
          featuredImageUrl: row.featuredImageUrl ?? "", featuredImageAlt: row.featuredImageAlt ?? "",
          sourceNote: row.sourceNote ?? "",
        }}
      />
    </div>
  );
}
