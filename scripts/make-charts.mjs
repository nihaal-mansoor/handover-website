/**
 * Renders one chart per data article from the committed derived figures.
 *
 *   node scripts/make-charts.mjs
 *
 * Output is 1200x630 so the same asset serves as the article's featured image
 * and its Open Graph card.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { lineChart, barChart, rowChart } from "./charts.mjs";

const OUT = path.join(process.cwd(), "public", "images", "charts");
await mkdir(OUT, { recursive: true });

const tx = JSON.parse(await readFile("data/transactions.json", "utf8"));
const ix = JSON.parse(await readFile("data/indices.json", "utf8"));
const cc = JSON.parse(await readFile("data/construction-cost.json", "utf8"));

const DLD = "Source: Dubai Land Department registered transactions";
const DSC = "Source: Dubai Statistics Center";
const charts = [];

/* 1. Has the market turned — one measure, sales volume; value as labels. */
{
  const y = tx.year_to_date_3_september;
  charts.push(["market-turn", barChart({
    title: "Dubai sales, 1 January to 3 September",
    subtitle: "2026 volume is back at 2024 levels. 2025 was the peak.",
    source: DLD,
    labels: ["2024", "2025", "2026"],
    values: [y["2024"].sales, y["2025"].sales, y["2026"].sales],
    valueLabels: Object.values(y).map((v) => `${(v.sales / 1000).toFixed(1)}k`),
    // No highlight. Painting 2026 in the second hue marked it as the exception
    // when the article's whole point is that 2026 is ordinary and 2025 was the
    // outlier. The bar heights and the labels carry that without colouring it.
  })]);
}

/* 2. Price per sqm over time — single series, so no legend. */
{
  const e = Object.entries(tx.median_price_per_sqm_by_year);
  charts.push(["price-per-sqm", lineChart({
    title: "Median price per square metre",
    subtitle: "Still rising, but growth has slowed every year since 2022",
    source: DLD,
    xLabels: e.map(([y]) => y),
    series: [{ name: "AED/sqm", values: e.map(([, v]) => v.median_aed_sqm) }],
    yFormat: (v) => Math.round(v).toLocaleString("en-GB"),
  })]);
}

/* 3. Villas against apartments — the divergence. */
{
  const r = ix.residential_price_index;
  const q = Object.keys(r["General Index"]);
  charts.push(["villas-vs-flats", lineChart({
    title: "Villas have caught up with apartments",
    subtitle: "Residential price index, 2019 = 100",
    source: DSC,
    xLabels: q.map((k) => (k.endsWith("Q1") ? k.slice(0, 4) : "")),
    series: [
      { name: "Villas", values: q.map((k) => r["Villas"][k] ?? null) },
      { name: "All homes", values: q.map((k) => r["General Index"][k] ?? null) },
      { name: "Flats", values: q.map((k) => r["Flats"][k] ?? null) },
    ],
    yFormat: (v) => Math.round(v),
  })]);
}

/* 3b. The villa/flat gap on its own.
   The levels chart above belongs to the price tracker. This article argues that
   the two series separated and never converged, so it gets the spread itself:
   one series, one scale, and the claim is the shape of the line. */
{
  const r = ix.residential_price_index;
  const q = Object.keys(r["General Index"]).filter(
    (k) => r["Villas"][k] != null && r["Flats"][k] != null,
  );
  charts.push(["villa-flat-gap", lineChart({
    title: "The gap has widened in almost every quarter since 2021",
    subtitle: "Villa price index minus flat price index, in index points",
    source: DSC,
    xLabels: q.map((k) => (k.endsWith("Q1") ? k.slice(0, 4) : "")),
    series: [
      { name: "Villas minus flats", values: q.map((k) => r["Villas"][k] - r["Flats"][k]) },
    ],
    yFormat: (v) => Math.round(v),
  })]);
}

/* 4. Rents: the deceleration.
   Charting the levels was misleading — new lets have turned by 0.15%, which is
   invisible on a chart of levels and made the finding look like nothing. The
   month-on-month change is the same story, honestly drawn. */
{
  const d = ix.rent_monthly_deltas_last_12["RRPI General Index"];
  const e = Object.entries(d);
  charts.push(["rent-growth-slowing", barChart({
    title: "Rent growth has slowed every month of 2026",
    subtitle: "Change in the residential rent index, month on month",
    source: DSC,
    labels: e.map(([k]) => k.slice(2).replace("-", "/")),
    values: e.map(([, v]) => v),
    valueLabels: e.map(([, v]) => v.toFixed(2)),
    highlight: e.length - 1,
  })]);
}

/* 5. Commercial spread — magnitude, so one hue. */
{
  const s = ix.summary.commercial;
  const rows = Object.entries(s)
    .filter(([k]) => k !== "General Index")
    .map(([k, v]) => [k, v.latest])
    .sort((a, b) => b[1] - a[1]);
  charts.push(["commercial-spread", rowChart({
    title: "Commercial has not moved as one thing",
    subtitle: "Price index by segment, 2025 Q4, 2019 = 100",
    source: DSC,
    labels: rows.map(([k]) => k),
    values: rows.map(([, v]) => v),
    valueLabels: rows.map(([, v]) => `${Math.round(v)}`),
  })]);
}

/* 6. Construction cost. */
{
  const q = Object.entries(cc.quarterly_residential_general_index).filter(([k]) => +k.slice(0, 4) >= 2019);
  charts.push(["construction-costs", lineChart({
    title: "Construction costs jumped in 2026",
    subtitle: "Construction Cost Index, residential, 2019 = 100",
    source: DSC,
    xLabels: q.map(([k]) => (k.endsWith("Q1") ? k.slice(0, 4) : "")),
    series: [{ name: "Index", values: q.map(([, v]) => v), endValue: false }],
    yFormat: (v) => Math.round(v),
  })]);
}

/* 7. Off-plan share. */
{
  const e = Object.entries(tx.off_plan_share_pct_by_year);
  charts.push(["off-plan-share", lineChart({
    title: "Off-plan is now more than two thirds of sales",
    subtitle: "Share of registered sales that were off-plan",
    source: DLD,
    xLabels: e.map(([y]) => y),
    series: [{ name: "Off-plan", values: e.map(([, v]) => v) }],
    yFormat: (v) => `${Math.round(v)}%`,
    yFrom: 25,
  })]);
}

/* 8. Prices against the cost of building — same base, so one scale is honest. */
{
  const res = ix.residential_price_index["General Index"];
  const cci = cc.quarterly_residential_general_index;
  const q = Object.keys(res).filter((k) => cci[k] != null && +k.slice(0, 4) >= 2020);
  charts.push(["price-vs-build-cost", lineChart({
    title: "Prices rose six times faster than the cost of building",
    subtitle: "Both indexed to 2019 = 100",
    source: "Sources: Dubai Statistics Center price and construction cost indices",
    xLabels: q.map((k) => (k.endsWith("Q1") ? k.slice(0, 4) : "")),
    series: [
      { name: "Home prices", values: q.map((k) => res[k]) },
      { name: "Build cost", values: q.map((k) => cci[k]) },
    ],
    yFormat: (v) => Math.round(v),
  })]);
}

/* 9. The two official sources disagree. */
{
  const sq = tx.median_price_per_sqm_by_year;
  const base = sq["2019"].median_aed_sqm;
  const res = ix.residential_price_index["General Index"];
  const years = ["2020", "2021", "2022", "2023", "2024", "2025"];
  const dsc = years.map((y) => {
    const v = Object.entries(res).filter(([k]) => k.startsWith(y)).map(([, x]) => x);
    return v.reduce((a, b) => a + b, 0) / v.length;
  });
  charts.push(["two-sources", lineChart({
    title: "Two official sources, two different answers",
    subtitle: "Dubai home prices since 2019, both rebased to 2019 = 100",
    source: "Sources: Dubai Land Department transactions; Dubai Statistics Center index",
    xLabels: years,
    series: [
      { name: "DLD median", values: years.map((y) => (sq[y].median_aed_sqm / base) * 100) },
      { name: "DSC index", values: dsc },
    ],
    yFormat: (v) => Math.round(v),
  })]);
}

for (const [name, svg] of charts) {
  await writeFile(path.join(OUT, `${name}.svg`), svg);
  const info = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, `${name}.png`));
  console.log(`  ${name}.png  ${info.width}x${info.height}  ${Math.round(info.size / 1024)}KB`);
}
