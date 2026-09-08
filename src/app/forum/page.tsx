import type { Metadata } from "next";
import Link from "next/link";
import {
  approvedThreads, getCurrentUser, formatWhen, parseSort, myThreadVotes,
  parseCategory, CATEGORIES,
} from "@/lib/queries";
import { VoteBox } from "@/components/VoteBox";
import { SignInLink } from "@/components/SignInLink";
import { RailDiscussions } from "@/components/RailDiscussions";
import { DiscussionsAbout } from "@/components/DiscussionsAbout";

export const metadata: Metadata = {
  title: "Discussions",
  description:
    "What actually happened: handover delays, service charges, transfers and the rest, from people who went through it.",
  alternates: { canonical: "/forum" },
};

export const dynamic = "force-dynamic";

const SORTS = [["best", "Best"], ["top", "Top"], ["new", "New"]] as const;

export default async function ForumPage({
  searchParams,
}: { searchParams: Promise<{ sort?: string; category?: string }> }) {
  const params = await searchParams;
  const sort = parseSort(params.sort);
  const category = parseCategory(params.category);
  const [threads, account] = await Promise.all([
    approvedThreads(sort, category),
    getCurrentUser(),
  ]);
  const votes = await myThreadVotes(threads.map((t) => t.id), account?.id);
  const categoryLabel = CATEGORIES.find(([k]) => k === category)?.[1];
  // Sorting has to keep the filter, or changing sort silently drops it.
  const sortHref = (key: string) => {
    const q = new URLSearchParams();
    if (key !== "best") q.set("sort", key);
    if (category) q.set("category", category);
    const s = q.toString();
    return s ? `/forum?${s}` : "/forum";
  };

  return (
    <div className="shell">
      <div className="app-grid">
        <RailDiscussions current={category} />

        <div className="feed">
          <div className="flex flex-wrap items-center justify-between gap-s">
            <h1 className="text-step-3">{categoryLabel ?? "Discussions"}</h1>
            <Link href="/forum/new" className="btn">Start a discussion</Link>
          </div>
          <p className="meta mt-2xs">
            What actually happened, not what a brochure promised. Property
            advertising is not permitted.
          </p>

          {/* The rail carries the categories from 60rem up, where it is visible.
              Below that it is display:none, which left a phone with no way to
              filter at all, so the same links appear here as a scrolling row. */}
          <nav className="cat-bar mt-m" aria-label="Filter by category">
            <Link
              href={sort === "best" ? "/forum" : `/forum?sort=${sort}`}
              className="sort-tab"
              {...(!category ? { "aria-current": "page" as const } : {})}
            >
              Everything
            </Link>
            {CATEGORIES.map(([key, label]) => {
              const q = new URLSearchParams({ category: key });
              if (sort !== "best") q.set("sort", sort);
              return (
                <Link
                  key={key}
                  href={`/forum?${q.toString()}`}
                  className="sort-tab"
                  {...(category === key ? { "aria-current": "page" as const } : {})}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <nav className="sort-tabs mt-m" aria-label="Sort discussions">
            {SORTS.map(([key, label]) => (
              <Link
                key={key}
                href={sortHref(key)}
                className="sort-tab"
                aria-current={sort === key ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          {threads.length === 0 ? (
            <p className="mt-l text-ink-2">
              {category ? `Nothing in ${categoryLabel} yet.` : "Nothing here yet."}{" "}
              {account ? (
                <Link href="/forum/new">Start the first discussion</Link>
              ) : (
                <><SignInLink route="/signup">Create an account</SignInLink> to start the first discussion.</>
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
                    {t.imageUrl && !t.deletedAt && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={t.imageUrl}
                        alt=""
                        width={t.imageWidth ?? 176}
                        height={t.imageHeight ?? 128}
                        className="row-thumb"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="min-w-0">
                      <Link href={`/forum/${t.slug}`} className="no-underline">
                        <h2 className="text-step-1 hover:underline decoration-1 underline-offset-4">
                          {t.deletedAt ? "[deleted]" : t.title}
                        </h2>
                      </Link>
                      <p className="meta mt-2xs mb-0 flex flex-wrap items-center gap-x-xs">
                        <span className="pill">{CATEGORIES.find(([k]) => k === t.category)?.[1] ?? t.category}</span>
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

        <DiscussionsAbout />
      </div>
    </div>
  );
}
