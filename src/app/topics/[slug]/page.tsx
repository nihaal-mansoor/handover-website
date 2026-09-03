import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allTopics, articlesByTopic } from "@/lib/content";
import { ArticleCard } from "@/components/ArticleCard";

export function generateStaticParams() {
  return allTopics().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = allTopics().find((t) => t.slug === slug);
  if (!topic) return {};
  return {
    title: topic.name,
    description: `Answers about ${topic.name.toLowerCase()} when buying property in Dubai.`,
    alternates: { canonical: `/topics/${slug}` },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = allTopics().find((t) => t.slug === slug);
  if (!topic) notFound();

  return (
    <div className="col py-xl">
      <p className="meta">Topic</p>
      <h1 className="mt-2xs">{topic.name}</h1>
      <p className="mt-s text-ink-2">
        {topic.count} {topic.count === 1 ? "answer" : "answers"}
      </p>
      <div className="mt-l">
        {articlesByTopic(slug).map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
