export const CONSENT_KEY = "handover.consent.v1";

export type ConsentValue = "granted" | "denied";

/** Read the stored decision. Returns null if the reader has not chosen yet. */
export function readConsent(): ConsentValue | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(v: ConsentValue): void {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* private mode, or storage blocked */
  }
}
