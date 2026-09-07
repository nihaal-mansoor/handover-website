import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleAsync, formatDate, topicSlug } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import config from "../../../../site.config";
import { originOf } from "@uaeprop/site-kit";
import { Comments } from "@/components/Comments";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleAsync(slug);
  if (!article) return {};
  const image = article.featuredImageUrl;
  return {
    title: article.metaTitle ?? article.title,
    description: article.metaDescription ?? article.dek,
    alternates: { canonical: article.canonicalUrl ?? `/answers/${slug}` },
    ...(article.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: article.metaTitle ?? article.title,
      description: article.metaDescription ?? article.dek,
      type: "article",
      ...(image ? { images: [{ url: image, alt: article.featuredImageAlt ?? article.title }] } : {}),
    },
  };
}

export default async function AnswerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleAsync(slug);
  if (!article) notFound();

  // Database articles render markdown at request time; anything still only in
  // the repo falls back to the compiled MDX module.
  // A missing MDX module must not 500 the route. If the file is not in the
  // deployment, treat the article as not found rather than erroring.
  let Body: React.ComponentType | null = null;
  if (article.source !== "db") {
    try {
      Body = (await import(`../../../../content/answers/${slug}.mdx`)).default;
    } catch (err) {
      console.error(`[article] MDX module missing for "${slug}"`, err);
      notFound();
    }
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.dek,
    datePublished: article.published,
    ...(article.updated ? { dateModified: article.updated } : {}),
    author: { "@type": "Organization", name: config.brand },
    publisher: { "@type": "Organization", name: config.brand },
    mainEntityOfPage: `${originOf(config)}/answers/${slug}`,
  };

  return (
    <article className="col py-xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <h1>{article.title}</h1>
      <p className="mt-s text-step-1 text-muted" style={{ lineHeight: 1.4 }}>
        {article.dek}
      </p>

      <div className="mt-m flex items-center gap-s border-b border-rule pb-m">
        <span className="avatar" aria-hidden="true">
          {config.brand.slice(0, 1)}
        </span>
        <p className="meta m-0">
          <span className="text-ink">{config.brand}</span>
          <br />
          <time dateTime={article.published}>{formatDate(article.published)}</time>
          {" · "}
          {article.minutes} min read
          {article.updated && (
            <>
              <br />
              <span style={{ color: "var(--accent)" }}>
                Updated <time dateTime={article.updated}>{formatDate(article.updated)}</time>
              </span>
            </>
          )}
        </p>
      </div>

      {article.featuredImageUrl && (
        <figure className="mt-l mb-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt ?? ""}
            style={{ width: "100%", borderRadius: 4 }}
          />
        </figure>
      )}

      <div className="prose mt-l">
        {article.source === "db" && article.body ? (
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }} />
        ) : Body ? (
          <Body />
        ) : null}
      </div>

      <div className="mt-l border-t border-rule pt-m">
        <Link href={`/topics/${topicSlug(article.topic)}`} className="pill">
          {article.topic}
        </Link>
      </div>

      <Comments articleSlug={slug} />
    </article>
  );
}
