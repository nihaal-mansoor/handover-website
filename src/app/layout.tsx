import type { Metadata } from "next";
import "./globals.css";
import config from "../../site.config";
import { originOf } from "@uaeprop/site-kit";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Analytics } from "@/components/Analytics";
import { CookieConsent } from "@/components/CookieConsent";
import { headers } from "next/headers";

const origin = originOf(config);

/**
 * The colour the mobile browser paints its own chrome. Two entries so the bar
 * matches the page in both themes rather than staying light behind a dark page.
 */
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F4ED" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F0E" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: `${config.brand}: ${config.tagline}`,
    template: `%s | ${config.brand}`,
  },
  description: config.tagline,
  openGraph: {
    siteName: config.brand,
    type: "website",
    images: [{ url: config.og.image, width: 1200, height: 630, alt: config.og.imageAlt }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Middleware sets this per request; scripts need it under the nonce CSP.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const gaId = process.env["NEXT_PUBLIC_GA_ID"];

  return (
    <html lang="en-AE">
      <body>
        {/* Organization and WebSite, once for the whole site (§4.5). It names
            the publication and nothing else: we hold no credentials to claim,
            so there is no address, no founder and no rating here (§1.2).
            The nonce is required because CSP has no unsafe-inline. */}
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: config.brand,
                url: origin,
                description:
                  "Independent property research for the UAE. Not a licensed broker.",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: config.brand,
                url: origin,
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${origin}/search?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        <a className="skip-link" href="#main">Skip to content</a>
        <TopBar />
        <main id="main">{children}</main>
        <SiteFooter />
        <CookieConsent />
        <Analytics gaId={gaId} nonce={nonce} />
      </body>
    </html>
  );
}
