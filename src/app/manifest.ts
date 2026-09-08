import type { MetadataRoute } from "next";
import config from "../../site.config";

/**
 * The icons for this already existed in public/ but nothing referenced them,
 * so /manifest.webmanifest 404'd and Android had no icon to install with.
 *
 * Not a full PWA: no service worker and nothing offline. This exists so the
 * site has a name, an icon and a browser colour when someone saves it to a
 * home screen, which on a phone-heavy audience is worth the twenty lines.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${config.brand}: ${config.tagline}`,
    short_name: config.brand,
    description: config.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#F7F4ED",
    theme_color: "#F7F4ED",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
