import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allTopicsAsync, articlesByTopicAsync } from "@/lib/content";
import { ArticleCard } from "@/components/ArticleCard";
import { RailLeft } from "@/components/RailLeft";
import { RailRight } from "@/components/RailRight";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = (await allTopicsAsync()).find((t) => t.slug === slug);
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
  const topic = (await allTopicsAsync()).find((t) => t.slug === slug);
  if (!topic) notFound();

  return (
    <div className="shell">
      <div className="app-grid">
      <RailLeft />
      <div className="feed">
      <p className="meta">Topic</p>
      <h1 className="mt-2xs">{topic.name}</h1>
      <p className="mt-s text-ink-2">
        {topic.count} {topic.count === 1 ? "answer" : "answers"}
      </p>
      <div className="mt-l">
        {(await articlesByTopicAsync(slug)).map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
      </div>
      <RailRight />
      </div>
    </div>
  );
}
