import type { Metadata } from "next";
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
              <p className="mt-m text-ink-2">
                Nothing yet. If that is a question you want answered, send it over and
                it may become the next one.
              </p>
            )}
          </div>
        </div>
        <RailRight />
      </div>
    </div>
  );
}
