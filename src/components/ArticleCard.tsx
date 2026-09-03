import Link from "next/link";
import type { Article } from "@/lib/content";
import { formatDate, topicSlug } from "@/lib/content";

/**
 * A feed row, not a card: no border, no fill, no shadow. Separation comes from
 * a hairline rule and space, which is what makes a Medium feed feel calm.
 */
export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="border-b border-rule py-m">
      <Link href={`/answers/${article.slug}`} className="group block no-underline">
        <h2 className="text-step-2 group-hover:underline decoration-1 underline-offset-4">
          {article.title}
        </h2>
        <p className="mt-2xs mb-0 text-step--1 text-ink-2" style={{ fontSize: "1.0625rem" }}>
          {article.dek}
        </p>
      </Link>
      <p className="meta mt-s mb-0 flex flex-wrap items-center gap-x-xs gap-y-2xs">
        <Link href={`/topics/${topicSlug(article.topic)}`} className="pill">
          {article.topic}
        </Link>
        <span aria-hidden="true">·</span>
        <time dateTime={article.published}>{formatDate(article.published)}</time>
        <span aria-hidden="true">·</span>
        <span>{article.minutes} min read</span>
      </p>
    </article>
  );
}
