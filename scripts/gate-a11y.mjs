/**
 * axe-core across every route, in both colour schemes and both auth states.
 *
 *   node scripts/gate-a11y.mjs [origin]
 *
 * Runs the WCAG 2.0/2.1/2.2 A and AA rulesets. Both schemes matter because
 * contrast is computed from what is actually painted, so a token that only
 * fails in dark mode is invisible to a single-theme run. (CLAUDE.md §4.2)
 */
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import postgres from "postgres";

const ORIGIN = process.argv[2] ?? "http://localhost:4330";
const AXE = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const sql = postgres(process.env.DATABASE_URL ?? "postgresql://localhost:5432/handover", { max: 1 });
const [t] = await sql`SELECT slug FROM thread WHERE status='approved' LIMIT 1`;
const [a] = await sql`SELECT slug FROM article WHERE status='published' LIMIT 1`;

async function signUp(name, admin) {
  const email = `a11y-${name}-${Date.now()}@example.test`;
  const r = await fetch(`${ORIGIN}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: ORIGIN, referer: ORIGIN + "/signup" },
    body: JSON.stringify({ email, password: "TestPassword123!", name }),
  });
  if (admin) await sql`UPDATE "user" SET role='admin' WHERE email=${email}`;
  return (r.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
}
const readerCookie = await signUp("reader", false);
const adminCookie = await signUp("admin", true);

const ROUTES = [
  ["/", null], ["/topics", null], [`/answers/${a.slug}`, null],
  ["/forum", null], [`/forum/${t?.slug ?? ""}`, null], ["/forum/new", null],
  ["/search?q=rent", null], ["/privacy", null], ["/terms", null],
  ["/signin", null], ["/signup", null], ["/signin/password", null],
  ["/forum/new", readerCookie], [`/forum/${t?.slug ?? ""}`, readerCookie],
  ["/admin", adminCookie], ["/admin/articles", adminCookie],
];

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", args: ["--no-sandbox"],
});

const found = new Map();
let checks = 0;

for (const scheme of ["light", "dark"]) {
  for (const [path, cookie] of ROUTES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
    if (cookie) {
      const [n, ...v] = cookie.split("=");
      await page.setCookie({ name: n, value: decodeURIComponent(v.join("=")), domain: new URL(ORIGIN).hostname, path: "/" });
    }
    await page.goto(ORIGIN + path, { waitUntil: "networkidle2" });
    await page.evaluate(AXE);
    const res = await page.evaluate(
      (tags) => axe.run(document, { runOnly: { type: "tag", values: tags }, resultTypes: ["violations"] }),
      TAGS,
    );
    checks++;
    for (const v of res.violations) {
      const key = v.id;
      if (!found.has(key)) found.set(key, { impact: v.impact, help: v.help, wcag: v.tags.filter(t => /^wcag/.test(t)).join(","), where: [], nodes: [] });
      const e = found.get(key);
      e.where.push(`${scheme}:${path}${cookie ? " (auth)" : ""}`);
      v.nodes.slice(0, 1).forEach(n => { if (e.nodes.length < 2) e.nodes.push(n.html.slice(0, 130)); });
    }
    await page.close();
  }
}
await browser.close();
await sql`DELETE FROM "user" WHERE email LIKE 'a11y-%@example.test'`;
await sql.end();

console.log(`axe-core ${TAGS.join(" ")}\n${checks} page renders checked (${ROUTES.length} routes x light/dark)\n`);
if (!found.size) { console.log("zero violations"); process.exit(0); }
for (const [id, v] of [...found].sort((a, b) => a[1].impact === "critical" ? -1 : 1)) {
  console.log(`[${v.impact}] ${id}  (${v.wcag})`);
  console.log(`  ${v.help}`);
  console.log(`  on ${v.where.length} render(s), e.g. ${v.where.slice(0, 3).join(", ")}`);
  v.nodes.forEach(n => console.log(`    ${n}`));
  console.log();
}
process.exit(1);
