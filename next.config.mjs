import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  // site-kit ships TypeScript source rather than a build, so it has to be
  // transpiled by the app that consumes it.
  transpilePackages: ["@uaeprop/site-kit"],
  // site-kit is vendored into packages/, so nothing resolves outside this
  // directory any more. The tracing root must stay at the project root: setting
  // it to the parent stopped content/ being included in the deployment.
  // The MDX fallback reads content/ from disk at request time with a path built
  // at runtime, so tracing cannot infer it. Without this the files are absent
  // from the deployment, articles 500 and the feed silently renders empty.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
  poweredByHeader: false,
  async headers() {
    // Security headers come from site-kit so all sites stay in step. (§4.3)
    const { securityHeaders } = await import("@uaeprop/site-kit/security");
    // CSP is set per request in middleware because it carries a nonce.
    // Everything else is static and belongs here.
    return [
      {
        source: "/:path*",
        headers: securityHeaders({ analytics: true, turnstile: true, useNonce: false })
          .filter((h) => h.key !== "Content-Security-Policy")
          .map((h) => ({ key: h.key, value: h.value })),
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
