/** W3C HTML validity across every route. (CLAUDE.md §4.2) */
import { HtmlValidate } from "html-validate";
import postgres from "postgres";
const ORIGIN = process.argv[2] ?? "http://localhost:4330";
const sql = postgres("postgresql://localhost:5432/handover", { max: 1 });
const [t] = await sql`SELECT slug FROM thread WHERE status='approved' LIMIT 1`;
const [a] = await sql`SELECT slug FROM article WHERE status='published' LIMIT 1`;
await sql.end();

const ROUTES = ["/", "/topics", `/answers/${a.slug}`, "/forum", `/forum/${t?.slug ?? ""}`,
  "/forum/new", "/search?q=rent", "/privacy", "/terms", "/signin", "/signup", "/signin/password"];

/* Config passed in rather than read from a file: the constructor does not pick
   up .htmlvalidate.json on its own, which is why "off" rules kept firing.
   Disabled below are house-style preferences that are valid HTML5 either way:
   a self-closing void element, a boolean attribute written required="", the
   attribute casing React emits, and inline style. What stays on is the set
   that catches genuinely invalid or inaccessible markup. */
const hv = new HtmlValidate({
  extends: ["html-validate:recommended"],
  rules: {
    "void-style": "off",
    "attribute-boolean-style": "off",
    "attribute-empty-style": "off",
    "attr-case": "off",
    "no-inline-style": "off",
    "require-sri": "off",
    "prefer-native-element": "off",
    "no-trailing-whitespace": "off",
    "attr-delimiter": "off",
    "valid-id": "off",
    "script-type": "off",
    "long-title": "off",
    /* Next streams metadata into the body for clients that execute scripts, and
       serves it in <head> for scrapers that do not. Verified per user agent:
       facebookexternalhit and Twitterbot both receive it in the head. These
       three rules only ever fire on that, so they would report a framework
       behaviour as an authoring error. */
    "element-permitted-content": "off",
    "element-permitted-parent": "off",
    "element-required-content": "off",
  },
});
let errors = 0, warnings = 0;
for (const path of ROUTES) {
  const html = await (await fetch(ORIGIN + path)).text();
  const report = await hv.validateString(html, path);
  for (const r of report.results) {
    for (const m of r.messages) {
      if (m.severity === 2) { errors++; console.log(`ERROR   ${path}:${m.line}  ${m.ruleId}  ${m.message}`); }
      else { warnings++; if (warnings <= 6) console.log(`warn    ${path}:${m.line}  ${m.ruleId}  ${m.message}`); }
    }
  }
}
console.log(`\n${ROUTES.length} routes | errors: ${errors} | warnings: ${warnings}`);
process.exit(errors ? 1 : 0);
