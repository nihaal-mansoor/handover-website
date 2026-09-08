import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  threadBySlug, replyTree, getCurrentUser, formatWhen, initials, parseSort, CATEGORIES,
} from "@/lib/queries";
import { db } from "@/db";
import { vote } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { VoteBox } from "@/components/VoteBox";
import { DeleteButton } from "@/components/DeleteButton";
import { ReplyForm } from "@/components/ReplyForm";
import { CommentTree } from "@/components/CommentTree";
import { renderPost } from "@/lib/markdown";
import { PostImage } from "@/components/PostImage";
import { RailDiscussions } from "@/components/RailDiscussions";
import { DiscussionsAbout } from "@/components/DiscussionsAbout";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await threadBySlug(slug);
  if (!t) return {};
  return {
    title: t.title,
    description: t.body.slice(0, 155),
    alternates: { canonical: `/forum/${slug}` },
  };
}

const SORTS = [
  ["best", "Best"],
  ["top", "Top"],
  ["new", "New"],
] as const;

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const t = await threadBySlug(slug);
  if (!t) notFound();

  const sort = parseSort((await searchParams).sort);
  const account = await getCurrentUser();

  const [replies, myVote] = await Promise.all([
    replyTree(t.id, sort, account?.id),
    (async () => {
      if (!db || !account) return 0;
      const [row] = await db
        .select({ value: vote.value })
        .from(vote)
        .where(and(
          eq(vote.userId, account.id),
          eq(vote.targetType, "thread"),
          eq(vote.targetId, t.id),
        ))
        .limit(1);
      return row?.value ?? 0;
    })(),
  ]);

  const isModerator = account?.role === "moderator" || account?.role === "admin";
  const mine = account?.id === t.userId;
  const removed = Boolean(t.deletedAt);

  return (
    <div className="shell">
      <div className="app-grid">
        <RailDiscussions current={t.category} />

        <article className="feed thread-col">
      <p className="meta"><Link href="/forum">Discussions</Link> ·{" "}
        <Link href={`/forum?category=${t.category}`}>
          {CATEGORIES.find(([k]) => k === t.category)?.[1] ?? t.category}
        </Link></p>

      <div className="post-head">
        <VoteBox
          targetType="thread"
          targetId={t.id}
          score={t.score}
          myVote={myVote}
          revalidate={`/forum/${slug}`}
          signedIn={Boolean(account)}
        />

        <div className="min-w-0">
          <h1 className="text-step-3">{t.title}</h1>

          <div className="mt-s flex items-center gap-s">
            <span className="avatar" aria-hidden="true">{initials(t.authorName)}</span>
            <p className="meta m-0">
              <span className="text-ink">{removed ? "[deleted]" : t.authorName}</span>
              <br />
              <time dateTime={new Date(t.createdAt).toISOString()}>{formatWhen(t.createdAt)}</time>
            </p>
          </div>

          {removed ? (
            <p className="cmt-removed mt-m">Post removed by its author.</p>
          ) : (
            <>
              {t.body.trim() && (
                <div
                  className="post-body mt-m"
                  dangerouslySetInnerHTML={{ __html: renderPost(t.body) }}
                />
              )}
              <PostImage
                url={t.imageUrl}
                width={t.imageWidth}
                height={t.imageHeight}
                alt={`Image posted with ${t.title}`}
              />
            </>
          )}

          {(mine || isModerator) && !removed && (
            <div className="cmt-actions mt-m">
              <DeleteButton kind="thread" id={t.id} redirectTo="/forum" />
            </div>
          )}
        </div>
      </div>

      <section className="mt-l border-t border-rule pt-m">
        <ReplyForm
          threadId={t.id}
          threadSlug={slug}
          signedIn={Boolean(account)}
          compact={false}
          placeholder="What is your experience? Concrete detail is more useful than opinion."
        />
      </section>

      <section className="mt-l">
        <div className="sort-bar">
          <h2 className="text-step-1 m-0">
            {t.replyCount === 0
              ? "No comments yet"
              : `${t.replyCount} ${t.replyCount === 1 ? "comment" : "comments"}`}
          </h2>
          {replies.length > 1 && (
            <nav className="sort-tabs" aria-label="Sort comments">
              {SORTS.map(([key, label]) => (
                <Link
                  key={key}
                  href={key === "best" ? `/forum/${slug}` : `/forum/${slug}?sort=${key}`}
                  className="sort-tab"
                  aria-current={sort === key ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="mt-m">
          <CommentTree
            nodes={replies}
            threadId={t.id}
            threadSlug={slug}
            viewerId={account?.id ?? null}
            isModerator={isModerator}
          />
        </div>
        </section>
        </article>

        <DiscussionsAbout />
      </div>
    </div>
  );
}
