import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { queueWithAuthors, isModerator, formatWhen } from "@/lib/queries";
import { ModerateButtons } from "@/components/ModerateButtons";

export const metadata: Metadata = { title: "Moderation queue", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isModerator())) redirect("/signin");
  const queue = await queueWithAuthors();
  if (!queue) redirect("/signin");

  const total = queue.comments.length + queue.threads.length + queue.replies.length;

  return (
    <div className="shell py-xl">
      <h1 className="text-step-3">Moderation queue</h1>
      <p className="meta mt-2xs mb-l">
        {total === 0
          ? "Nothing waiting."
          : `${total} ${total === 1 ? "item" : "items"} waiting. Nothing here is publicly visible.`}
      </p>

      {queue.threads.length > 0 && (
        <section className="mb-xl">
          <h2 className="text-step-1">Threads</h2>
          {queue.threads.map(({ row, authorName, authorEmail }) => (
            <article key={row.id} className="border-t border-rule py-m">
              <p className="meta m-0">
                {authorName} · {authorEmail} · {formatWhen(row.createdAt)} · {row.category}
              </p>
              <h3 className="mt-2xs text-step-1">{row.title}</h3>
              <p className="mt-s whitespace-pre-wrap">{row.body}</p>
              <ModerateButtons kind="thread" id={row.id} />
            </article>
          ))}
        </section>
      )}

      {queue.comments.length > 0 && (
        <section className="mb-xl">
          <h2 className="text-step-1">Comments</h2>
          {queue.comments.map(({ row, authorName, authorEmail }) => (
            <article key={row.id} className="border-t border-rule py-m">
              <p className="meta m-0">
                {authorName} · {authorEmail} · {formatWhen(row.createdAt)} · on{" "}
                <a href={`/answers/${row.articleSlug}`}>{row.articleSlug}</a>
              </p>
              <p className="mt-s whitespace-pre-wrap">{row.body}</p>
              <ModerateButtons kind="comment" id={row.id} />
            </article>
          ))}
        </section>
      )}

      {queue.replies.length > 0 && (
        <section className="mb-xl">
          <h2 className="text-step-1">Replies</h2>
          {queue.replies.map(({ row, authorName, authorEmail }) => (
            <article key={row.id} className="border-t border-rule py-m">
              <p className="meta m-0">
                {authorName} · {authorEmail} · {formatWhen(row.createdAt)}
              </p>
              <p className="mt-s whitespace-pre-wrap">{row.body}</p>
              <ModerateButtons kind="reply" id={row.id} />
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
