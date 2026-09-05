/**
 * The single source of truth for a site's identity. Never hardcode any of these
 * values in a component — import the config. (CLAUDE.md §6.1)
 */
export interface SiteConfig {
    /** Publication brand shown to readers. A masthead, not a company claim. (§1.2) */
    readonly brand: string;
    /** Bare domain, no protocol, no trailing slash. */
    readonly domain: string;
    /** One sentence describing the single job this site does. (§1) */
    readonly tagline: string;
    /** The one thing this site owns. Used in WhatsApp prefill and lead attribution. */
    readonly topic: string;
    readonly contact: {
        /** E.164, digits only after the +. */
        readonly whatsapp: string;
        readonly email: string;
    };
    readonly analytics: {
        /** GA4 measurement ID for this domain's data stream. Empty disables GA4. */
        readonly ga4MeasurementId: string;
        /** Microsoft Clarity project ID. One project per domain. Empty disables Clarity. */
        readonly clarityProjectId: string;
    };
    readonly og: {
        readonly image: string;
        readonly imageAlt: string;
    };
    /** ISO date the site's factual content was last reviewed. Rendered as "as of". (§4.7) */
    readonly contentReviewedAt: string;
}
/** Identity helper that gives editor completion and type checking on site.config.ts. */
export declare function defineSiteConfig(config: SiteConfig): SiteConfig;
/** Portfolio-wide contact defaults. A site may override either. */
export declare const DEFAULT_CONTACT: {
    readonly whatsapp: "+971527276585";
    readonly email: "nihaal.mansoor@outlook.com";
};
/** Canonical origin for a site, no trailing slash. */
export declare function originOf(config: SiteConfig): string;
//# sourceMappingURL=types.d.ts.map