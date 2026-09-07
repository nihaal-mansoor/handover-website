import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton } from "@/components/GoogleButton";
import { safeNext } from "@/lib/next-path";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const googleEnabled = Boolean(process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]);
  return (
    <div className="col py-xl">
      <div className="mx-auto max-w-[24rem]">
        <h1 className="text-step-3">Create an account</h1>
        <p className="meta mt-2xs mb-l">
          So you can comment, post and vote in the forum.
        </p>
        {googleEnabled ? (
          <GoogleButton next={next} />
        ) : (
          <p className="meta">Google sign-in is not configured.</p>
        )}
        <p className="meta mt-l">
          By continuing you agree to our <Link href="/terms">terms</Link> and{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>
      </div>
    </div>
  );
}
