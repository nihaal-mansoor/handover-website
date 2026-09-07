"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readConsent, writeConsent, type ConsentValue } from "@/lib/consent";

/**
 * Asks once, remembers the answer, and reserves its own space so it cannot
 * shift the page. (CLAUDE.md §4.6)
 */
export function ConsentBanner() {
  const [decided, setDecided] = useState(true);

  useEffect(() => {
    setDecided(readConsent() !== null);
  }, []);

  if (decided) return null;

  const choose = (v: ConsentValue) => {
    writeConsent(v);
    setDecided(true);
    window.dispatchEvent(new Event("handover:consent"));
  };

  return (
    <div
      role="region"
      aria-label="Analytics consent"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-rule"
      style={{ background: "var(--surface)" }}
    >
      <div className="shell flex flex-wrap items-center justify-between gap-s py-s">
        <p className="meta m-0 max-w-[60ch]">
          We would like to count visits with Google Analytics to see which answers
          people find useful. Decline and it is never loaded.{" "}
          <Link href="/privacy">What we collect</Link>.
        </p>
        <div className="flex shrink-0 gap-xs">
          <button type="button" className="btn btn-quiet" onClick={() => choose("denied")}>
            Decline
          </button>
          <button type="button" className="btn" onClick={() => choose("granted")}>
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
