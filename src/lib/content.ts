import { cache } from "react";
import { unstable_cache } from "next/cache";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { article as articleTable } from "@/db/schema";
import { readingMinutes } from "@/lib/markdown";

/**
 * Articles are MDX files in /content/answers.
 *
 * Authored by us, version controlled, rendered statically. User-generated
 * content (comments, forum) lives in Postgres instead — the split is by who
 * writes it, which keeps the fast path fast.
 */

const DIR = path.join(process.cwd(), "content", "answers");

export interface Article {
  /** Where this came from. DB articles are editable in the admin. */
  readonly source?: "db" | "mdx";
  /** Markdown body, present only on DB articles. */
  readonly body?: string;
  readonly metaTitle?: string;
  readonly metaDescription?: string;
  readonly canonicalUrl?: string;
  readonly noindex?: boolean;
  readonly featuredImageUrl?: string;
  readonly ogImageUrl?: string;
  readonly featuredImageAlt?: string;
  readonly slug: string;
  /** The question, as someone would actually ask it. */
  readonly title: string;
  /** One sentence under the title. Medium calls this the subtitle. */
  readonly dek: string;
  readonly topic: string;
  readonly published: string;
  readonly updated?: string;
  readonly minutes: number;
  readonly words: number;
  /** Where the question came from, for our own reference. Never rendered. */
  readonly sourceNote?: string;
}

function parse(file: string): Article {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  const required = ["title", "dek", "topic", "published"] as const;
  for (const key of required) {
    if (!data[key]) throw new Error(`${file}: frontmatter is missing "${key}"`);
  }

  return {
    slug: file.replace(/\.mdx?$/, ""),
    title: String(data["title"]),
    dek: String(data["dek"]),
    topic: String(data["topic"]),
    published: String(data["published"]),
    ...(data["updated"] ? { updated: String(data["updated"]) } : {}),
    minutes: Math.max(1, Math.round(stats.minutes)),
    words: stats.words,
    ...(data["sourceNote"] ? { sourceNote: String(data["sourceNote"]) } : {}),
  };
}

function fromRow(r: typeof articleTable.$inferSelect): Article {
  return {
    source: "db" as const,
    slug: r.slug,
    title: r.title,
    dek: r.dek,
    topic: r.topic,
    body: r.body,
    published: (r.publishedAt ?? r.createdAt).toISOString().slice(0, 10),
    ...(r.updatedAt ? { updated: r.updatedAt.toISOString().slice(0, 10) } : {}),
    minutes: readingMinutes(r.body),
    words: r.body.trim().split(/\s+/).length,
    ...(r.sourceNote ? { sourceNote: r.sourceNote } : {}),
    ...(r.metaTitle ? { metaTitle: r.metaTitle } : {}),
    ...(r.metaDescription ? { metaDescription: r.metaDescription } : {}),
    ...(r.canonicalUrl ? { canonicalUrl: r.canonicalUrl } : {}),
    noindex: r.noindex,
    ...(r.featuredImageUrl ? { featuredImageUrl: r.featuredImageUrl } : {}),
    ...(r.ogImageUrl ? { ogImageUrl: r.ogImageUrl } : {}),
    ...(r.featuredImageAlt ? { featuredImageAlt: r.featuredImageAlt } : {}),
  };
}

/**
 * Published articles, database first.
 *
 * MDX in the repo is the fallback so the site keeps working wherever there is
 * no database, which today includes production. Once a slug exists in the
 * database it wins, so an imported article is edited in one place only.
 */
/**
 * The tag every article read is filed under. Writing an article revalidates it,
 * so an edit in the admin is live immediately rather than after the window.
 */
export const ARTICLES_TAG = "articles";

/**
 * Cross-request cache. Every page on the site reads this list, and the database
 * is a round trip away, so without it each visitor pays for a query returning
 * exactly what the last visitor already fetched.
 *
 * fromRow runs inside the cache, so what is stored is plain strings and numbers.
 * Caching the raw rows would put Date objects through JSON and hand back strings
 * on a hit and Dates on a miss.
 */
const cachedPublished = unstable_cache(
  async (): Promise<Article[]> => {
    if (!db) return [];
    try {
      const rows = await db
        .select()
        .from(articleTable)
        .where(eq(articleTable.status, "published"))
        .orderBy(desc(articleTable.publishedAt));
      return rows.map(fromRow);
    } catch {
      return [];
    }
  },
  ["articles:published:v1"],
  { revalidate: 300, tags: [ARTICLES_TAG] },
);

/**
 * Within-request cache. A single page render asks for this four to six times:
 * once for the page, once in the left rail, twice in the right rail. React's
 * cache collapses those into one call for the life of the render.
 */
export const allArticlesAsync = cache(async (): Promise<Article[]> => {
  const mdx = allArticlesFromMdx();
  const fromDb = await cachedPublished();
  if (fromDb.length === 0) return mdx;
  const seen = new Set(fromDb.map((a) => a.slug));
  return [...fromDb, ...mdx.filter((a) => !seen.has(a.slug))].sort((a, b) =>
    (b.updated ?? b.published).localeCompare(a.updated ?? a.published),
  );
});

/** Derived from the cached list, so an article page makes no query of its own. */
export const getArticleAsync = cache(async (slug: string): Promise<Article | undefined> => {
  const all = await allArticlesAsync();
  return all.find((a) => a.slug === slug);
});

export const allTopicsAsync = cache(async (): Promise<Topic[]> => {
  const counts = new Map<string, number>();
  for (const a of await allArticlesAsync()) counts.set(a.topic, (counts.get(a.topic) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: topicSlug(name), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
});

export const articlesByTopicAsync = cache(async (slug: string): Promise<Article[]> =>
  (await allArticlesAsync()).filter((a) => topicSlug(a.topic) === slug));

export function allArticlesFromMdx(): Article[] {
  if (!fs.existsSync(DIR)) {
    console.error(
      `[content] ${DIR} is missing. MDX articles will not render. ` +
      "Check outputFileTracingIncludes in next.config.mjs.",
    );
    return [];
  }
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(parse)
    // A tracker that has just been refreshed should surface again, so order by
    // whichever of published/updated is the more recent.
    .sort((a, b) => (b.updated ?? b.published).localeCompare(a.updated ?? a.published));
}

export const allArticles = allArticlesFromMdx;

export function articleSlugs(): string[] {
  return allArticlesFromMdx().map((a) => a.slug);
}

export function getArticle(slug: string): Article | undefined {
  return allArticles().find((a) => a.slug === slug);
}

export interface Topic {
  readonly name: string;
  readonly slug: string;
  readonly count: number;
}

export function topicSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function allTopics(): Topic[] {
  const counts = new Map<string, number>();
  for (const a of allArticles()) counts.set(a.topic, (counts.get(a.topic) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: topicSlug(name), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function articlesByTopic(slug: string): Article[] {
  return allArticles().filter((a) => topicSlug(a.topic) === slug);
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
