import Link from "next/link";
import { allArticlesAsync, allTopicsAsync } from "@/lib/content";

/** Side column: where to start, and what else exists. */
export async function RailRight() {
  const all = await allArticlesAsync();
  const start = all.find((a) => a.sourceNote?.includes("Cornerstone")) ?? all[0];
  const topics = await allTopicsAsync();

  return (
    <aside className="rail-right">
      <div className="rail-sticky">
        {start && (
          <section>
            <p className="rail-heading">Start here</p>
            <Link href={`/answers/${start.slug}`} className="no-underline">
              <span className="block font-sans text-step--1 font-semibold leading-snug text-ink">
                {start.title}
              </span>
              <span className="meta mt-2xs block">{start.minutes} min read</span>
            </Link>
          </section>
        )}

        <section className="mt-l border-t border-rule pt-m">
          <p className="rail-heading">Browse by topic</p>
          <ul className="m-0 flex list-none flex-wrap gap-2xs p-0">
            {topics.map((t) => (
              <li key={t.slug}>
                <Link href={`/topics/${t.slug}`} className="pill">{t.name}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-l border-t border-rule pt-m">
          <p className="rail-heading">From the forum</p>
          <p className="meta m-0">
            Opening soon. It will be a place to post what actually happened, not what
            a brochure promised.
          </p>
        </section>
      </div>
    </aside>
  );
}
