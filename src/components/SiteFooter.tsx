import Link from "next/link";
import config from "../../site.config";
import { disclaimer } from "@uaeprop/site-kit";
import { Subscribe } from "@/components/Subscribe";
import { CookieSettingsLink } from "@/components/CookieSettingsLink";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-2xl border-t border-rule">
      <div className="shell grid gap-l py-l md:grid-cols-[1.4fr_1fr]">
        <div>
          {/* Required on every page. Do not soften. (CLAUDE.md §1.4) */}
          <p className="meta m-0 max-w-[52ch]">{disclaimer(config.brand)}</p>
        </div>
        <div>
          <Subscribe />
        </div>
      </div>

      <div className="shell flex flex-wrap justify-between gap-s border-t border-rule py-s">
        <p className="meta m-0">
          &copy; {year} {config.brand}
        </p>
        <nav aria-label="Legal">
          <ul className="m-0 flex list-none gap-m p-0">
            <li><Link href="/privacy" className="meta">Privacy</Link></li>
            <li><Link href="/terms" className="meta">Terms</Link></li>
            <li><Link href="/forum" className="meta">Discussions</Link></li>
            <li><CookieSettingsLink /></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
