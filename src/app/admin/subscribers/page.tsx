import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { subscriber } from "@/db/schema";
import { isModerator, formatWhen } from "@/lib/queries";
import { CopyEmails } from "@/components/CopyEmails";

export const metadata: Metadata = { title: "Subscribers", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * The newsletter list, for the one person allowed to see it.
 *
 * There is no sending pipeline and deliberately no double opt-in: at this
 * volume the list is a text file that happens to live in Postgres. What matters
 * is being able to read it out, so the addresses are copyable in one action for
 * pasting into whatever eventually sends the mail.
 *
 * Addresses are personal data, so this page is admin-only, noindex, and never
 * links to itself from anywhere public.
 */
export default async function SubscribersPage() {
  if (!(await isModerator())) redirect("/signin?next=/admin/subscribers");
  if (!db) redirect("/admin");

  const rows = await db
    .select()
    .from(subscriber)
    .orderBy(desc(subscriber.createdAt))
    .limit(1000);

  const live = rows.filter((r) => !r.unsubscribedAt);

  return (
    <div className="col py-xl">
      <div className="flex flex-wrap items-center justify-between gap-s">
        <h1 className="text-step-3">Subscribers</h1>
        <Link href="/admin" className="btn btn-quiet">Queue</Link>
      </div>

      <p className="meta mt-2xs mb-l">
        {rows.length === 0
          ? "Nobody yet."
          : `${live.length} on the list${rows.length !== live.length ? `, ${rows.length - live.length} removed` : ""}. Newest first.`}
      </p>

      {rows.length > 0 && (
        <>
          <CopyEmails emails={live.map((r) => r.email)} />

          <div className="table-scroll mt-l">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th scope="col" className="text-left border-b-2 border-[var(--ink)] py-xs pr-s">Email</th>
                  <th scope="col" className="text-left border-b-2 border-[var(--ink)] py-xs pr-s">Signed up</th>
                  <th scope="col" className="text-left border-b-2 border-[var(--ink)] py-xs pr-s">From</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="border-b border-rule py-xs pr-s align-top">
                      {r.email}
                      {r.unsubscribedAt && <span className="meta"> (removed)</span>}
                    </td>
                    <td className="border-b border-rule py-xs pr-s align-top meta whitespace-pre-wrap">
                      {formatWhen(r.createdAt)}
                    </td>
                    <td className="border-b border-rule py-xs pr-s align-top meta">
                      {r.sourcePage ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
