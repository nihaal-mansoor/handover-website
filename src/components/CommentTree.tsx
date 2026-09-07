import { VoteBox } from "@/components/VoteBox";
import { DeleteButton } from "@/components/DeleteButton";
import { ReplyForm } from "@/components/ReplyForm";
import { formatWhen, type ReplyNode } from "@/lib/queries";

/**
 * The comment tree, as Reddit lays it out: a thread line down the left of each
 * level, the author bar doubling as the collapse control, and the reply box
 * opening in place under the comment being answered.
 *
 * Collapsing and opening a reply box are both native `<details>`, so the whole
 * tree works with no JavaScript at all. Only the arrows and the delete button
 * need the client, and both degrade to a link to sign in.
 *
 * A comment whose author removed it is kept as a tombstone when it still has
 * replies, so the conversation underneath does not lose its parent.
 */
export function CommentTree({
  nodes,
  threadId,
  threadSlug,
  viewerId,
  isModerator,
  depth = 0,
}: {
  nodes: readonly ReplyNode[];
  threadId: string;
  threadSlug: string;
  viewerId: string | null;
  isModerator: boolean;
  depth?: number;
}) {
  if (nodes.length === 0) return null;

  return (
    <ul className="cmt-list">
      {nodes.map((n) => {
        const removed = Boolean(n.deletedAt);
        const mine = viewerId === n.userId;
        return (
          <li key={n.id} className="cmt-item">
            <details className="cmt" open>
              <summary className="cmt-bar">
                <span className="cmt-toggle" aria-hidden="true" />
                <span className="cmt-author">{removed ? "[deleted]" : n.authorName}</span>
                <span className="cmt-dot" aria-hidden="true">·</span>
                <time dateTime={new Date(n.createdAt).toISOString()} className="cmt-time">
                  {formatWhen(n.createdAt)}
                </time>
                {!removed && (
                  <>
                    <span className="cmt-dot" aria-hidden="true">·</span>
                    <span className="cmt-points">
                      {n.score} {Math.abs(n.score) === 1 ? "point" : "points"}
                    </span>
                  </>
                )}
              </summary>

              <div className="cmt-inner">
                {removed ? (
                  <p className="cmt-removed">Comment removed by its author.</p>
                ) : (
                  <>
                    <p className="cmt-body">{n.body}</p>

                    <div className="cmt-actions">
                      <VoteBox
                        targetType="reply"
                        targetId={n.id}
                        score={n.score}
                        myVote={n.myVote}
                        revalidate={`/forum/${threadSlug}`}
                        signedIn={Boolean(viewerId)}
                        layout="row"
                      />

                      {/* Nesting has to stop somewhere or the column runs out of
                          width on a phone. Past this depth a reply joins the
                          level above, which is what Reddit does at its own limit. */}
                      <details className="cmt-reply">
                        <summary className="post-action">Reply</summary>
                        <div className="cmt-reply-box">
                          <ReplyForm
                            threadId={threadId}
                            threadSlug={threadSlug}
                            parentId={depth >= 5 ? (n.parentId ?? n.id) : n.id}
                            signedIn={Boolean(viewerId)}
                          />
                        </div>
                      </details>

                      {(mine || isModerator) && <DeleteButton kind="reply" id={n.id} />}
                    </div>
                  </>
                )}

                <CommentTree
                  nodes={n.children}
                  threadId={threadId}
                  threadSlug={threadSlug}
                  viewerId={viewerId}
                  isModerator={isModerator}
                  depth={depth + 1}
                />
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
