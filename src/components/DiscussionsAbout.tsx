import Link from "next/link";
import { discussionStats } from "@/lib/queries";

/**
 * The panel Reddit puts to the right of a post: what this place is, how big it
 * is, and what the rules are.
 *
 * The rules are the useful part rather than decoration. Every one of them is a
 * real constraint this site operates under, and stating them up front is how
 * you get fewer posts that have to be removed afterwards, which matters more
 * now that posts publish immediately.
 */
export async function DiscussionsAbout() {
  const stats = await discussionStats();

  return (
    <aside className="rail-right" aria-label="About the discussions">
      <div className="rail-sticky">
        <section>
          <p className="rail-heading">About</p>
          <p className="meta m-0">
            A place to post what actually happened when you bought, sold, rented
            or handed over in the UAE. First-hand detail beats opinion.
          </p>

          <dl className="stat-row mt-m">
            <div>
              <dt className="meta">Discussions</dt>
              <dd className="stat-n">{stats.threads}</dd>
            </div>
            <div>
              <dt className="meta">Comments</dt>
              <dd className="stat-n">{stats.replies}</dd>
            </div>
            <div>
              <dt className="meta">People</dt>
              <dd className="stat-n">{stats.members}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-l border-t border-rule pt-m">
          <p className="rail-heading">Guidelines</p>
          <ol className="guideline-list">
            <li>
              <strong>No advertising a property.</strong> Advertising property in
              Dubai needs a permit this site does not hold, so a specific unit
              with a price, or a post touting one to buyers, is removed.
            </li>
            <li>
              <strong>No contact details.</strong> Phone numbers, emails and
              WhatsApp links in public posts get scraped.
            </li>
            <li>
              <strong>Say what actually happened.</strong> Dates, figures and the
              name of the process are what make a post useful to the next person.
            </li>
            <li>
              <strong>No agent promotion.</strong> Naming who you used is fine.
              Selling your own services is not.
            </li>
            <li>
              <strong>Do not post other people&rsquo;s documents.</strong> Redact
              names, unit numbers and reference numbers before uploading a photo.
            </li>
          </ol>
        </section>

        <section className="mt-l border-t border-rule pt-m">
          <p className="rail-heading">Researched answers</p>
          <p className="meta m-0">
            The <Link href="/">articles</Link> cover the same ground with sourced
            figures and a stated method.
          </p>
        </section>
      </div>
    </aside>
  );
}
