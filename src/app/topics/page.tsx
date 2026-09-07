import type { Metadata } from "next";
import Link from "next/link";
import { allTopicsAsync } from "@/lib/content";
import { RailLeft } from "@/components/RailLeft";
import { RailRight } from "@/components/RailRight";

export const metadata: Metadata = {
  title: "Topics",
  description: "Every topic covered, from the buying process to service charges.",
  alternates: { canonical: "/topics" },
};

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const topics = await allTopicsAsync();
  return (
    <div className="shell">
      <div className="app-grid">
      <RailLeft current="/topics" />
      <div className="feed">
      <h1>Topics</h1>
      <ul className="mt-l list-none p-0">
        {topics.map((t) => (
          <li key={t.slug} className="border-b border-rule py-s">
            <Link href={`/topics/${t.slug}`} className="flex items-baseline justify-between no-underline">
              <span className="text-step-1 font-semibold" style={{ fontFamily: "var(--font-sans)" }}>
                {t.name}
              </span>
              <span className="meta">{t.count}</span>
            </Link>
          </li>
        ))}
      </ul>
      </div>
      <RailRight />
      </div>
    </div>
  );
}
