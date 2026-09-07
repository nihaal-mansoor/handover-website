/**
 * Attaches each generated chart to its article.
 *
 * Alt text describes what the chart shows and its headline finding, so a
 * screen-reader user gets the point rather than "chart".
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set."); process.exit(1); }
const sql = postgres(url, { max: 2 });

const MAP = [
  ["has-the-dubai-property-market-turned", "market-turn",
   "Bar chart of Dubai sales from 1 January to 3 September: 112,800 in 2024, 139,600 in 2025 and 113,800 in 2026, showing 2026 back at 2024 levels."],
  ["dubai-transactions-tracked", "price-per-sqm",
   "Line chart of the median price per square metre from 2015 to 2026, rising from about AED 10,200 to AED 18,400 with growth slowing each year since 2022."],
  ["dubai-house-prices-tracked", "villas-vs-flats",
   "Line chart of the Dubai residential price index since 2020: villas reach 225, all homes 167 and flats 147 against a 2019 base of 100."],
  ["why-villas-outperformed-apartments", "villas-vs-flats",
   "Line chart showing the villa index rising far faster than the flat index since 2020, reaching 225 against 147."],
  ["dubai-rents-tracked", "rent-growth-slowing",
   "Bar chart of the monthly change in the Dubai rent index, falling from 0.74 in January 2026 to 0.23 in July 2026."],
  ["commercial-property-has-not-moved-as-one-thing", "commercial-spread",
   "Bar chart of Dubai commercial property price index by segment for 2025 Q4: shops 297, offices 238 and hotel rooms 107 against a 2019 base of 100."],
  ["what-happened-to-dubai-construction-costs", "construction-costs",
   "Line chart of the Dubai construction cost index from 2019, flat near 100 until 2021 then climbing sharply to 121 by mid-2026."],
  ["prices-versus-the-cost-of-building", "price-vs-build-cost",
   "Line chart comparing Dubai home prices and construction costs since 2020, both indexed to 2019: prices reach 167 while build costs reach 111."],
  ["two-official-sources-two-answers", "two-sources",
   "Line chart comparing Dubai house prices from two official sources rebased to 2019: the Land Department median reaches 172 by 2025 while the Statistics Centre index reaches 163."],
  ["selling-off-plan-before-handover", "off-plan-share",
   "Line chart showing off-plan as a share of Dubai registered sales, rising from about 32 percent in 2015 to 68.5 percent in 2026."],
];

let n = 0;
for (const [slug, chart, alt] of MAP) {
  const [row] = await sql`
    UPDATE article
    SET featured_image_url = ${`/images/charts/${chart}.png`},
        featured_image_alt = ${alt}
    WHERE slug = ${slug}
    RETURNING slug
  `;
  if (row) { n++; console.log(`  ${row.slug} → ${chart}.png`); }
  else console.log(`  (no article named ${slug})`);
}
console.log(`\n${n} of ${MAP.length} articles given a featured image`);
await sql.end();
