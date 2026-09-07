import {
  pgTable, text, timestamp, boolean, integer, index, uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Two groups of tables.
 *
 *  - Auth tables (user, session, account, verification) have the shape
 *    better-auth expects. Do not rename their columns.
 *  - Domain tables (comment, thread, reply) are ours.
 *
 * Everything a reader writes carries a `status`. Nothing is visible until a
 * moderator approves it. (CLAUDE.md §1.1 — an unpermitted listing must never be
 * publicly readable, even briefly.)
 */

/* ---------- auth ---------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** user | moderator | admin. Role-aware from the start so adding moderators is config, not a migration. */
  role: text("role").notNull().default("user"),
  /** Set once someone has a clean history, to let them skip the queue later. */
  trusted: boolean("trusted").notNull().default(false),
  bannedAt: timestamp("banned_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    /** Required by better-auth 1.7+. Older CLI versions do not emit it. */
    issuer: text("issuer"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    /** Hashed by better-auth. Never plaintext. */
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ---------- moderation ---------- */

/** pending → approved | rejected. Nothing is public while pending. */
export type ModerationStatus = "pending" | "approved" | "rejected";

/* ---------- comments ---------- */

export const comment = pgTable(
  "comment",
  {
    id: text("id").primaryKey(),
    /** Slug of the MDX article. Not a foreign key: articles live in the repo. */
    articleSlug: text("article_slug").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    parentId: text("parent_id"),
    status: text("status").notNull().default("pending"),
    /** Which scanner rejected it, when auto-rejected. For the moderator's benefit. */
    autoFlag: text("auto_flag"),
    moderatedAt: timestamp("moderated_at"),
    moderatedBy: text("moderated_by"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("comment_article_idx").on(t.articleSlug, t.status),
    index("comment_status_idx").on(t.status, t.createdAt),
  ],
);

/* ---------- forum ---------- */

export const thread = pgTable(
  "thread",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    category: text("category").notNull().default("general"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    autoFlag: text("auto_flag"),
    moderatedAt: timestamp("moderated_at"),
    moderatedBy: text("moderated_by"),
    ipAddress: text("ip_address"),
    replyCount: integer("reply_count").notNull().default(0),
    lastReplyAt: timestamp("last_reply_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("thread_slug_idx").on(t.slug),
    index("thread_status_idx").on(t.status, t.lastReplyAt),
  ],
);

export const reply = pgTable(
  "reply",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id").notNull().references(() => thread.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    status: text("status").notNull().default("pending"),
    autoFlag: text("auto_flag"),
    moderatedAt: timestamp("moderated_at"),
    moderatedBy: text("moderated_by"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("reply_thread_idx").on(t.threadId, t.status),
    index("reply_status_idx").on(t.status, t.createdAt),
  ],
);

/* ---------- newsletter ---------- */

export const subscriber = pgTable(
  "subscriber",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    /** Which page they subscribed from, so we know what earns signups. */
    sourcePage: text("source_page"),
    /** Set when they click the unsubscribe link. Rows are kept, not deleted. */
    unsubscribedAt: timestamp("unsubscribed_at"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("subscriber_created_idx").on(t.createdAt)],
);
