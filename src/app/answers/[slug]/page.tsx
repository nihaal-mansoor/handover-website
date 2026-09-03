import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articleSlugs, getArticle, formatDate, topicSlug } from "@/lib/content";
import config from "../../../../site.config";
import { originOf } from "@uaeprop/site-kit";

export function generateStaticParams() {
  return articleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.dek,
    alternates: { canonical: `/answers/${slug}` },
    openGraph: { title: article.title, description: article.dek, type: "article" },
  };
}

export default async function AnswerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const { default: Body } = await import(`../../../../content/answers/${slug}.mdx`);

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
        </p>
      </div>

      <div className="prose mt-l">
        <Body />
      </div>

      <div className="mt-l border-t border-rule pt-m">
        <Link href={`/topics/${topicSlug(article.topic)}`} className="pill">
          {article.topic}
        </Link>
      </div>
    </article>
  );
}
