import type { MetadataRoute } from "next";
import { originOf } from "@uaeprop/site-kit";
import config from "../../site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/search"] }],
    sitemap: `${originOf(config)}/sitemap.xml`,
  };
}
