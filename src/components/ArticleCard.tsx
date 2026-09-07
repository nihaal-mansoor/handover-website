import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/content";
import { formatDate, topicSlug } from "@/lib/content";

/**
 * A feed row, not a card: no border, no fill, no shadow. Separation comes from
 * a hairline rule and space.
 *
 * The thumbnail sits right of the text as it does on Medium, at a fixed
 * 1.9:1 so the row height never depends on the image, and it is dropped
 * entirely on narrow screens where it would squeeze the title.
 */
export function ArticleCard({ article }: { article: Article }) {
  const img = article.featuredImageUrl;

  return (
    <article className="border-b border-rule py-m">
      <div className="flex items-start gap-m">
        <div className="min-w-0 flex-1">
          <Link href={`/answers/${article.slug}`} className="group block no-underline">
            <h2 className="text-step-2 group-hover:underline decoration-1 underline-offset-4">
              {article.title}
            </h2>
            <p className="mt-2xs mb-0 text-ink-2" style={{ fontSize: "1.0625rem" }}>
              {article.dek}
            </p>
          </Link>
        </div>

        {img && (
          <Link
            href={`/answers/${article.slug}`}
            className="hidden shrink-0 no-underline sm:block"
            aria-hidden="true"
            tabIndex={-1}
          >
            <Image
              src={img}
              alt=""
              width={168}
              height={88}
              className="thumb"
              sizes="168px"
            />
          </Link>
        )}
      </div>

      <p className="meta mt-s mb-0 flex flex-wrap items-center gap-x-xs gap-y-2xs">
        <Link href={`/topics/${topicSlug(article.topic)}`} className="pill">
          {article.topic}
        </Link>
        <span aria-hidden="true">·</span>
        {article.updated ? (
          <span style={{ color: "var(--accent)" }}>
            Updated <time dateTime={article.updated}>{formatDate(article.updated)}</time>
          </span>
        ) : (
          <time dateTime={article.published}>{formatDate(article.published)}</time>
        )}
        <span aria-hidden="true">·</span>
        <span>{article.minutes} min read</span>
      </p>
    </article>
  );
}
