import Link from "next/link";
import config from "../../site.config";
import { whatsappUrl } from "@uaeprop/site-kit/leads";

/**
 * Thin, quiet, sticky. Medium's chrome does almost nothing and that is the
 * point: on an article page the masthead should be the least interesting thing
 * on screen.
 */
export function Masthead() {
  const wa = whatsappUrl(config, {
    message: `Hi, I'm reading ${config.brand}. I have a question about buying in Dubai.`,
  });

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-[var(--paper)]/90 backdrop-blur">
      <div className="col-wide flex items-center justify-between gap-m py-xs">
        <Link href="/" className="no-underline">
          <span className="font-serif text-step-1 font-semibold tracking-[-0.03em]">
            {config.brand}
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-s">
          <Link href="/topics" className="meta no-underline hover:text-ink">
            Topics
          </Link>
          <Link href="/forum" className="meta no-underline hover:text-ink">
            Forum
          </Link>
          <a href={wa} rel="noopener noreferrer" target="_blank" className="btn">
            Ask a question
          </a>
        </nav>
      </div>
    </header>
  );
}
