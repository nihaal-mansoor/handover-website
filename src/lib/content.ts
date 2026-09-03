import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

/**
 * Articles are MDX files in /content/answers.
 *
 * Authored by us, version controlled, rendered statically. User-generated
 * content (comments, forum) lives in Postgres instead — the split is by who
 * writes it, which keeps the fast path fast.
 */

const DIR = path.join(process.cwd(), "content", "answers");

export interface Article {
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

export function allArticles(): Article[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(parse)
    .sort((a, b) => b.published.localeCompare(a.published));
}

export function articleSlugs(): string[] {
  return allArticles().map((a) => a.slug);
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
