"use server";

import { revalidatePath, updateTag } from "next/cache";
import { ARTICLES_TAG } from "@/lib/content";
import { headers } from "next/headers";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { scanSubmission } from "@/lib/moderation";
import { db, dbEnabled } from "@/db";
import { article, comment, reply, subscriber, thread, user, vote } from "@/db/schema";

/**
 * Every write goes through here. The order is deliberate: identity, then shape,
 * then rate limit, then content scan, then store.
 *
 * A post that passes the scan is published immediately. The §1.1 and §1.2 rules
 * are still enforced on every submission, by the same scanners the build runs,
 * and anything they flag is stored rejected and never becomes readable. What
 * changed is that a clean post no longer waits for a human: the scanner is the
 * gate, and a moderator removes afterwards. That is a deliberate trade, because
 * the scanners match patterns and a carefully worded advertisement could get
 * through and be public until it is deleted.
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

const POSTED = "Posted.";

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
    status: g.scan.ok ? "approved" : "rejected",
    autoFlag: g.scan.flag ?? null,
    ipAddress: await clientIp(),
    ...(g.scan.ok ? {} : { moderatedAt: new Date(), moderatedBy: "auto" }),
  });

  revalidatePath(`/answers/${articleSlug}`);
  return g.scan.ok
    ? { ok: true, message: POSTED }
    : { ok: false, message: g.scan.message ?? "That post cannot be published." };
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

export interface PostImage {
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

/** Only ever our own blob host: a post must not be able to hotlink elsewhere. */
function safeImage(img?: PostImage | null): PostImage | null {
  if (!img?.url) return null;
  try {
    const u = new URL(img.url);
    if (u.protocol !== "https:") return null;
    if (!u.hostname.endsWith(".public.blob.vercel-storage.com")) return null;
  } catch {
    return null;
  }
  return {
    url: img.url,
    width: Math.max(1, Math.min(4000, Math.round(img.width || 1))),
    height: Math.max(1, Math.min(20000, Math.round(img.height || 1))),
  };
}

export async function createThread(
  title: string,
  body: string,
  category: string,
  image?: PostImage | null,
): Promise<ActionResult & { slug?: string }> {
  const t = titleSchema.safeParse(title);
  if (!t.success) return { ok: false, message: t.error.issues[0]?.message ?? "Invalid title." };

  const g = await guard(body);
  if ("error" in g && g.error) return { ok: false, message: g.error };
  if (!("account" in g) || !g.account || !g.scan) return { ok: false, message: "Something went wrong." };

  // Scan the title too. A listing in a title is still a listing.
  const titleScan = await scanSubmission(t.data);
  const ok = g.scan.ok && titleScan.ok;

  const slug = `${slugify(t.data)}-${Math.random().toString(36).slice(2, 7)}`;
  await db!.insert(thread).values({
    id: crypto.randomUUID(),
    slug,
    title: t.data,
    body: g.body,
    category,
    userId: g.account.id,
    ...(() => {
      const i = safeImage(image);
      return i ? { imageUrl: i.url, imageWidth: i.width, imageHeight: i.height } : {};
    })(),
    status: ok ? "approved" : "rejected",
    autoFlag: g.scan.flag ?? titleScan.flag ?? null,
    ipAddress: await clientIp(),
    ...(ok ? {} : { moderatedAt: new Date(), moderatedBy: "auto" }),
  });

  revalidatePath("/forum");
  // The slug goes back so the form can take the poster straight to the thread
  // they just created, rather than leaving them on an empty form.
  return ok
    ? { ok: true, message: POSTED, slug }
    : { ok: false, message: g.scan.message ?? titleScan.message ?? "That post cannot be published." };
}

export async function postReply(
  threadId: string,
  threadSlug: string,
  body: string,
  parentId?: string,
  image?: PostImage | null,
): Promise<ActionResult> {
  const g = await guard(body);
  if ("error" in g && g.error) return { ok: false, message: g.error };
  if (!("account" in g) || !g.account || !g.scan) return { ok: false, message: "Something went wrong." };

  // A reply nests under another reply only if that one really belongs to this
  // thread. Without the check, a crafted parent id would graft a comment onto a
  // conversation it was never part of.
  let parent: string | null = null;
  if (parentId) {
    const [row] = await db!
      .select({ id: reply.id })
      .from(reply)
      .where(and(eq(reply.id, parentId), eq(reply.threadId, threadId)))
      .limit(1);
    if (!row) return { ok: false, message: "That comment is no longer here." };
    parent = row.id;
  }

  await db!.insert(reply).values({
    id: crypto.randomUUID(),
    threadId,
    userId: g.account.id,
    body: g.body,
    parentId: parent,
    ...(() => {
      const i = safeImage(image);
      return i ? { imageUrl: i.url, imageWidth: i.width, imageHeight: i.height } : {};
    })(),
    status: g.scan.ok ? "approved" : "rejected",
    autoFlag: g.scan.flag ?? null,
    ipAddress: await clientIp(),
    ...(g.scan.ok ? {} : { moderatedAt: new Date(), moderatedBy: "auto" }),
  });

  // Counted at insert now that a clean reply is public straight away. Doing it
  // on approval left the count stuck at zero.
  if (g.scan.ok) {
    await db!
      .update(thread)
      .set({ replyCount: sql`${thread.replyCount} + 1`, lastReplyAt: new Date() })
      .where(eq(thread.id, threadId));
  }

  revalidatePath(`/forum/${threadSlug}`);
  return g.scan.ok
    ? { ok: true, message: POSTED }
    : { ok: false, message: g.scan.message ?? "That post cannot be published." };
}

/* ---------- votes ---------- */

/**
 * One vote per person per target. Voting the same way twice takes the vote back,
 * which is what the arrows do on Reddit. The denormalised score moves by the
 * difference so it never has to be recounted from the vote table.
 */
export async function castVote(
  targetType: "thread" | "reply",
  targetId: string,
  value: 1 | -1,
  revalidate: string,
): Promise<ActionResult> {
  if (!db) return { ok: false, message: "Voting is unavailable." };
  const account = await currentUser();
  if (!account) return { ok: false, message: "Sign in to vote." };
  if (account.bannedAt) return { ok: false, message: "This account cannot vote." };
  if (value !== 1 && value !== -1) return { ok: false, message: "Invalid vote." };

  const [existing] = await db
    .select()
    .from(vote)
    .where(and(
      eq(vote.userId, account.id),
      eq(vote.targetType, targetType),
      eq(vote.targetId, targetId),
    ))
    .limit(1);

  let delta: number = value;
  if (existing) {
    if (existing.value === value) {
      await db.delete(vote).where(eq(vote.id, existing.id));
      delta = -value;
    } else {
      await db.update(vote).set({ value }).where(eq(vote.id, existing.id));
      delta = value * 2;
    }
  } else {
    await db.insert(vote).values({
      id: crypto.randomUUID(),
      userId: account.id,
      targetType,
      targetId,
      value,
    });
  }

  if (targetType === "thread") {
    await db.update(thread).set({ score: sql`${thread.score} + ${delta}` }).where(eq(thread.id, targetId));
  } else {
    await db.update(reply).set({ score: sql`${reply.score} + ${delta}` }).where(eq(reply.id, targetId));
  }

  revalidatePath(revalidate);
  return { ok: true, message: "Voted." };
}

/* ---------- deleting your own post ---------- */

/**
 * The author may remove their own post, and a moderator may remove anyone's.
 *
 * A thread or a reply that has replies underneath it is blanked rather than
 * removed, so the conversation below it keeps its shape. A leaf is deleted
 * outright. This is how Reddit behaves and it is the reason `deletedAt` exists.
 */
export async function deletePost(
  kind: "comment" | "thread" | "reply",
  id: string,
): Promise<ActionResult> {
  if (!db) return { ok: false, message: "Database unavailable." };
  const account = await currentUser();
  if (!account) return { ok: false, message: "Sign in first." };
  const isMod = account.role === "moderator" || account.role === "admin";

  if (kind === "comment") {
    const [row] = await db.select().from(comment).where(eq(comment.id, id)).limit(1);
    if (!row) return { ok: false, message: "Already gone." };
    if (row.userId !== account.id && !isMod) return { ok: false, message: "Not permitted." };
    await db.delete(comment).where(eq(comment.id, id));
    revalidatePath(`/answers/${row.articleSlug}`);
    return { ok: true, message: "Deleted." };
  }

  if (kind === "reply") {
    const [row] = await db.select().from(reply).where(eq(reply.id, id)).limit(1);
    if (!row) return { ok: false, message: "Already gone." };
    if (row.userId !== account.id && !isMod) return { ok: false, message: "Not permitted." };

    const [child] = await db
      .select({ id: reply.id })
      .from(reply)
      .where(and(eq(reply.parentId, id), eq(reply.status, "approved")))
      .limit(1);

    if (child) {
      await db.update(reply).set({ deletedAt: new Date(), body: "" }).where(eq(reply.id, id));
    } else {
      await db.delete(reply).where(eq(reply.id, id));
    }
    if (row.status === "approved") {
      await db
        .update(thread)
        .set({ replyCount: sql`greatest(${thread.replyCount} - 1, 0)` })
        .where(eq(thread.id, row.threadId));
    }
    const [t] = await db.select({ slug: thread.slug }).from(thread).where(eq(thread.id, row.threadId)).limit(1);
    if (t) revalidatePath(`/forum/${t.slug}`);
    revalidatePath("/forum");
    return { ok: true, message: "Deleted." };
  }

  const [row] = await db.select().from(thread).where(eq(thread.id, id)).limit(1);
  if (!row) return { ok: false, message: "Already gone." };
  if (row.userId !== account.id && !isMod) return { ok: false, message: "Not permitted." };

  if (row.replyCount > 0) {
    await db.update(thread).set({ deletedAt: new Date(), body: "" }).where(eq(thread.id, id));
    revalidatePath(`/forum/${row.slug}`);
    revalidatePath("/forum");
    return { ok: true, message: "Deleted." };
  }
  await db.delete(thread).where(eq(thread.id, id));
  revalidatePath("/forum");
  return { ok: true, message: "Deleted." };
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
/** The wording shown above the field. Stored with each row (§4.4).
    Not exported: a "use server" module may only export async functions. */
const SUBSCRIBE_CONSENT =
  "New answers, when they go up. No more than one email a week.";

/**
 * Ten addresses an hour from one IP. The posting limit counts per account, but
 * subscribing needs none, so without this the table can be filled with other
 * people's addresses by anyone.
 */
async function subscribeRateLimited(ip: string | null): Promise<boolean> {
  if (!db || !ip) return false;
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(subscriber)
    .where(and(eq(subscriber.ipAddress, ip), sql`${subscriber.createdAt} > now() - interval '1 hour'`));
  return (row?.n ?? 0) >= 10;
}

export async function subscribe(
  email: string,
  sourcePage: string,
  /** Honeypot. A real person never fills a field they cannot see. */
  trap?: string,
  /** Milliseconds the form was on screen before submitting. */
  elapsedMs?: number,
): Promise<ActionResult> {
  if (!dbEnabled || !db) {
    return { ok: false, message: "Sign-up is temporarily unavailable. Please try again later." };
  }

  // Both bot checks answer exactly as a success would, so a script learns
  // nothing from the response about which layer stopped it.
  const DONE = { ok: true, message: "Thanks. Your email is on the list." };
  if (trap) return DONE;
  if (typeof elapsedMs === "number" && elapsedMs < 2000) return DONE;

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const ip = await clientIp();
  if (await subscribeRateLimited(ip)) {
    return { ok: false, message: "Too many sign-ups from here just now. Try again later." };
  }

  try {
    await db
      .insert(subscriber)
      .values({
        id: crypto.randomUUID(),
        email: parsed.data,
        sourcePage: sourcePage.slice(0, 300),
        consentText: SUBSCRIBE_CONSENT,
        ipAddress: ip,
      })
      // Already subscribed is not an error worth showing. Say the same thing
      // either way, which also avoids confirming whether an address is on the list.
      .onConflictDoNothing({ target: subscriber.email });
    return DONE;
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
  // The published list is cached for five minutes. updateTag, not
  // revalidateTag: inside a Server Action revalidateTag only marks the entry
  // stale, so the editor could still be shown the old copy on the way back.
  updateTag(ARTICLES_TAG);
  return { ok: true, message: input.status === "published" ? "Published." : "Saved as draft.", slug: slug.data };
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  if (!db) return { ok: false, message: "Database unavailable." };
  if (!(await requireModerator())) return { ok: false, message: "Not permitted." };
  await db.delete(article).where(eq(article.id, id));
  revalidatePath("/");
  revalidatePath("/admin/articles");
  updateTag(ARTICLES_TAG);
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
