import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forum",
  description: "Share your experience of buying, selling or renting in Dubai.",
  alternates: { canonical: "/forum" },
};

/** Placeholder. The forum ships in phase 4, once moderation is proven on comments. */
export default function ForumPage() {
  return (
    <div className="col py-xl">
      <h1>Forum</h1>
      <p className="mt-m text-ink-2">
        A place to post what actually happened: which developer delivered late, what a
        building really charges in service fees, how long a transfer took.
      </p>
      <p className="text-ink-2">
        Not open yet. It opens once there is enough here to be worth discussing.
      </p>
    </div>
  );
}
