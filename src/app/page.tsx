import { allArticlesAsync } from "@/lib/content";
import { ArticleCard } from "@/components/ArticleCard";
import { RailLeft } from "@/components/RailLeft";
import { RailRight } from "@/components/RailRight";

export const dynamic = "force-dynamic";

export default async function Home() {
  const articles = await allArticlesAsync();

  return (
    <>
      {/* Compact opener. A new site has to say what it is; it does not need a
          full-viewport hero to do it. */}
      <section className="border-b border-rule">
        <div className="shell grid items-end gap-m py-l lg:grid-cols-[1.4fr_1fr]">
          <h1
            className="max-w-[18ch] text-step-4"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
          >
            Buying property in Dubai, explained
          </h1>
          <p className="mb-2xs max-w-[42ch] text-ink-2">
            One question at a time, answered in full: what it costs, who signs it,
            and what usually goes wrong.
          </p>
        </div>
      </section>

      <div className="shell">
        <div className="app-grid">
          <RailLeft current="/" />

          <div className="feed">
            <h2 className="text-step--1 font-semibold uppercase tracking-[0.08em] text-muted">
              Latest
            </h2>
            <div className="mt-s">
              {articles.length === 0 ? (
                <p className="meta py-l">No answers published yet.</p>
              ) : (
                articles.map((a) => <ArticleCard key={a.slug} article={a} />)
              )}
            </div>
          </div>

          <RailRight />
        </div>
      </div>
    </>
  );
}
