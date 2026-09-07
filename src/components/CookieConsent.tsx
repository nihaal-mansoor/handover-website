"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readConsent, writeConsent } from "@/lib/consent";

/**
 * Cookie preferences.
 *
 * A quiet card in the corner rather than a bar across the page, and it can be
 * reopened from the footer, so a decision is revisable rather than one-shot.
 * Analytics defaults to off in the detail view: an unticked box is the honest
 * default when the privacy page says nothing loads without consent.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) setOpen(true);
    else setAnalytics(existing.analytics);

    const reopen = () => {
      setAnalytics(readConsent()?.analytics ?? false);
      setDetail(true);
      setOpen(true);
    };
    window.addEventListener("handover:consent-open", reopen);
    return () => window.removeEventListener("handover:consent-open", reopen);
  }, []);

  if (!open) return null;

  const decide = (a: boolean) => { writeConsent(a); setOpen(false); setDetail(false); };

  return (
    <div className="consent-card" role="dialog" aria-modal="false" aria-labelledby="consent-h">
      <h2 id="consent-h" className="text-step-0" style={{ fontFamily: "var(--font-sans)" }}>
        Cookies
      </h2>

      {!detail ? (
        <>
          <p className="meta mt-2xs">
            We use a cookie to keep you signed in, and we would like to count visits so
            we know which answers are worth writing more of. Nothing is used for
            advertising.
          </p>
          <div className="mt-s flex flex-wrap gap-xs">
            <button type="button" className="btn" onClick={() => decide(true)}>Accept</button>
            <button type="button" className="btn btn-quiet" onClick={() => decide(false)}>Reject</button>
            <button type="button" className="btn btn-quiet" onClick={() => setDetail(true)}>Manage</button>
          </div>
        </>
      ) : (
        <>
          <ul className="mt-s m-0 list-none p-0 space-y-s">
            <li>
              <div className="flex items-start justify-between gap-s">
                <div>
                  <p className="m-0 text-step--1" style={{ fontWeight: 600 }}>Necessary</p>
                  <p className="meta m-0">
                    Keeps you signed in and remembers this choice. Cannot be turned off.
                  </p>
                </div>
                <span className="meta shrink-0" style={{ color: "var(--accent)" }}>Always on</span>
              </div>
            </li>
            <li className="border-t border-rule pt-s">
              <div className="flex items-start justify-between gap-s">
                <div>
                  <p className="m-0 text-step--1" style={{ fontWeight: 600 }}>Analytics</p>
                  <p className="meta m-0">
                    Google Analytics, to count visits. Not loaded at all unless you allow it.
                  </p>
                </div>
                <label className="shrink-0 flex items-center gap-xs text-step--1">
                  <input
                    type="checkbox" checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                  />
                  <span className="sr-only">Allow analytics</span>
                </label>
              </div>
            </li>
          </ul>
          <div className="mt-m flex flex-wrap gap-xs">
            <button type="button" className="btn" onClick={() => decide(analytics)}>
              Save choices
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => decide(true)}>
              Accept all
            </button>
          </div>
        </>
      )}

      <p className="meta mt-s mb-0">
        <Link href="/privacy">How we handle data</Link>
      </p>
    </div>
  );
}
