/**
 * The single source of truth for a site's identity. Never hardcode any of these
 * values in a component — import the config. (CLAUDE.md §6.1)
 */
/** Identity helper that gives editor completion and type checking on site.config.ts. */
export function defineSiteConfig(config) {
    return config;
}
/** Portfolio-wide contact defaults. A site may override either. */
export const DEFAULT_CONTACT = {
    whatsapp: "+971527276585",
    email: "nihaal.mansoor@outlook.com",
};
/** Canonical origin for a site, no trailing slash. */
export function originOf(config) {
    return `https://${config.domain}`;
}
//# sourceMappingURL=types.js.map