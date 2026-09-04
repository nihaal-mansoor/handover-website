import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  threadBySlug, approvedReplies, getCurrentUser, formatWhen, initials,
} from "@/lib/queries";
import { postReply } from "@/lib/actions";
import { PostBox } from "@/components/PostBox";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await threadBySlug(slug);
  if (!t) return {};
  return {
    title: t.title,
    description: t.body.slice(0, 155),
    alternates: { canonical: `/forum/${slug}` },
  };
}

export default async function ThreadPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await threadBySlug(slug);
  if (!t) notFound();

  const [replies, account] = await Promise.all([
    approvedReplies(t.id),
    getCurrentUser(),
  ]);

  async function submit(body: string) {
    "use server";
    return postReply(t!.id, t!.slug, body);
  }

  return (
    <article className="col py-xl">
      <p className="meta"><Link href="/forum">Forum</Link> · {t.category}</p>
      <h1 className="mt-2xs text-step-3">{t.title}</h1>

      <div className="mt-m flex items-center gap-s border-b border-rule pb-m">
        <span className="avatar" aria-hidden="true">{initials(t.authorName)}</span>
        <p className="meta m-0">
          <span className="text-ink">{t.authorName}</span>
          <br />
          <time dateTime={new Date(t.createdAt).toISOString()}>{formatWhen(t.createdAt)}</time>
        </p>
      </div>

      <p className="mt-l whitespace-pre-wrap">{t.body}</p>

      <section className="mt-xl border-t border-rule pt-l">
        <h2 className="text-step-2">
          {replies.length === 0
            ? "No replies yet"
            : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
        </h2>

        {replies.length > 0 && (
          <ol className="mt-m m-0 list-none p-0">
            {replies.map((r) => (
              <li key={r.id} className="border-t border-rule py-m">
                <div className="flex items-center gap-s">
                  <span className="avatar" aria-hidden="true">{initials(r.authorName)}</span>
                  <p className="meta m-0">
                    <span className="text-ink">{r.authorName}</span>
                    <br />
                    <time dateTime={new Date(r.createdAt).toISOString()}>
                      {formatWhen(r.createdAt)}
                    </time>
                  </p>
                </div>
                <p className="mt-s mb-0 whitespace-pre-wrap">{r.body}</p>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-l">
          <PostBox
            action={submit}
            signedIn={Boolean(account)}
            placeholder="Reply. Concrete experience is more useful than opinion."
            submitLabel="Post reply"
          />
        </div>
      </section>
    </article>
  );
}
