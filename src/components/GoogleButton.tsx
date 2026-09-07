"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export function GoogleButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn w-full"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        signIn.social({ provider: "google", callbackURL: "/" });
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h6c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8.1z"/>
        <path fill="#34A853" d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9C3.7 20.5 7.6 23 12 23z"/>
        <path fill="#FBBC05" d="M5.6 13.8c-.2-.7-.4-1.4-.4-2.3s.2-1.6.4-2.3V6.3H1.8C1 7.9.5 9.7.5 11.5s.5 3.6 1.3 5.2l3.8-2.9z"/>
        <path fill="#EA4335" d="M12 4.6c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.1 15.1 0 12 0 7.6 0 3.7 2.5 1.8 6.3l3.8 2.9C6.5 6.5 9 4.6 12 4.6z"/>
      </svg>
      {busy ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}
