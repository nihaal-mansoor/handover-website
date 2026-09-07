import Link from "next/link";
import { getCurrentUser } from "@/lib/queries";
import { SignOutButton } from "@/components/SignOutButton";
import config from "../../site.config";

/** Full-width, sticky, quiet. Search posts to /search so it works without JS. */
export async function TopBar() {
  const account = await getCurrentUser();
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-[var(--paper)]">
      <div className="shell flex items-center gap-s py-xs">
        <Link href="/" className="no-underline shrink-0">
          <span className="font-serif text-step-1 font-semibold tracking-[-0.03em]">
            {config.brand}
          </span>
        </Link>

        <form action="/search" method="get" role="search" className="search max-w-[22rem] flex-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" aria-hidden="true" className="text-faint shrink-0">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <label htmlFor="q" className="sr-only">Search answers</label>
          <input id="q" name="q" type="search" placeholder="Search" autoComplete="off" />
        </form>

        <nav aria-label="Main" className="ml-auto flex items-center gap-s">
          <Link href="/topics" className="meta hidden no-underline hover:text-ink sm:block">
            Topics
          </Link>
          <Link href="/forum" className="meta hidden no-underline hover:text-ink sm:block">
            Forum
          </Link>
          {account ? (
            <>
              {(account.role === "moderator" || account.role === "admin") && (
                <Link href="/admin" className="meta hidden no-underline hover:text-ink sm:block">
                  Queue
                </Link>
              )}
              <span className="meta hidden md:block">{account.name}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/signin" className="meta no-underline hover:text-ink">Sign in</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
