import type { MetadataRoute } from "next";
import { allArticlesAsync, allTopicsAsync } from "@/lib/content";
import { originOf } from "@uaeprop/site-kit";
import config from "../../site.config";

/** Excludes anything flagged noindex in the editor. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = originOf(config);
  const [articles, topics] = await Promise.all([allArticlesAsync(), allTopicsAsync()]);

  return [
    { url: origin, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/topics`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${origin}/forum`, changeFrequency: "daily", priority: 0.6 },
    ...articles
      .filter((a) => !a.noindex)
      .map((a) => ({
        url: `${origin}/answers/${a.slug}`,
        lastModified: new Date(a.updated ?? a.published),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
    ...topics.map((t) => ({
      url: `${origin}/topics/${t.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
