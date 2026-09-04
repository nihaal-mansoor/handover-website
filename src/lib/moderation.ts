import { scanNoListings, scanNoFabrication } from "@uaeprop/site-kit/testing";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Runs a submission through the same scanners the build uses, before it is
 * stored. (CLAUDE.md §1.1, §1.2)
 *
 * The scanners read built HTML from a directory, so a submission is wrapped in
 * a minimal document and scanned in a temp dir. That is slower than a pure
 * string check, but it means user posts and our own pages are judged by exactly
 * the same rules, and a rule fix applies to both at once.
 */

export interface ScanResult {
  readonly ok: boolean;
  /** Rule id that rejected it, for the moderator. Never shown to the poster. */
  readonly flag?: string;
  /** What to tell the poster. Deliberately unspecific about which rule fired. */
  readonly message?: string;
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function scanSubmission(text: string): Promise<ScanResult> {
  const dir = await mkdtemp(join(tmpdir(), "handover-scan-"));
  try {
    await writeFile(
      join(dir, "post.html"),
      `<!doctype html><html lang="en"><head><title>s</title></head><body><main>${escapeHtml(text)}</main></body></html>`,
      "utf8",
    );

    const [listings, fabrication] = await Promise.all([
      scanNoListings(dir),
      scanNoFabrication(dir),
    ]);

    if (listings.findings.length > 0) {
      return {
        ok: false,
        flag: listings.findings[0]?.rule ?? "no-listings",
        message:
          "Posts cannot advertise a property. Advertising property in Dubai needs a permit. " +
          "Describe your experience without prices attached to a specific unit.",
      };
    }
    if (fabrication.findings.length > 0) {
      return {
        ok: false,
        flag: fabrication.findings[0]?.rule ?? "no-fabrication",
        message:
          "Posts cannot include licence numbers, credentials or business claims. " +
          "Please rewrite without them.",
      };
    }
    return { ok: true };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
