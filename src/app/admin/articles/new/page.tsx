import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/queries";
import { ArticleEditor } from "@/components/ArticleEditor";

export const metadata: Metadata = { title: "New article", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewArticle() {
  if (!(await isModerator())) redirect("/signin");
  return (
    <div className="shell py-xl">
      <p className="meta"><Link href="/admin/articles">Articles</Link></p>
      <h1 className="mt-2xs mb-l text-step-3">New article</h1>
      <ArticleEditor />
    </div>
  );
}
