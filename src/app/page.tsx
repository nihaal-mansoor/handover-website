import Link from "next/link";
import { allArticles, allTopics } from "@/lib/content";
import { ArticleCard } from "@/components/ArticleCard";

export default function Home() {
  const articles = allArticles();
  const topics = allTopics();

  return (
    <div className="col-wide">
      <section className="border-b border-rule py-xl">
        <h1 className="max-w-[16ch]">Questions people actually ask about buying in Dubai</h1>
        <p className="mt-m max-w-[46ch] text-ink-2">
          One question at a time, answered in full: what it costs, who signs it,
          and what usually goes wrong.
        </p>
      </section>

      <div className="grid gap-xl py-l md:grid-cols-[minmax(0,1fr)_15rem]">
        <div>
          {articles.length === 0 ? (
            <p className="meta py-l">No answers published yet.</p>
          ) : (
            articles.map((a) => <ArticleCard key={a.slug} article={a} />)
          )}
        </div>

        <aside className="md:border-l md:border-rule md:pl-m">
          <h2 className="text-step--1 font-semibold uppercase tracking-[0.08em] text-muted">
            Topics
          </h2>
          <ul className="mt-s flex list-none flex-wrap gap-2xs p-0 md:flex-col md:items-start">
            {topics.map((t) => (
              <li key={t.slug}>
                <Link href={`/topics/${t.slug}`} className="pill">
                  {t.name}
                  <span className="ml-1 text-faint">{t.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
