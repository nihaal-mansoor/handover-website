import type { Metadata } from "next";
import Link from "next/link";
import {
  approvedThreads, getCurrentUser, formatWhen, parseSort, myThreadVotes,
} from "@/lib/queries";
import { VoteBox } from "@/components/VoteBox";
import { SignInLink } from "@/components/SignInLink";
import { RailLeft } from "@/components/RailLeft";
import { RailRight } from "@/components/RailRight";

export const metadata: Metadata = {
  title: "Forum",
  description:
    "What actually happened: handover delays, service charges, transfers and the rest, from people who went through it.",
  alternates: { canonical: "/forum" },
};

export const dynamic = "force-dynamic";

const SORTS = [["best", "Best"], ["top", "Top"], ["new", "New"]] as const;

export default async function ForumPage({
  searchParams,
}: { searchParams: Promise<{ sort?: string }> }) {
  const sort = parseSort((await searchParams).sort);
  const [threads, account] = await Promise.all([approvedThreads(sort), getCurrentUser()]);
  const votes = await myThreadVotes(threads.map((t) => t.id), account?.id);

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
            What actually happened, not what a brochure promised. Property
            advertising is not permitted.
          </p>

          <nav className="sort-tabs mt-m" aria-label="Sort threads">
            {SORTS.map(([key, label]) => (
              <Link
                key={key}
                href={key === "best" ? "/forum" : `/forum?sort=${key}`}
                className="sort-tab"
                aria-current={sort === key ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          {threads.length === 0 ? (
            <p className="mt-l text-ink-2">
              Nothing here yet.{" "}
              {account ? (
                <Link href="/forum/new">Post the first thread</Link>
              ) : (
                <><SignInLink route="/signup">Create an account</SignInLink> to post the first thread.</>
              )}
            </p>
          ) : (
            <ol className="mt-l m-0 list-none p-0">
              {threads.map((t) => (
                <li key={t.id} className="border-b border-rule py-m">
                  <div className="post-head">
                    <VoteBox
                      targetType="thread"
                      targetId={t.id}
                      score={t.score}
                      myVote={votes.get(t.id) ?? 0}
                      revalidate="/forum"
                      signedIn={Boolean(account)}
                    />
                    <div className="min-w-0">
                      <Link href={`/forum/${t.slug}`} className="no-underline">
                        <h2 className="text-step-1 hover:underline decoration-1 underline-offset-4">
                          {t.deletedAt ? "[deleted]" : t.title}
                        </h2>
                      </Link>
                      <p className="meta mt-2xs mb-0 flex flex-wrap items-center gap-x-xs">
                        <span className="pill">{t.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{t.deletedAt ? "[deleted]" : t.authorName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatWhen(t.createdAt)}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {t.replyCount} {t.replyCount === 1 ? "comment" : "comments"}
                        </span>
                      </p>
                    </div>
                  </div>
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
