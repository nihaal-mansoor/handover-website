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
import { allArticles, allTopics } from "../src/lib/content.ts";

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

const routes = [
  "/",
  "/topics",
  "/forum",
  "/privacy",
  "/terms",
  ...allArticles().map((a) => `/answers/${a.slug}`),
  ...allTopics().map((t) => `/topics/${t.slug}`),
];

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
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  for (const route of routes) {
    const res = await fetch(`http://localhost:${PORT}${route}`);
    if (!res.ok) throw new Error(`${route} returned ${res.status}`);
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
