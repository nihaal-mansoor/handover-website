import type { Metadata } from "next";
import config from "../../../site.config";
import { disclaimer } from "@uaeprop/site-kit";

export const metadata: Metadata = {
  title: "Terms",
  description: "What Handover is, what it is not, and the limits of what to rely on it for.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="col py-xl">
      <h1>What this site is, and is not</h1>

      <h2 className="mt-l">We are not a broker</h2>
      <p className="mt-m">{disclaimer(config.brand)}</p>
      <p>
        Nothing on this site is an offer to sell property, an invitation to buy one,
        or an advertisement for any specific unit. We hold no Dubai Land Department
        advertising permit because we advertise nothing.
      </p>

      <h2 className="mt-l">This is information, not advice</h2>
      <p>
        The answers here describe how transactions generally work. They are not
        legal, financial or tax advice, and they cannot account for your
        circumstances. Before you commit to a purchase, take advice from a qualified
        professional who knows your situation.
      </p>

      <h2 className="mt-l">Figures go out of date</h2>
      <p>
        Fees, thresholds and lending rules change, sometimes without notice. Every
        answer carries the date it was published. Treat every number here as
        indicative and confirm it with the Dubai Land Department, your lender or your
        conveyancer before you rely on it. We do not warrant that any figure is
        current.
      </p>

      <h2 className="mt-l">What other people post</h2>
      <p>
        Comments and forum posts are written by readers, not by us. They are reviewed
        before publication, but review is not verification: we do not check that any
        account of events is accurate, and publishing a post is not an endorsement of
        it. Do not treat another reader’s experience as advice about your own.
      </p>
      <p>
        Posting a property for sale or rent, a price for a specific unit, or any
        other advertisement is not permitted and will be rejected. Advertising
        property in Dubai requires a permit that neither we nor most posters hold.
      </p>

      <h2 className="mt-l">Introductions</h2>
      <p>
        If we introduce you to a licensed brokerage, that firm is independent of us.
        We do not supervise their advice, control their fees, or take responsibility
        for their conduct. Satisfy yourself about any firm before you instruct them.
        You can verify a brokerage and its agents with the Dubai Land Department
        directly. We may be paid a fee for the introduction.
      </p>

      <h2 className="mt-l">Third-party names</h2>
      <p>
        Developers, banks, authorities and projects are referred to descriptively, to
        explain how the market works. Those names belong to their owners. Reference
        does not imply affiliation, endorsement, or any authority to act on their
        behalf.
      </p>

      <h2 className="mt-l">Liability</h2>
      <p>
        This site is provided as it is. To the extent the law allows, we are not
        liable for loss arising from decisions taken on the basis of it. That is not
        a formality: property decisions are large, and this is a free resource
        written by people who are not acting for you.
      </p>
    </article>
  );
}
