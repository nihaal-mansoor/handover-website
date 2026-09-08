/**
 * Share cards for the articles that have no chart of their own.
 *
 *   node scripts/make-og-cards.mjs
 *
 * Seven of the articles are process and visa explainers with no figure to
 * illustrate, so they were shipping with no og:image at all while the page
 * still declared summary_large_image. Those share as an empty card.
 *
 * Same surface, ink and typefaces as the charts, so a shared link looks like it
 * came from the same publication whichever article it is.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { W, H, INK, MUTED, FAINT, SURFACE, PALETTE } from "./charts.mjs";

const OUT = path.join(process.cwd(), "public", "images", "og");
await mkdir(OUT, { recursive: true });

const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Greedy wrap at a measured width. librsvg has no text wrapping of its own, so
 * every line has to be positioned individually or the title runs off the card.
 */
function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if (!line) { line = w; continue; }
    if ((line + " " + w).length <= maxChars) line += " " + w;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}

const CARDS = [
  ["how-buying-property-in-dubai-works", "How buying property in Dubai works", "Offer to title deed, step by step"],
  ["can-you-cancel-a-form-f-after-signing", "Can you cancel a Form F after signing?", "What the contract actually binds you to"],
  ["what-happens-if-you-cannot-pay-your-mortgage", "What happens if you cannot pay your mortgage", "The sequence, and where it can still be stopped"],
  ["rent-or-buy-in-dubai-the-actual-numbers", "Rent or buy in Dubai", "How to run the numbers on your own situation"],
  ["golden-visa-through-property-what-qualifies", "Golden Visa through property", "What qualifies, and what the two sources disagree on"],
  ["does-commercial-property-qualify-for-a-golden-visa", "Does commercial property qualify?", "Golden Visa eligibility beyond residential"],
  ["the-two-year-property-investor-visa", "The 2-year investor visa", "The lower threshold nobody mentions"],
];

for (const [slug, title, subtitle] of CARDS) {
  const lines = wrap(title, 26);
  const size = lines.length > 2 ? 62 : 74;
  const startY = 300 - ((lines.length - 1) * size * 0.58);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${SURFACE}"/>
  <rect x="0" y="0" width="10" height="${H}" fill="${PALETTE[0]}"/>
  <text x="72" y="92" font-family="${SANS}" font-size="26" font-weight="700" fill="${INK}" letter-spacing="-0.4">Handover</text>
  <text x="205" y="92" font-family="${SANS}" font-size="20" fill="${FAINT}">Dubai property, explained</text>
  ${lines.map((l, i) => `<text x="72" y="${startY + i * size * 1.12}" font-family="${SANS}" font-size="${size}" font-weight="700" fill="${INK}" letter-spacing="-2">${esc(l)}</text>`).join("\n  ")}
  <text x="72" y="${H - 76}" font-family="${SANS}" font-size="25" fill="${MUTED}">${esc(subtitle)}</text>
  <rect x="72" y="${H - 46}" width="56" height="4" fill="${PALETTE[0]}"/>
</svg>`;

  const png = path.join(OUT, `${slug}.png`);
  await sharp(Buffer.from(svg)).png().toFile(png);
  await writeFile(path.join(OUT, `${slug}.svg`), svg, "utf8");
  console.log(`  ${slug}.png  ${W}x${H}`);
}
console.log(`\n${CARDS.length} share cards written to public/images/og/`);
