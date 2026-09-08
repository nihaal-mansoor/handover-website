import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

await sql.unsafe(`ALTER TABLE article ADD COLUMN IF NOT EXISTS og_image_url text;`);

// [slug, focusKeyword, metaTitle]  — metaTitle is the search-facing title only;
// the on-page H1 keeps the editorial headline.
const ROWS = [
  ["how-buying-property-in-dubai-works", "how to buy property in dubai", "How to Buy Property in Dubai: The Full Process"],
  ["can-you-cancel-a-form-f-after-signing", "cancel form f dubai", "Can You Cancel a Form F in Dubai After Signing?"],
  ["what-happens-if-you-cannot-pay-your-mortgage", "dubai mortgage default", "Dubai Mortgage Default: What Actually Happens"],
  ["rent-or-buy-in-dubai-the-actual-numbers", "rent or buy in dubai", "Rent or Buy in Dubai: How to Run the Numbers"],
  ["golden-visa-through-property-what-qualifies", "dubai golden visa property", "Dubai Golden Visa Through Property: What Qualifies"],
  ["does-commercial-property-qualify-for-a-golden-visa", "commercial property golden visa", "Does Commercial Property Qualify for a Golden Visa?"],
  ["the-two-year-property-investor-visa", "uae property investor visa", "UAE 2-Year Property Investor Visa Explained"],
  ["selling-off-plan-before-handover", "sell off-plan dubai", "Selling Off-Plan Property in Dubai Before Handover"],
  ["dubai-house-prices-tracked", "dubai house prices", "Dubai House Prices 2026: Index, Quarter by Quarter"],
  ["dubai-rents-tracked", "dubai rent prices", "Dubai Rent Prices 2026: Monthly Index Tracker"],
  ["dubai-transactions-tracked", "dubai property transactions", "Dubai Property Transactions 2026: Volume and Prices"],
  ["has-the-dubai-property-market-turned", "dubai property market 2026", "Has the Dubai Property Market Turned? 2026 Data"],
  ["why-villas-outperformed-apartments", "dubai villa vs apartment prices", "Dubai Villa vs Apartment Prices: The 2019-2025 Gap"],
  ["what-happened-to-dubai-construction-costs", "dubai construction costs", "Dubai Construction Costs 2026: How Far They Rose"],
  ["prices-versus-the-cost-of-building", "dubai property prices vs build cost", "Dubai Property Prices vs Build Costs Compared"],
  ["two-official-sources-two-answers", "dubai property price index", "Dubai Property Price Index: Why Sources Disagree"],
  ["commercial-property-has-not-moved-as-one-thing", "dubai commercial property prices", "Dubai Commercial Property Prices by Segment"],
];

const OG = [
  "how-buying-property-in-dubai-works","can-you-cancel-a-form-f-after-signing",
  "what-happens-if-you-cannot-pay-your-mortgage","rent-or-buy-in-dubai-the-actual-numbers",
  "golden-visa-through-property-what-qualifies","does-commercial-property-qualify-for-a-golden-visa",
  "the-two-year-property-investor-visa",
];

let over = 0;
for (const [slug, kw, title] of ROWS) {
  if (title.length > 60) { console.log(`  !! ${title.length} chars: ${title}`); over++; }
  const r = await sql`UPDATE article SET meta_title=${title}, focus_keyword=${kw}
                      WHERE slug=${slug} RETURNING slug`;
  if (!r.length) console.log(`  !! no row for ${slug}`);
}
for (const slug of OG) {
  await sql`UPDATE article SET og_image_url=${"/images/og/" + slug + ".png"} WHERE slug=${slug}`;
}
const [c] = await sql`SELECT count(*)::int n FROM article WHERE meta_title IS NOT NULL AND focus_keyword IS NOT NULL`;
const [o] = await sql`SELECT count(*)::int n FROM article WHERE og_image_url IS NOT NULL`;
console.log(`meta_title + focus_keyword set on ${c.n} | og_image_url set on ${o.n} | titles over 60: ${over}`);
await sql.end();
