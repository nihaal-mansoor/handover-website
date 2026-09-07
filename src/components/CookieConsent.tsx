"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readConsent, writeConsent } from "@/lib/consent";

const CATEGORIES = [
  {
    key: "necessary" as const,
    name: "Necessary",
    always: true,
    text:
      "Necessary cookies are required to enable the basic features of this site, " +
      "such as keeping you signed in and remembering your cookie preferences. " +
      "They cannot be switched off.",
  },
  {
    key: "analytics" as const,
    name: "Analytics",
    always: false,
    text:
      "Analytics cookies help us understand how visitors interact with the site, " +
      "such as which answers are read and how people arrive. The information is " +
      "reported in aggregate and is not used to identify you.",
  },
  {
    key: "performance" as const,
    name: "Performance",
    always: false,
    text:
      "Performance cookies are used to measure how quickly pages load, which helps " +
      "us find and fix problems that make the site slower to use.",
  },
];

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, performance: false });

  useEffect(() => {
    const existing = readConsent();
    if (!existing) setOpen(true);
    else setPrefs({ analytics: existing.analytics, performance: existing.performance });

    const reopen = () => {
      const c = readConsent();
      setPrefs({ analytics: c?.analytics ?? false, performance: c?.performance ?? false });
      setDetail(true);
      setOpen(true);
    };
    window.addEventListener("handover:consent-open", reopen);
    return () => window.removeEventListener("handover:consent-open", reopen);
  }, []);

  if (!open) return null;

  const decide = (next: { analytics: boolean; performance: boolean }) => {
    writeConsent(next);
    setOpen(false);
    setDetail(false);
  };

  return (
    <div className="consent-card" role="dialog" aria-modal="false" aria-labelledby="consent-h">
      <h2 id="consent-h" className="text-step-0" style={{ fontFamily: "var(--font-sans)" }}>
        We value your privacy
      </h2>

      {!detail ? (
        <>
          <p className="meta mt-2xs">
            We use cookies to enable essential site functionality and, with your
            permission, to understand how the site is used so we can improve it. You
            can accept all cookies, reject all non-essential cookies, or choose which
            categories to allow. Read our <Link href="/privacy">privacy policy</Link>.
          </p>
          <div className="mt-s flex flex-wrap gap-xs">
            <button type="button" className="btn"
                    onClick={() => decide({ analytics: true, performance: true })}>
              Accept all
            </button>
            <button type="button" className="btn btn-quiet"
                    onClick={() => decide({ analytics: false, performance: false })}>
              Reject all
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setDetail(true)}>
              Customise
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="meta mt-2xs">
            Choose which categories of cookies you allow. Necessary cookies are always
            active because the site cannot work without them.
          </p>

          <ul className="mt-s m-0 list-none p-0">
            {CATEGORIES.map((c) => (
              <li key={c.key} className="border-t border-rule py-s">
                <div className="flex items-start justify-between gap-s">
                  <p className="m-0 text-step--1" style={{ fontWeight: 600 }}>{c.name}</p>
                  {c.always ? (
                    <span className="meta shrink-0" style={{ color: "var(--accent)" }}>
                      Always active
                    </span>
                  ) : (
                    <label className="shrink-0">
                      <span className="sr-only">Allow {c.name.toLowerCase()} cookies</span>
                      <input
                        type="checkbox"
                        checked={prefs[c.key as "analytics" | "performance"]}
                        onChange={(e) =>
                          setPrefs((p) => ({ ...p, [c.key]: e.target.checked }))
                        }
                      />
                    </label>
                  )}
                </div>
                <p className="meta m-0 mt-2xs">{c.text}</p>
              </li>
            ))}
          </ul>

          <div className="mt-m flex flex-wrap gap-xs">
            <button type="button" className="btn" onClick={() => decide(prefs)}>
              Save my preferences
            </button>
            <button type="button" className="btn btn-quiet"
                    onClick={() => decide({ analytics: true, performance: true })}>
              Accept all
            </button>
          </div>
        </>
      )}
    </div>
  );
}
