import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton } from "@/components/GoogleButton";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function SignInPage() {
  const googleEnabled = Boolean(
    process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"],
  );

  return (
    <div className="col py-xl">
      <div className="mx-auto max-w-[24rem]">
        <h1 className="text-step-3">Sign in</h1>
        <p className="meta mt-2xs mb-l">
          You only need an account to post. Reading needs nothing.
        </p>

        {googleEnabled ? (
          <GoogleButton />
        ) : (
          <p className="meta">
            Google sign-in is not configured.{" "}
            <Link href="/signin/password">Use a password instead</Link>.
          </p>
        )}

        <p className="meta mt-l">
          By continuing you agree to our <Link href="/terms">terms</Link> and{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>
      </div>
    </div>
  );
}
