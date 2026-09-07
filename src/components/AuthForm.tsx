"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, signUp } from "@/lib/auth-client";

/**
 * One component for both modes. Google first, because it is the path most
 * people will take; email and password below it for everyone else.
 */
export function AuthForm({ mode, googleEnabled }: { mode: "signin" | "signup"; googleEnabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSignUp = mode === "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "");

    const res = isSignUp
      ? await signUp.email({ email, password, name })
      : await signIn.email({ email, password });

    if (res.error) {
      setError(res.error.message ?? "That did not work. Check your details and try again.");
      setBusy(false);
      return;
    }
    // A full navigation, not router.push. The session lives in a cookie the
    // server reads when it renders the layout, and a client-side push can win
    // the race and leave you on the sign-in page looking like nothing happened.
    window.location.assign("/");
  }

  return (
    <div>
      {googleEnabled && (
        <>
          <button
            type="button"
            className="btn btn-quiet w-full"
            disabled={busy}
            onClick={() => signIn.social({ provider: "google", callbackURL: "/" })}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h6c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8.1z"/>
              <path fill="#34A853" d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9C3.7 20.5 7.6 23 12 23z"/>
              <path fill="#FBBC05" d="M5.6 13.8c-.2-.7-.4-1.4-.4-2.3s.2-1.6.4-2.3V6.3H1.8C1 7.9.5 9.7.5 11.5s.5 3.6 1.3 5.2l3.8-2.9z"/>
              <path fill="#EA4335" d="M12 4.6c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.1 15.1 0 12 0 7.6 0 3.7 2.5 1.8 6.3l3.8 2.9C6.5 6.5 9 4.6 12 4.6z"/>
            </svg>
            Continue with Google
          </button>
          <p className="meta my-m text-center">or</p>
        </>
      )}

      <form onSubmit={onSubmit} className="space-y-s">
        {isSignUp && (
          <div>
            <label className="meta mb-2xs block" htmlFor="name">Display name</label>
            <input id="name" name="name" required maxLength={60} autoComplete="name" className="field" />
          </div>
        )}
        <div>
          <label className="meta mb-2xs block" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div>
          <label className="meta mb-2xs block" htmlFor="password">Password</label>
          <input
            id="password" name="password" type="password" required minLength={10}
            autoComplete={isSignUp ? "new-password" : "current-password"} className="field"
          />
          {isSignUp && <p className="meta mt-2xs">At least 10 characters.</p>}
        </div>

        {error && (
          <p role="alert" className="meta" style={{ color: "#B3271E" }}>{error}</p>
        )}

        <button type="submit" className="btn w-full" disabled={busy}>
          {busy ? "Working…" : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="meta mt-m text-center">
        {isSignUp ? (
          <>Already have an account? <Link href="/signin">Sign in</Link></>
        ) : (
          <>No account? <Link href="/signup">Create one</Link></>
        )}
      </p>
    </div>
  );
}
