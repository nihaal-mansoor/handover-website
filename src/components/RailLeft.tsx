import Link from "next/link";
import { allTopicsAsync } from "@/lib/content";

const NAV = [
  { href: "/", label: "Home", icon: "M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/topics", label: "Topics", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/forum", label: "Forum", icon: "M21 12a8 8 0 1 1-3.1-6.3L21 4v6h-6" },
];

/** Persistent nav rail. Sticky, quiet, and it never scrolls away. */
export async function RailLeft({ current }: { current?: string }) {
  const topics = (await allTopicsAsync()).slice(0, 8);

  return (
    <aside className="rail-left">
      <div className="rail-sticky">
        <nav aria-label="Sections">
          <ul className="m-0 list-none p-0">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="rail-link"
                  {...(current === n.href ? { "aria-current": "page" as const } : {})}
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

        {topics.length > 0 && (
          <>
            <p className="rail-heading mt-m border-t border-rule pt-m">Topics</p>
            <ul className="m-0 list-none p-0">
              {topics.map((t) => (
                <li key={t.slug}>
                  <Link href={`/topics/${t.slug}`} className="rail-link">
                    {t.name}
                    <span className="ml-auto text-faint">{t.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
