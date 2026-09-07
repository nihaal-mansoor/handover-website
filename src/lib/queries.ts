import { and, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, dbEnabled } from "@/db";
import { comment, reply, thread, user, vote } from "@/db/schema";

/** Reads. Every public query filters on status = 'approved'. */

export async function getSession() {
  if (!dbEnabled) return null;
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  if (!db) return null;
  const s = await getSession();
  if (!s?.user) return null;
  try {
    const [row] = await db.select().from(user).where(eq(user.id, s.user.id)).limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

export async function isModerator() {
  const u = await getCurrentUser();
  return Boolean(u && (u.role === "moderator" || u.role === "admin"));
}

export interface PublicPost {
  readonly id: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly authorName: string;
  /** Needed to decide whether the viewer may delete this one. */
  readonly userId: string;
}

export async function approvedComments(articleSlug: string): Promise<PublicPost[]> {
  if (!db) return [];
  try {
  return await db
    .select({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      authorName: user.name,
      userId: comment.userId,
    })
    .from(comment)
    .innerJoin(user, eq(comment.userId, user.id))
    .where(and(eq(comment.articleSlug, articleSlug), eq(comment.status, "approved")))
    .orderBy(desc(comment.createdAt));
  } catch {
    return [];
  }
}

export type Sort = "best" | "top" | "new";

export function parseSort(v: string | undefined): Sort {
  return v === "top" || v === "new" ? v : "best";
}

/**
 * "Best" ranks by score but lets time pull a post down, so a good thread from
 * today outranks a slightly better one from last month. "Top" is score alone.
 * The half-life is a day, which suits a forum this size.
 */
const HOT = sql`(${thread.score} - extract(epoch from (now() - ${thread.createdAt})) / 86400.0)`;

export async function approvedThreads(sort: Sort = "best") {
  if (!db) return [];
  const order =
    sort === "new" ? desc(thread.createdAt)
    : sort === "top" ? desc(thread.score)
    : desc(HOT);
  return db
    .select({
      id: thread.id,
      slug: thread.slug,
      title: thread.title,
      body: thread.body,
      category: thread.category,
      replyCount: thread.replyCount,
      score: thread.score,
      deletedAt: thread.deletedAt,
      lastReplyAt: thread.lastReplyAt,
      createdAt: thread.createdAt,
      authorName: user.name,
    })
    .from(thread)
    .innerJoin(user, eq(thread.userId, user.id))
    .where(eq(thread.status, "approved"))
    .orderBy(order, desc(thread.createdAt))
    .limit(50);
}

export async function threadBySlug(slug: string) {
  if (!db) return null;
  const [row] = await db
    .select({
      id: thread.id,
      slug: thread.slug,
      title: thread.title,
      body: thread.body,
      category: thread.category,
      createdAt: thread.createdAt,
      score: thread.score,
      replyCount: thread.replyCount,
      deletedAt: thread.deletedAt,
      userId: thread.userId,
      authorName: user.name,
    })
    .from(thread)
    .innerJoin(user, eq(thread.userId, user.id))
    .where(and(eq(thread.slug, slug), eq(thread.status, "approved")))
    .limit(1);
  return row ?? null;
}

export interface ReplyNode {
  readonly id: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly authorName: string;
  readonly userId: string;
  readonly parentId: string | null;
  readonly score: number;
  readonly deletedAt: Date | null;
  readonly myVote: number;
  readonly children: ReplyNode[];
}

/**
 * The whole thread's replies in one query, assembled into a tree in memory.
 * A recursive SQL walk would cost a round trip per level; a thread is small
 * enough that sorting the flat rows here is cheaper and far easier to read.
 */
export async function replyTree(
  threadId: string,
  sort: Sort = "best",
  viewerId?: string,
): Promise<ReplyNode[]> {
  if (!db) return [];
  const rows = await db
    .select({
      id: reply.id,
      body: reply.body,
      createdAt: reply.createdAt,
      authorName: user.name,
      userId: reply.userId,
      parentId: reply.parentId,
      score: reply.score,
      deletedAt: reply.deletedAt,
      myVote: viewerId
        ? sql<number>`coalesce((select v.value from ${vote} v
             where v.target_type = 'reply' and v.target_id = ${reply.id}
               and v.user_id = ${viewerId}), 0)::int`
        : sql<number>`0::int`,
    })
    .from(reply)
    .innerJoin(user, eq(reply.userId, user.id))
    .where(and(eq(reply.threadId, threadId), eq(reply.status, "approved")));

  const byId = new Map<string, ReplyNode>();
  for (const r of rows) byId.set(r.id, { ...r, children: [] });

  const roots: ReplyNode[] = [];
  for (const node of byId.values()) {
    // A parent that was hard-deleted leaves its child at the top level rather
    // than dropping it out of the thread entirely.
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const cmp = (a: ReplyNode, b: ReplyNode) =>
    sort === "new"
      ? b.createdAt.getTime() - a.createdAt.getTime()
      : sort === "top"
        ? b.score - a.score || a.createdAt.getTime() - b.createdAt.getTime()
        : b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime();

  const sortTree = (nodes: ReplyNode[]) => {
    nodes.sort(cmp);
    nodes.forEach((n) => sortTree(n.children));
  };
  sortTree(roots);
  return roots;
}

/** Votes the viewer has already cast on these threads, for the arrow state. */
export async function myThreadVotes(ids: string[], viewerId?: string) {
  const out = new Map<string, number>();
  if (!db || !viewerId || ids.length === 0) return out;
  const rows = await db
    .select({ targetId: vote.targetId, value: vote.value })
    .from(vote)
    .where(and(
      eq(vote.userId, viewerId),
      eq(vote.targetType, "thread"),
      sql`${vote.targetId} = any(${ids})`,
    ));
  rows.forEach((r) => out.set(r.targetId, r.value));
  return out;
}

/** Author name plus the pending row, for the moderation queue. */
export async function queueWithAuthors() {
  if (!db || !(await isModerator())) return null;
  const [comments, threads, replies] = await Promise.all([
    db.select({ row: comment, authorName: user.name, authorEmail: user.email })
      .from(comment).innerJoin(user, eq(comment.userId, user.id))
      .where(eq(comment.status, "pending")).orderBy(desc(comment.createdAt)).limit(50),
    db.select({ row: thread, authorName: user.name, authorEmail: user.email })
      .from(thread).innerJoin(user, eq(thread.userId, user.id))
      .where(eq(thread.status, "pending")).orderBy(desc(thread.createdAt)).limit(50),
    db.select({ row: reply, authorName: user.name, authorEmail: user.email })
      .from(reply).innerJoin(user, eq(reply.userId, user.id))
      .where(eq(reply.status, "pending")).orderBy(desc(reply.createdAt)).limit(50),
  ]);
  return { comments, threads, replies };
}

export function formatWhen(d: Date): string {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}
