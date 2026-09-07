import type { Metadata } from "next";
import Link from "next/link";
import { SignInLink } from "@/components/SignInLink";
import { getCurrentUser } from "@/lib/queries";
import { NewThreadForm } from "@/components/NewThreadForm";

export const metadata: Metadata = { title: "Start a thread", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewThreadPage() {
  const account = await getCurrentUser();

  return (
    <div className="col py-xl">
      <p className="meta"><Link href="/forum">Forum</Link></p>
      <h1 className="mt-2xs text-step-3">Start a thread</h1>

      {account ? (
        <div className="mt-l">
          <NewThreadForm />
        </div>
      ) : (
        <p className="mt-m text-ink-2">
          <SignInLink>Sign in</SignInLink> or{" "}
          <SignInLink route="/signup">create an account</SignInLink> to post.
        </p>
      )}
    </div>
  );
}
