/**
 * Compliance gate for the Next.js build. (CLAUDE.md §4.7)
 *
 * Astro emitted static HTML the scanners could read directly. Next emits a
 * server bundle, so this renders every route through a real server, writes the
 * HTML out, and scans that. Without it the §1 guarantees silently lapse.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { runComplianceGate } from "@uaeprop/site-kit/testing";

/** A fixed port collides with whatever else is being served locally. */
async function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

const PORT = await freePort();
const OUT = ".gate";
const DOMAIN = "dubairealestateadvice.com";

/**
 * Routes are discovered by crawling rather than imported from the content layer.
 * That covers database-backed articles as well as MDX, and avoids importing
 * application code that relies on TypeScript path aliases plain Node cannot
 * resolve.
 */
const SEEDS = ["/", "/topics", "/forum", "/signin", "/signup", "/privacy", "/terms"];

async function discover(port) {
  const found = new Set(SEEDS);
  /*
   * Forum threads are crawled from every sort and category view, not just the
   * default one. The listing shows fifty at a time, so a thread that has fallen
   * past that on "best" can still be reachable under "new" or inside its
   * category, and a thread the gate never renders is a thread the §1.1 scanner
   * never reads. Reader-written posts are the likeliest place a listing appears,
   * so missing them defeats the point of the check.
   */
  const seeds = [
    "/", "/topics", "/forum", "/forum?sort=new", "/forum?sort=top",
    ...["buying", "renting", "off-plan", "service-charges", "mortgages", "general"]
      .map((c) => `/forum?category=${c}`),
  ];
  for (const seed of seeds) {
    const html = await (await fetch(`http://localhost:${port}${seed}`)).text();
    for (const m of html.matchAll(/href="(\/(?:answers|topics|forum)\/[a-z0-9-]+)"/g)) {
      found.add(m[1]);
    }
  }
  return [...found];
}

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  stdio: ["ignore", "pipe", "pipe"],
});

let serverLog = "";
server.stdout.on("data", (d) => { serverLog += d; });
server.stderr.on("data", (d) => { serverLog += d; });
server.on("error", (e) => { serverLog += `spawn error: ${e.message}\n`; });

const stop = () => { try { server.kill("SIGTERM"); } catch {} };
process.on("exit", stop);
process.on("SIGINT", () => { stop(); process.exit(130); });

async function waitForServer(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${PORT}/`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server did not start in time.\n--- server output ---\n${serverLog || "(no output)"}`);
}

try {
  await waitForServer();
  const routes = await discover(PORT);
  console.log(`Discovered ${routes.length} routes.`);
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  for (const route of routes) {
    let res;
    try {
      res = await fetch(`http://localhost:${PORT}${route}`, { redirect: "follow" });
    } catch (e) {
      throw new Error(
        `Fetching ${route} failed: ${e instanceof Error ? e.message : e}\n` +
        `--- server output ---\n${serverLog.slice(-2000) || "(none)"}`,
      );
    }
    if (!res.ok) throw new Error(`${route} returned ${res.status}\n${serverLog.slice(-1200)}`);
    const name = route === "/" ? "index" : route.slice(1).replace(/\//g, "__");
    await writeFile(`${OUT}/${name}.html`, await res.text(), "utf8");
  }
  console.log(`Rendered ${routes.length} routes.`);

  const passed = await runComplianceGate(OUT, DOMAIN);
  stop();
  process.exit(passed ? 0 : 1);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  stop();
  process.exit(1);
}
