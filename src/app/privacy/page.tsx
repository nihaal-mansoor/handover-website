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

      <h2 className="mt-l">Comments and forum posts</h2>
      <p>
        If you post publicly, your display name and the content of your post are
        visible to everyone. Posts are reviewed before they appear. We keep the
        account email privately for moderation and to contact you about your account.
      </p>

      <h2 className="mt-l">Processors we use</h2>
      <p>
        Your submission is stored in a managed Postgres database and delivered to us
        by a transactional email provider. Form submissions are screened by
        Cloudflare Turnstile to block automated abuse. Each provider processes the
        data only to deliver that specific function.
      </p>

      <h2 className="mt-l">Analytics</h2>
      <p>
        <strong>Only if you consent:</strong> Google Analytics, to count visits and
        see which answers people find useful. It is not loaded, and no request is
        made to it, unless you choose Allow. Decline and it is never requested. It
        is not used for advertising or to build a profile of you, and you can change
        your mind by clearing this site&rsquo;s data in your browser.
      </p>
      <p>
        <strong>Always on:</strong> Vercel Analytics and Vercel Speed Insights, which
        are provided by the company that hosts this site. They count page views and
        measure how quickly pages load. They set no cookies, do not track you between
        websites, and do not identify you. We use them to know whether the site is
        fast enough and which pages are worth writing more about.
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
