import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Handover records, who receives it, and how to have it erased.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="col py-xl">
      <h1>What we collect and why</h1>
      <p className="mt-m text-ink-2">
        Short version: you can read everything here without an account and without
        being tracked for advertising. We only hold something about you if you
        subscribe, create an account, or post.
      </p>

      <h2 className="mt-l">If you subscribe to the newsletter</h2>
      <p>
        We store your email address, the page you subscribed from, the date and time,
        and your IP address. The IP is kept because it is how we evidence that the
        subscription was genuine and how we detect automated abuse. Every email we
        send carries an unsubscribe link, and unsubscribing stops all further email.
      </p>
      <p>
        We do not sell your address, and we do not pass it to anyone for marketing.
      </p>

      <h2 className="mt-l">If you create an account</h2>
      <p>
        You can sign in with Google or with an email address and password. We store
        your display name, your email address, and, where you use Google, the account
        identifier Google returns so we can recognise you next time. We never receive
        your Google password. If you set a password here it is stored hashed, never
        in plain text.
      </p>
      <p>
        Your display name is public on anything you post. Your email address is not,
        and is used only for moderation and to contact you about your account.
      </p>

      <h2 className="mt-l">Comments and discussion posts</h2>
      <p>
        If you post publicly, your display name and the content of your post are
        visible to everyone as soon as you post. Posts are checked automatically
        before they are stored, and a moderator can remove one afterwards. You can
        delete your own posts at any time.
      </p>
      <p>
        We record the IP address a post was made from, to handle abuse. It is never
        shown publicly. If you attach an image it is re-encoded before it is stored,
        which removes any camera metadata it carried, including location. The image
        itself is public and stays public until you or a moderator deletes it.
      </p>

      <h2 className="mt-l">Processors we use</h2>
      <p>
        Accounts, posts and subscriptions are stored in a managed Postgres database.
        Uploaded images are held in managed file storage. The site is hosted on
        Vercel. If you sign in with Google, Google confirms your identity to us and
        tells you what it shares at the point you agree. Each provider processes the
        data only to deliver that specific function.
      </p>

      <h2 className="mt-l">Cookies and analytics</h2>
      <p>
        <strong>Necessary.</strong> A cookie keeps you signed in if you have an
        account, and another remembers your cookie choice so we do not ask again.
        These are required for the site to work and cannot be switched off.
      </p>
      <p>
        <strong>Analytics.</strong> We use Google Analytics to understand which
        answers people read and how they arrive. It operates under Google Consent
        Mode: until you allow analytics cookies, it is prevented from storing
        anything on your device or identifying you, and only an anonymous,
        cookieless signal is recorded so we can count visits. If you allow analytics
        cookies, it measures visits in the ordinary way. Either way it is never used
        for advertising and we do not use it to build a profile of you.
      </p>
      <p>
        <strong>Performance.</strong> Vercel Analytics and Speed Insights, provided
        by the company that hosts this site, count page views and measure how quickly
        pages load. They set no cookies and do not track you between websites.
      </p>
      <p>
        You can change any of this at any time using the{" "}
        <strong>Cookies</strong> link in the footer.
      </p>

      <h2 className="mt-l">How long we keep it</h2>
      <p>
        Posts stay until you delete them or ask us to. Newsletter records are kept
        until you unsubscribe, and are cleared within 24 months of that. Account
        records are kept while the account exists. To have anything removed sooner,
        email{" "}
        <a href="mailto:privacy@dubairealestateadvice.com">
          privacy@dubairealestateadvice.com
        </a>
        . You do not have to give a reason, and we will confirm when it is done.
      </p>

      <h2 className="mt-l">Your rights</h2>
      <p>
        Under the UAE Personal Data Protection Law you can ask what we hold about
        you, ask for it to be corrected or deleted, and withdraw consent at any time.
        Deleting your account removes your posts along with it, so tell us if you
        would rather keep the posts and remove only the account.
      </p>
    </article>
  );
}
