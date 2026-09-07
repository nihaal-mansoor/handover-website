export const CONSENT_KEY = "handover.consent.v3";

/**
 * Consent categories.
 *
 * `necessary` is not a choice and is stored only so the panel can describe it.
 * `analytics` and `performance` are separate because they answer different
 * questions and a reader may reasonably allow one and not the other.
 */
export interface ConsentState {
  readonly analytics: boolean;
  readonly performance: boolean;
  readonly decidedAt: string;
}

export const DENIED: Omit<ConsentState, "decidedAt"> = { analytics: false, performance: false };

export function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<ConsentState>;
    if (typeof v.analytics !== "boolean") return null;
    return {
      analytics: v.analytics,
      performance: v.performance ?? false,
      decidedAt: v.decidedAt ?? "",
    };
  } catch {
    return null;
  }
}

export function writeConsent(next: Omit<ConsentState, "decidedAt">): void {
  try {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ ...next, decidedAt: new Date().toISOString() }),
    );
  } catch {
    /* private mode, or storage blocked */
  }
  applyConsentMode(next.analytics);
  window.dispatchEvent(new Event("handover:consent"));
}

/**
 * Google Consent Mode v2.
 *
 * Everything is denied until a reader chooses otherwise. Under denial Google
 * sets no cookies and cannot identify anyone, but still receives a cookieless
 * ping, which keeps overall traffic figures usable rather than losing every
 * non-consenting visitor entirely.
 */
export function applyConsentMode(analytics: boolean): void {
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  w.gtag?.("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function openConsentSettings(): void {
  window.dispatchEvent(new Event("handover:consent-open"));
}
