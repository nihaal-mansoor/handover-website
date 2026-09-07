import type { Metadata } from "next";
import { CONSENT_TEXT } from "@uaeprop/site-kit";

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
        Short version: nothing unless you send it. There is no account, no login and
        no advertising trackers on this site.
      </p>

      <h2 className="mt-l">If you send us a message</h2>
      <p>
        We store the name, email address, phone number and message you submit,
        together with the page you sent it from, the date and time, your IP address
        and browser user agent. The IP and user agent are kept because they are how
        we evidence that consent was genuinely given, and how we detect automated
        abuse.
      </p>
      <p>
        We also store the exact wording of the consent you agreed to, which at the
        time of writing reads: “{CONSENT_TEXT}”
      </p>

      <h2 className="mt-l">Who it is shared with</h2>
      <p>
        If you ask to be introduced to a broker, we pass your name, contact details
        and the substance of your enquiry to a licensed UAE real estate brokerage.
        That is the point of the introduction and it is what you consent to when you
        submit the form. We may be paid by that brokerage for the introduction.
      </p>
      <p>
        We do not sell your details into marketing databases, and one introduction is
        not standing permission to keep circulating them.
      </p>

      <h2 className="mt-l">Comments and discussion posts</h2>
      <p>
        If you post publicly, your display name and the content of your post are
        visible to everyone as soon as you post. Posts are checked automatically
        before they are stored, and a moderator can remove one afterwards. You can
        delete your own posts at any time. We keep the account email privately for
        moderation and to contact you about your account.
      </p>

      <h2 className="mt-l">Processors we use</h2>
      <p>
        Your submission is stored in a managed Postgres database and delivered to us
        by a transactional email provider. Form submissions are screened by
        Cloudflare Turnstile to block automated abuse. Each provider processes the
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
        Anything you send is deleted 24 months after submission. To have yours
        removed sooner, email{" "}
        <a href="mailto:privacy@dubairealestateadvice.com">
          privacy@dubairealestateadvice.com
        </a>
        . You do not have to give a reason, and we will confirm when it is done.
      </p>

      <h2 className="mt-l">Your rights</h2>
      <p>
        Under the UAE Personal Data Protection Law you can ask what we hold about
        you, ask for it to be corrected or deleted, and withdraw consent at any time.
        Withdrawing consent does not undo an introduction already made, but it stops
        any further contact from us.
      </p>
    </article>
  );
}
