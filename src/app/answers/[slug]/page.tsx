import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
  // Falls back to the generated share card, so an article with no chart of
  // its own still shares as something rather than an empty box.
  const image = article.featuredImageUrl ?? article.ogImageUrl;
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
    ...(image
      ? { twitter: { card: "summary_large_image" as const, images: [image] } }
      : {}),
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

  // True when the body already shows the featured image somewhere in the prose.
  // Only the database path can be inspected; MDX bodies are compiled modules, and
  // none of them embed images.
  const embedsFeaturedImage = Boolean(
    article.featuredImageUrl &&
      article.source === "db" &&
      article.body?.includes(article.featuredImageUrl),
  );

  const origin = originOf(config);

  /* Article plus the trail that leads to it. Without BreadcrumbList a search
     engine has to infer the hierarchy from the URL, and an assistant citing
     the page has no machine-readable statement of which topic it belongs to.
     The trail mirrors the visible navigation exactly, which is what Google
     requires of breadcrumb markup. */
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.dek,
      datePublished: article.published,
      ...(article.updated ? { dateModified: article.updated } : {}),
      inLanguage: "en-AE",
      author: { "@type": "Organization", name: config.brand },
      publisher: { "@type": "Organization", name: config.brand },
      mainEntityOfPage: `${origin}/answers/${slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: origin },
        { "@type": "ListItem", position: 2, name: "Topics", item: `${origin}/topics` },
        {
          "@type": "ListItem",
          position: 3,
          name: article.topic,
          item: `${origin}/topics/${topicSlug(article.topic)}`,
        },
        { "@type": "ListItem", position: 4, name: article.title },
      ],
    },
  ];

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

      {/* The featured image is also the card thumbnail and the Open Graph image,
          so it stays set even when it is not drawn here. Drawing it at the top of
          an article that already embeds the same chart next to the paragraph it
          supports showed the reader the identical figure twice, which is why the
          data articles looked inconsistent against each other. Inline wins: a
          chart belongs beside its argument. */}
      {article.featuredImageUrl && !embedsFeaturedImage && (
        <figure className="mt-l mb-0">
          <Image
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt ?? ""}
            width={1200}
            height={630}
            className="featured"
            priority
            sizes="(max-width: 44rem) 100vw, 680px"
          />
        </figure>
      )}

      {/* Both branches put the article's own elements directly inside .prose.
          Wrapping the rendered markdown in an extra div made every
          `.prose > * + *` rhythm rule miss, so DB articles and MDX articles
          were spaced differently. */}
      {article.source === "db" && article.body ? (
        <div
          className="prose mt-l"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }}
        />
      ) : (
        <div className="prose mt-l">{Body ? <Body /> : null}</div>
      )}

      <div className="mt-l border-t border-rule pt-m">
        <Link href={`/topics/${topicSlug(article.topic)}`} className="pill">
          {article.topic}
        </Link>
      </div>

      <Comments articleSlug={slug} />
    </article>
  );
}
