import Link from "next/link";
import { CATEGORIES, categoryCounts } from "@/lib/queries";

const NAV = [
  { href: "/", label: "Home", icon: "M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/topics", label: "Topics", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/forum", label: "Discussions", icon: "M21 12a8 8 0 1 1-3.1-6.3L21 4v6h-6" },
];

/**
 * The rail on the discussions pages.
 *
 * It keeps the site's three-column shell but fills the sidebar with the
 * categories of this section rather than the article topics, which had nothing
 * to do with what the reader is looking at here.
 *
 * A category with no threads in it is still listed. Hiding the empty ones would
 * make the sidebar change shape as people post, and an empty category is a
 * useful prompt to be the first to post in it.
 */
export async function RailDiscussions({ current }: { current: string | null }) {
  const counts = await categoryCounts();

  return (
    <aside className="rail-left" aria-label="Discussion categories">
      <div className="rail-sticky">
        <nav aria-label="Sections">
          <ul className="m-0 list-none p-0">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="rail-link"
                  {...(n.href === "/forum" && !current ? { "aria-current": "page" as const } : {})}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={n.icon} />
                  </svg>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Discussion categories">
          <p className="rail-heading mt-m border-t border-rule pt-m">Categories</p>
          <ul className="m-0 list-none p-0">
            <li>
              <Link
                href="/forum"
                className="rail-link"
                {...(!current ? { "aria-current": "page" as const } : {})}
              >
                Everything
                <span className="ml-auto text-faint">
                  {[...counts.values()].reduce((a, b) => a + b, 0)}
                </span>
              </Link>
            </li>
            {CATEGORIES.map(([key, label]) => (
              <li key={key}>
                <Link
                  href={`/forum?category=${key}`}
                  className="rail-link"
                  {...(current === key ? { "aria-current": "page" as const } : {})}
                >
                  {label}
                  <span className="ml-auto text-faint">{counts.get(key) ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
