export const CONSENT_KEY = "handover.consent.v2";

/**
 * Consent is stored per category so it can be revisited, rather than as one
 * yes/no that can only be answered once.
 *
 * `necessary` is not a choice: it covers the session cookie that signing in
 * requires, which is why it is listed but not switchable.
 */
export interface ConsentState {
  readonly analytics: boolean;
  readonly decidedAt: string;
}

export function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<ConsentState>;
    return typeof v.analytics === "boolean"
      ? { analytics: v.analytics, decidedAt: v.decidedAt ?? "" }
      : null;
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean): void {
  try {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ analytics, decidedAt: new Date().toISOString() }),
    );
  } catch {
    /* private mode, or storage blocked */
  }
  window.dispatchEvent(new Event("handover:consent"));
}

/** Opens the preferences panel from anywhere, e.g. the footer link. */
export function openConsentSettings(): void {
  window.dispatchEvent(new Event("handover:consent-open"));
}
