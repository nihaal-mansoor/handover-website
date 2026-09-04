import { and, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { comment, reply, thread, user } from "@/db/schema";

/** Reads. Every public query filters on status = 'approved'. */

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getCurrentUser() {
  const s = await getSession();
  if (!s?.user) return null;
  const [row] = await db.select().from(user).where(eq(user.id, s.user.id)).limit(1);
  return row ?? null;
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
}

export async function approvedComments(articleSlug: string): Promise<PublicPost[]> {
  return db
    .select({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      authorName: user.name,
    })
    .from(comment)
    .innerJoin(user, eq(comment.userId, user.id))
    .where(and(eq(comment.articleSlug, articleSlug), eq(comment.status, "approved")))
    .orderBy(desc(comment.createdAt));
}

export async function approvedThreads() {
  return db
    .select({
      id: thread.id,
      slug: thread.slug,
      title: thread.title,
      body: thread.body,
      category: thread.category,
      replyCount: thread.replyCount,
      lastReplyAt: thread.lastReplyAt,
      createdAt: thread.createdAt,
      authorName: user.name,
    })
    .from(thread)
    .innerJoin(user, eq(thread.userId, user.id))
    .where(eq(thread.status, "approved"))
    .orderBy(desc(sql`coalesce(${thread.lastReplyAt}, ${thread.createdAt})`))
    .limit(50);
}

export async function threadBySlug(slug: string) {
  const [row] = await db
    .select({
      id: thread.id,
      slug: thread.slug,
      title: thread.title,
      body: thread.body,
      category: thread.category,
      createdAt: thread.createdAt,
      authorName: user.name,
    })
    .from(thread)
    .innerJoin(user, eq(thread.userId, user.id))
    .where(and(eq(thread.slug, slug), eq(thread.status, "approved")))
    .limit(1);
  return row ?? null;
}

export async function approvedReplies(threadId: string): Promise<PublicPost[]> {
  return db
    .select({
      id: reply.id,
      body: reply.body,
      createdAt: reply.createdAt,
      authorName: user.name,
    })
    .from(reply)
    .innerJoin(user, eq(reply.userId, user.id))
    .where(and(eq(reply.threadId, threadId), eq(reply.status, "approved")))
    .orderBy(reply.createdAt);
}

/** Author name plus the pending row, for the moderation queue. */
export async function queueWithAuthors() {
  if (!(await isModerator())) return null;
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
