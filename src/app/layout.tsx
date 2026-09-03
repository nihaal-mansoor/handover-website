import type { Metadata } from "next";
import "./globals.css";
import config from "../../site.config";
import { originOf } from "@uaeprop/site-kit";
import { Masthead } from "@/components/Masthead";
import { SiteFooter } from "@/components/SiteFooter";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AE">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <Masthead />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
