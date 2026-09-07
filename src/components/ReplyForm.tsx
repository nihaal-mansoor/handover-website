"use client";

import { postReply } from "@/lib/actions";
import { PostBox } from "@/components/PostBox";

/**
 * The reply box that opens under a comment. It exists so the recursive tree,
 * which is a server component, can hand each comment its own bound action
 * without creating one server action per node.
 */
export function ReplyForm({
  threadId,
  threadSlug,
  parentId,
  signedIn,
  compact = true,
  placeholder = "Reply. Concrete experience is more useful than opinion.",
}: {
  threadId: string;
  threadSlug: string;
  parentId?: string;
  signedIn: boolean;
  compact?: boolean;
  placeholder?: string;
}) {
  return (
    <PostBox
      signedIn={signedIn}
      compact={compact}
      placeholder={placeholder}
      submitLabel="Reply"
      action={(body) => postReply(threadId, threadSlug, body, parentId)}
    />
  );
}
