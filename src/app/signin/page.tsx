import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton } from "@/components/GoogleButton";
import { safeNext } from "@/lib/next-path";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
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
          <GoogleButton next={next} />
        ) : (
          <p className="meta">
            Google sign-in is not configured.{" "}
            <Link href={next === "/" ? "/signin/password" : `/signin/password?next=${encodeURIComponent(next)}`}>Use a password instead</Link>.
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
