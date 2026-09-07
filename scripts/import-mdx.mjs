/**
 * One-off import of the MDX articles into the database.
 *
 * Safe to re-run: it upserts on slug and never overwrites a body that has been
 * edited since import, so it cannot clobber work done in the admin.
 *
 *   node scripts/import-mdx.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set."); process.exit(1); }
const sql = postgres(url, { max: 2 });

const DIR = path.join(process.cwd(), "content", "answers");
const files = (await readdir(DIR)).filter((f) => f.endsWith(".mdx"));

let created = 0, skipped = 0;
for (const file of files) {
  const slug = file.replace(/\.mdx?$/, "");
  const { data, content } = matter(await readFile(path.join(DIR, file), "utf8"));

  const [existing] = await sql`SELECT id, updated_at FROM article WHERE slug = ${slug}`;
  const frontUpdated = data.updated ? new Date(`${data.updated}T09:00:00Z`) : null;

  // Skip only when the row was revised in the admin AFTER the date the file
  // claims. Testing for any updated_at at all conflated "edited here" with
  // "the article simply carries an updated date", which silently dropped the
  // Updated badge from the trackers.
  if (existing?.updated_at && (!frontUpdated || existing.updated_at > frontUpdated)) {
    skipped++;
    continue;
  }

  const published = data.published ? new Date(`${data.published}T09:00:00Z`) : new Date();
  const values = {
    id: existing?.id ?? crypto.randomUUID(),
    slug,
    title: data.title ?? slug,
    dek: data.dek ?? "",
    body: content.trim(),
    topic: data.topic ?? "General",
    status: "published",
    meta_description: data.dek ?? null,
    source_note: data.sourceNote ?? null,
    published_at: published,
    updated_at: frontUpdated,
  };

  await sql`
    INSERT INTO article ${sql(values)}
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, dek = EXCLUDED.dek, body = EXCLUDED.body,
      topic = EXCLUDED.topic, status = EXCLUDED.status,
      meta_description = EXCLUDED.meta_description,
      source_note = EXCLUDED.source_note, published_at = EXCLUDED.published_at,
      updated_at = EXCLUDED.updated_at
  `;
  created++;
}

console.log(`imported ${created}, skipped ${skipped} already edited`);
await sql.end();
