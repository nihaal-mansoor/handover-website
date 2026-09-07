import type { Metadata } from "next";
import Link from "next/link";
import { allArticlesAsync } from "@/lib/content";
import { ArticleCard } from "@/components/ArticleCard";
import { RailLeft } from "@/components/RailLeft";
import { RailRight } from "@/components/RailRight";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

/** Server-side filter over titles, deks and topics. Works without JavaScript. */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const results = query
    ? (await allArticlesAsync()).filter((a) =>
        [a.title, a.dek, a.topic].some((f) => f.toLowerCase().includes(query)),
      )
    : [];

  return (
    <div className="shell">
      <div className="app-grid">
        <RailLeft />
        <div className="feed">
          <h1 className="text-step-2">
            {query ? `Results for “${q}”` : "Search"}
          </h1>
          <p className="meta mt-2xs">
            {query
              ? `${results.length} ${results.length === 1 ? "answer" : "answers"}`
              : "Type a question in the box above."}
          </p>
          <div className="mt-m">
            {results.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
            {query && results.length === 0 && (
              /* "Send it over" used to be the whole answer here, with nothing to
                 click. A search that finds nothing is the most likely place to
                 lose someone, so every route out of it is offered. */
              <div className="mt-m text-ink-2">
                <p>
                  Nothing matches “{query}”. It may be worded differently here, or
                  it may be something we have not written up yet.
                </p>
                <ul className="mt-m space-y-s">
                  <li><Link href="/topics">Browse every topic</Link></li>
                  <li><Link href="/forum/new">Ask it in the forum</Link>, where it will be visible straight away</li>
                  <li><Link href="/">See the most recent articles</Link></li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <RailRight />
      </div>
    </div>
  );
}
