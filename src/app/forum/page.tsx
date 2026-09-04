import type { Metadata } from "next";
import Link from "next/link";
import { approvedThreads, getCurrentUser, formatWhen } from "@/lib/queries";
import { RailLeft } from "@/components/RailLeft";
import { RailRight } from "@/components/RailRight";

export const metadata: Metadata = {
  title: "Forum",
  description:
    "What actually happened: handover delays, service charges, transfers and the rest, from people who went through it.",
  alternates: { canonical: "/forum" },
};

export const dynamic = "force-dynamic";

export default async function ForumPage() {
  const [threads, account] = await Promise.all([approvedThreads(), getCurrentUser()]);

  return (
    <div className="shell">
      <div className="app-grid">
        <RailLeft current="/forum" />

        <div className="feed">
          <div className="flex flex-wrap items-center justify-between gap-s">
            <h1 className="text-step-3">Forum</h1>
            <Link href="/forum/new" className="btn">Start a thread</Link>
          </div>
          <p className="meta mt-2xs">
            What actually happened, not what a brochure promised. Posts are reviewed
            before they appear, and property advertising is not permitted.
          </p>

          {threads.length === 0 ? (
            <p className="mt-l text-ink-2">
              Nothing here yet.{" "}
              {account ? (
                <Link href="/forum/new">Post the first thread</Link>
              ) : (
                <><Link href="/signup">Create an account</Link> to post the first thread.</>
              )}
            </p>
          ) : (
            <ol className="mt-l m-0 list-none p-0">
              {threads.map((t) => (
                <li key={t.id} className="border-b border-rule py-m">
                  <Link href={`/forum/${t.slug}`} className="no-underline">
                    <h2 className="text-step-1 hover:underline decoration-1 underline-offset-4">
                      {t.title}
                    </h2>
                  </Link>
                  <p className="meta mt-2xs mb-0 flex flex-wrap items-center gap-x-xs">
                    <span className="pill">{t.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{t.authorName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatWhen(t.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}</span>
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <RailRight />
      </div>
    </div>
  );
}
