"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signInHref } from "@/lib/next-path";
import { castVote } from "@/lib/actions";

/**
 * The arrows and the score, as Reddit has them.
 *
 * Clicking the arrow you already chose takes the vote back, which is why this
 * sends the value rather than a direction: the server works out the delta. The
 * count moves immediately and is corrected on the server's answer, because a
 * vote that visibly waits for a round trip feels broken.
 */
export function VoteBox({
  targetType,
  targetId,
  score,
  myVote,
  revalidate,
  signedIn,
  layout = "column",
}: {
  targetType: "thread" | "reply";
  targetId: string;
  score: number;
  myVote: number;
  revalidate: string;
  signedIn: boolean;
  layout?: "column" | "row";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const signin = () => router.push(signInHref(search ? `${pathname}?${search}` : pathname));
  const [, start] = useTransition();
  const [state, setState] = useOptimistic(
    { score, myVote },
    (prev, next: 1 | -1) =>
      prev.myVote === next
        ? { score: prev.score - next, myVote: 0 }
        : { score: prev.score - prev.myVote + next, myVote: next },
  );

  function send(value: 1 | -1) {
    start(async () => {
      setState(value);
      const res = await castVote(targetType, targetId, value, revalidate);
      if (!res.ok && res.message === "Sign in to vote.") signin();
      router.refresh();
    });
  }

  const arrow = (dir: 1 | -1) => {
    const active = state.myVote === dir;
    return (
      <button
        type="button"
        className="vote-arrow"
        aria-pressed={active}
        aria-label={dir === 1 ? "Upvote" : "Downvote"}
        data-active={active ? (dir === 1 ? "up" : "down") : undefined}
        onClick={() => (signedIn ? send(dir) : signin())}
      >
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
          <path
            d={dir === 1 ? "M10 4l6 7h-3.5v5h-5v-5H4z" : "M10 16l-6-7h3.5V4h5v5H16z"}
            fill="currentColor"
          />
        </svg>
      </button>
    );
  };

  return (
    <div className={layout === "row" ? "votes votes-row" : "votes"}>
      {arrow(1)}
      <span
        className="vote-score"
        data-state={state.myVote === 1 ? "up" : state.myVote === -1 ? "down" : undefined}
      >
        {state.score}
      </span>
      {arrow(-1)}
    </div>
  );
}
