import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { safeNext } from "@/lib/next-path";

/**
 * Password sign-in, deliberately unlinked from the main page.
 *
 * Google is the only advertised route. This exists so a Google outage, an
 * expired secret or a misconfigured redirect cannot lock an administrator out
 * of their own site.
 */
export const metadata: Metadata = {
  title: "Sign in with a password",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function PasswordSignInPage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  return (
    <div className="col py-xl">
      <div className="mx-auto max-w-[24rem]">
        <h1 className="text-step-3">Sign in with a password</h1>
        <p className="meta mt-2xs mb-l">
          Most people should <Link href="/signin">continue with Google</Link>. This
          page is a fallback.
        </p>
        <AuthForm next={next} mode="signin" googleEnabled={false} />
      </div>
    </div>
  );
}
