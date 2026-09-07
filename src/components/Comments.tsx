import { approvedComments, getCurrentUser, formatWhen, initials } from "@/lib/queries";
import { postComment } from "@/lib/actions";
import { PostBox } from "@/components/PostBox";
import { DeleteButton } from "@/components/DeleteButton";

export async function Comments({ articleSlug }: { articleSlug: string }) {
  const [comments, account] = await Promise.all([
    approvedComments(articleSlug),
    getCurrentUser(),
  ]);

  const isModerator = account?.role === "moderator" || account?.role === "admin";

  async function submit(body: string) {
    "use server";
    return postComment(articleSlug, body);
  }

  return (
    <section className="mt-xl border-t border-rule pt-l">
      <h2 className="text-step-2">
        {comments.length === 0
          ? "Discussion"
          : `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`}
      </h2>

      <div className="mt-m">
        <PostBox
          action={submit}
          signedIn={Boolean(account)}
          placeholder="Add something useful: what happened to you, or what this leaves out."
          submitLabel="Post comment"
        />
      </div>

      {comments.length > 0 && (
        <ol className="mt-l m-0 list-none p-0">
          {comments.map((c) => (
            <li key={c.id} className="border-t border-rule py-m">
              <div className="flex items-center gap-s">
                <span className="avatar" aria-hidden="true">{initials(c.authorName)}</span>
                <p className="meta m-0">
                  <span className="text-ink">{c.authorName}</span>
                  <br />
                  <time dateTime={new Date(c.createdAt).toISOString()}>
                    {formatWhen(c.createdAt)}
                  </time>
                </p>
              </div>
              <p className="mt-s mb-0 whitespace-pre-wrap">{c.body}</p>
              {(account?.id === c.userId || isModerator) && (
                <div className="cmt-actions">
                  <DeleteButton kind="comment" id={c.id} />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
