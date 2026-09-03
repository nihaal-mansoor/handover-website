import Link from "next/link";
import config from "../../site.config";
import { disclaimer } from "@uaeprop/site-kit";
import { whatsappUrl, whatsappDisplay } from "@uaeprop/site-kit/leads";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const wa = whatsappUrl(config);

  return (
    <footer className="mt-2xl border-t border-rule">
      <div className="shell grid gap-m py-l md:grid-cols-[2fr_1fr]">
        <div>
          {/* Required on every page. Do not soften. (CLAUDE.md §1.4) */}
          <p className="meta m-0 max-w-[52ch]">{disclaimer(config.brand)}</p>
        </div>
        <div>
          <ul className="m-0 list-none space-y-2xs p-0">
            <li>
              <a href={wa} rel="noopener noreferrer" target="_blank" className="meta">
                WhatsApp {whatsappDisplay(config.contact.whatsapp)}
              </a>
            </li>
            <li>
              <a href={`mailto:${config.contact.email}`} className="meta">
                {config.contact.email}
              </a>
            </li>
          </ul>
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
          </ul>
        </nav>
      </div>
    </footer>
  );
}
