"use client";
import { openConsentSettings } from "@/lib/consent";

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      className="meta"
      style={{ background: "none", border: 0, padding: 0, cursor: "pointer", textDecoration: "underline" }}
      onClick={openConsentSettings}
    >
      Cookies
    </button>
  );
}
