import path from "node:path";
import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  // site-kit ships TypeScript source rather than a build, so it has to be
  // transpiled by the app that consumes it.
  transpilePackages: ["@uaeprop/site-kit"],
  // site-kit is a file: dependency symlinked to a sibling directory. Turbopack
  // will not resolve outside the project root unless the root is widened.
  turbopack: { root: path.resolve(process.cwd(), "..") },
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
  poweredByHeader: false,
  async headers() {
    // Security headers come from site-kit so all sites stay in step. (§4.3)
    const { securityHeaders } = await import("@uaeprop/site-kit/security");
    return [
      {
        source: "/:path*",
        headers: securityHeaders({ analytics: true, turnstile: true, useNonce: false }).map(
          (h) => ({ key: h.key, value: h.value }),
        ),
      },
    ];
  },
};

export default createMDX({
  options: {
    // Turbopack needs plugins named as strings, not imported functions.
    // remark-frontmatter stops the YAML block rendering as body text;
    // gray-matter reads the same block separately for metadata.
    remarkPlugins: [["remark-frontmatter", ["yaml"]], "remark-gfm"],
  },
})(nextConfig);
