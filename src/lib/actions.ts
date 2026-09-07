"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { scanSubmission } from "@/lib/moderation";
import { db, dbEnabled } from "@/db";
import { article, comment, reply, subscriber, thread, user } from "@/db/schema";

/**
 * Every write goes through here. The order is deliberate: identity, then shape,
 * then rate limit, then content scan, then store as pending.
 *
 * Nothing a reader writes is ever stored as approved. (CLAUDE.md §1.1)
 */

export interface ActionResult {
  readonly ok: boolean;
  readonly message: string;
}

const bodySchema = z
  .string()
  .trim()
  .min(15, "That is too short to be useful to anyone.")
  .max(5000, "That is longer than the limit of 5,000 characters.")
  .refine((v) => !/<[a-z/]/i.test(v), "Posts cannot contain HTML.");

const titleSchema = z
  .string()
  .trim()
  .min(10, "Give the thread a title people can recognise.")
  .max(140, "Titles are limited to 140 characters.")
  .refine((v) => !/<[a-z/]/i.test(v), "Titles cannot contain HTML.");

async function currentUser() {
  if (!db) return null;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const [row] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  return row ?? null;
}

async function clientIp(): Promise<string | null> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

/** Five posts an hour per account, counted across all three tables. */
async function overRateLimit(userId: string): Promise<boolean> {
  if (!db) return true;
  const since = sql`now() - interval '1 hour'`;
  const [c] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(comment)
    .where(and(eq(comment.userId, userId), sql`${comment.createdAt} > ${since}`));
  const [t] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(thread)
    .where(and(eq(thread.userId, userId), sql`${thread.createdAt} > ${since}`));
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reply)
    .where(and(eq(reply.userId, userId), sql`${reply.createdAt} > ${since}`));
  return (c?.n ?? 0) + (t?.n ?? 0) + (r?.n ?? 0) >= 5;
}

const PENDING =
  "Thanks. Your post is with a moderator and will appear once it is approved.";

async function guard(body: string) {
  if (!dbEnabled) {
    return { error: "Posting is temporarily unavailable. Please try again later." as const };
  }
  const account = await currentUser();
  if (!account) return { error: "You need to be signed in to post." as const };
  if (account.bannedAt) return { error: "This account cannot post." as const };

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "That post is not valid." };
  }
  if (await overRateLimit(account.id)) {
    return { error: "You have posted a few times in the last hour. Try again later." };
  }
  const scan = await scanSubmission(parsed.data);
  return { account, body: parsed.data, scan };
}

export async function postComment(
  articleSlug: string,
  body: string,
  parentId?: string,
): Promise<ActionResult> {
  const g = await guard(body);
  if ("error" in g && g.error) return { ok: false, message: g.error };
  if (!("account" in g) || !g.account || !g.scan) return { ok: false, message: "Something went wrong." };

  await db!.insert(comment).values({
    id: crypto.randomUUID(),
    articleSlug,
    userId: g.account.id,
    body: g.body,
    parentId: parentId ?? null,
    status: g.scan.ok ? "pending" : "rejected",
    autoFlag: g.scan.flag ?? null,
    ipAddress: await clientIp(),
    ...(g.scan.ok ? {} : { moderatedAt: new Date(), moderatedBy: "auto" }),
  });

  revalidatePath(`/answers/${articleSlug}`);
  return g.scan.ok
    ? { ok: true, message: PENDING }
    : { ok: false, message: g.scan.message ?? "That post cannot be published." };
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

export async function createThread(
  title: string,
  body: string,
  category: string,
): Promise<ActionResult> {
  const t = titleSchema.safeParse(title);
  if (!t.success) return { ok: false, message: t.error.issues[0]?.message ?? "Invalid title." };

  const g = await guard(body);
  if ("error" in g && g.error) return { ok: false, message: g.error };
  if (!("account" in g) || !g.account || !g.scan) return { ok: false, message: "Something went wrong." };

  // Scan the title too. A listing in a title is still a listing.
  const titleScan = await scanSubmission(t.data);
  const ok = g.scan.ok && titleScan.ok;

  await db!.insert(thread).values({
    id: crypto.randomUUID(),
    slug: `${slugify(t.data)}-${Math.random().toString(36).slice(2, 7)}`,
    title: t.data,
    body: g.body,
    category,
    userId: g.account.id,
    status: ok ? "pending" : "rejected",
    autoFlag: g.scan.flag ?? titleScan.flag ?? null,
    ipAddress: await clientIp(),
    ...(ok ? {} : { moderatedAt: new Date(), moderatedBy: "auto" }),
  });

  revalidatePath("/forum");
  return ok
    ? { ok: true, message: PENDING }
    : { ok: false, message: g.scan.message ?? titleScan.message ?? "That post cannot be published." };
}

export async function postReply(
  threadId: string,
  threadSlug: string,
  body: string,
): Promise<ActionResult> {
  const g = await guard(body);
  if ("error" in g && g.error) return { ok: false, message: g.error };
  if (!("account" in g) || !g.account || !g.scan) return { ok: false, message: "Something went wrong." };

  await db!.insert(reply).values({
    id: crypto.randomUUID(),
    threadId,
    userId: g.account.id,
    body: g.body,
    status: g.scan.ok ? "pending" : "rejected",
    autoFlag: g.scan.flag ?? null,
    ipAddress: await clientIp(),
    ...(g.scan.ok ? {} : { moderatedAt: new Date(), moderatedBy: "auto" }),
  });

  revalidatePath(`/forum/${threadSlug}`);
  return g.scan.ok
    ? { ok: true, message: PENDING }
    : { ok: false, message: g.scan.message ?? "That post cannot be published." };
}

/* ---------- moderation ---------- */

async function requireModerator() {
  const account = await currentUser();
  if (!account || (account.role !== "moderator" && account.role !== "admin")) return null;
  return account;
}

export async function moderate(
  kind: "comment" | "thread" | "reply",
  id: string,
  decision: "approved" | "rejected",
): Promise<ActionResult> {
  if (!db) return { ok: false, message: "Database unavailable." };
  const mod = await requireModerator();
  if (!mod) return { ok: false, message: "Not permitted." };

  const patch = { status: decision, moderatedAt: new Date(), moderatedBy: mod.id };

  if (kind === "comment") await db.update(comment).set(patch).where(eq(comment.id, id));
  if (kind === "reply") {
    await db.update(reply).set(patch).where(eq(reply.id, id));
    if (decision === "approved") {
      const [row] = await db.select().from(reply).where(eq(reply.id, id)).limit(1);
      if (row) {
        await db
          .update(thread)
          .set({ replyCount: sql`${thread.replyCount} + 1`, lastReplyAt: new Date() })
          .where(eq(thread.id, row.threadId));
      }
    }
  }
  if (kind === "thread") {
    await db.update(thread).set({ ...patch, lastReplyAt: new Date() }).where(eq(thread.id, id));
  }

  revalidatePath("/admin");
  revalidatePath("/forum");
  return { ok: true, message: decision === "approved" ? "Published." : "Rejected." };
}

export async function pendingQueue() {
  if (!db || !(await requireModerator())) return null;
  const [comments, threads, replies] = await Promise.all([
    db.select().from(comment).where(eq(comment.status, "pending")).orderBy(desc(comment.createdAt)).limit(50),
    db.select().from(thread).where(eq(thread.status, "pending")).orderBy(desc(thread.createdAt)).limit(50),
    db.select().from(reply).where(eq(reply.status, "pending")).orderBy(desc(reply.createdAt)).limit(50),
  ]);
  return { comments, threads, replies };
}

/* ---------- newsletter ---------- */

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .email("Enter a valid email address.");

/**
 * Newsletter signup. Deliberately the lightest write on the site: no account,
 * no moderation, one field. The goal at this stage is reach, not leads.
 */
export async function subscribe(email: string, sourcePage: string): Promise<ActionResult> {
  if (!dbEnabled || !db) {
    return { ok: false, message: "Sign-up is temporarily unavailable. Please try again later." };
  }

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  try {
    await db
      .insert(subscriber)
      .values({
        id: crypto.randomUUID(),
        email: parsed.data,
        sourcePage: sourcePage.slice(0, 300),
        ipAddress: await clientIp(),
      })
      // Already subscribed is not an error worth showing. Say the same thing
      // either way, which also avoids confirming whether an address is on the list.
      .onConflictDoNothing({ target: subscriber.email });
    return { ok: true, message: "Thanks. You will get an email when something new goes up." };
  } catch (err) {
    console.error("[subscribe] failed:", err instanceof Error ? err.message : err);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

/* ---------- article editing ---------- */

const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(90)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.");

export interface ArticleInput {
  id?: string;
  slug: string;
  title: string;
  dek: string;
  body: string;
  topic: string;
  status: "draft" | "published";
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  focusKeyword?: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  sourceNote?: string;
}

export async function saveArticle(input: ArticleInput): Promise<ActionResult & { slug?: string }> {
  if (!db) return { ok: false, message: "Database unavailable." };
  const mod = await requireModerator();
  if (!mod) return { ok: false, message: "Not permitted." };

  const slug = slugSchema.safeParse(input.slug);
  if (!slug.success) return { ok: false, message: slug.error.issues[0]?.message ?? "Invalid slug." };
  if (!input.title.trim()) return { ok: false, message: "A title is required." };

  const now = new Date();
  const values = {
    slug: slug.data,
    title: input.title.trim(),
    dek: input.dek.trim(),
    body: input.body,
    topic: input.topic.trim() || "General",
    status: input.status,
    metaTitle: input.metaTitle?.trim() || null,
    metaDescription: input.metaDescription?.trim() || null,
    canonicalUrl: input.canonicalUrl?.trim() || null,
    noindex: Boolean(input.noindex),
    focusKeyword: input.focusKeyword?.trim() || null,
    featuredImageUrl: input.featuredImageUrl?.trim() || null,
    featuredImageAlt: input.featuredImageAlt?.trim() || null,
    sourceNote: input.sourceNote?.trim() || null,
    authorId: mod.id,
    updatedAt: now,
  };

  try {
    if (input.id) {
      const [existing] = await db.select().from(article).where(eq(article.id, input.id)).limit(1);
      await db
        .update(article)
        .set({
          ...values,
          // Stamp the publish date the first time it actually goes live.
          publishedAt:
            input.status === "published" ? existing?.publishedAt ?? now : existing?.publishedAt ?? null,
        })
        .where(eq(article.id, input.id));
    } else {
      await db.insert(article).values({
        id: crypto.randomUUID(),
        ...values,
        publishedAt: input.status === "published" ? now : null,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/unique|duplicate/i.test(msg)) return { ok: false, message: "That slug is already taken." };
    console.error("[saveArticle]", msg);
    return { ok: false, message: "Could not save." };
  }

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/answers/${slug.data}`);
  revalidatePath("/admin/articles");
  return { ok: true, message: input.status === "published" ? "Published." : "Saved as draft.", slug: slug.data };
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  if (!db) return { ok: false, message: "Database unavailable." };
  if (!(await requireModerator())) return { ok: false, message: "Not permitted." };
  await db.delete(article).where(eq(article.id, id));
  revalidatePath("/");
  revalidatePath("/admin/articles");
  return { ok: true, message: "Deleted." };
}

export async function listArticles() {
  if (!db || !(await requireModerator())) return null;
  return db.select().from(article).orderBy(desc(article.updatedAt), desc(article.createdAt));
}

export async function getArticleForEdit(id: string) {
  if (!db || !(await requireModerator())) return null;
  const [row] = await db.select().from(article).where(eq(article.id, id)).limit(1);
  return row ?? null;
}
