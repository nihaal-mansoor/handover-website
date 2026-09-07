import type { Metadata } from "next";
import "./globals.css";
import config from "../../site.config";
import { originOf } from "@uaeprop/site-kit";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Analytics } from "@/components/Analytics";
import { ConsentBanner } from "@/components/ConsentBanner";
import { headers } from "next/headers";

const origin = originOf(config);

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: `${config.brand} — ${config.tagline}`,
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
        <a className="skip-link" href="#main">Skip to content</a>
        <TopBar />
        <main id="main">{children}</main>
        <SiteFooter />
        <ConsentBanner />
        <Analytics gaId={gaId} nonce={nonce} />
      </body>
    </html>
  );
}
