import type { Metadata } from "next";
import Link from "next/link";
import { SignInLink } from "@/components/SignInLink";
import { getCurrentUser } from "@/lib/queries";
import { NewThreadForm } from "@/components/NewThreadForm";

export const metadata: Metadata = { title: "Start a discussion", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewThreadPage() {
  const account = await getCurrentUser();

  return (
    <div className="col py-xl">
      <p className="meta"><Link href="/forum">Discussions</Link></p>
      <h1 className="mt-2xs text-step-3">Start a discussion</h1>

      {account ? (
        <div className="mt-l">
          <NewThreadForm />

          {/* The About panel carries these too, but it is display:none below
              84rem, so on a phone nobody would ever see them. They matter most
              here anyway, in front of someone about to post. */}
          <details className="guideline-note mt-l">
            <summary className="post-action">Before you post</summary>
            <ol className="guideline-list mt-s">
              <li>
                <strong>No advertising a property.</strong> Advertising property
                in Dubai needs a permit this site does not hold, so a specific
                unit with a price, or a post touting one to buyers, is removed.
                That applies to images as much as to words.
              </li>
              <li>
                <strong>No contact details.</strong> Phone numbers, emails and
                WhatsApp links in public posts get scraped.
              </li>
              <li>
                <strong>Redact before you upload.</strong> Names, unit numbers
                and reference numbers on a photographed document stay readable
                to everyone.
              </li>
            </ol>
          </details>
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
