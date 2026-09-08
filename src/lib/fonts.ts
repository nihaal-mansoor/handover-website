import localFont from "next/font/local";

/**
 * Fonts through next/font rather than an @import of the fontsource CSS.
 *
 * The @import shipped 13 @font-face blocks across seven unicode subsets with
 * font-display: swap and no metrics-matched fallback. Swapping a fallback for
 * the real face at a different size reflows everything below it, which
 * Lighthouse measured as a 0.206 layout shift on the article body against a
 * budget of 0.05.
 *
 * next/font generates a fallback whose metrics are adjusted to match, so the
 * swap changes glyphs without changing height, and it preloads the file and
 * self-hosts it. Only the Latin subset is carried: the site is written in
 * English and the other six subsets were bytes nobody was reading.
 */
export const sans = localFont({
  src: "../fonts/inter.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans-next",
  preload: true,
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica", "sans-serif"],
});

export const serif = localFont({
  src: "../fonts/source-serif-4.woff2",
  weight: "200 900",
  style: "normal",
  display: "swap",
  variable: "--font-serif-next",
  preload: true,
  fallback: ["Charter", "Georgia", "Times New Roman", "serif"],
});
