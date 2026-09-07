/**
 * Security headers, emitted into each site's vercel.json. (CLAUDE.md §4.3)
 *
 * No `unsafe-inline` and no `unsafe-eval` for scripts. Inline scripts carry a
 * per-response nonce instead — see cspWithNonce.
 */
const ANALYTICS_SCRIPT = [
    "https://www.googletagmanager.com",
    "https://www.clarity.ms",
    // Vercel Analytics and Speed Insights. Production serves these from the same
    // origin under /_vercel/insights, but development and some configurations
    // load them from this host instead.
    "https://va.vercel-scripts.com",
];
const ANALYTICS_CONNECT = [
    "https://va.vercel-scripts.com",
    "https://vitals.vercel-insights.com",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://www.googletagmanager.com",
    "https://*.clarity.ms",
];
const ANALYTICS_IMG = [
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
    "https://*.clarity.ms",
];
const TURNSTILE = ["https://challenges.cloudflare.com"];
/** Builds the CSP value. `{NONCE}` is substituted per response by middleware. */
export function buildCsp(options = {}) {
    const useAnalytics = options.analytics !== false;
    const useTurnstile = options.turnstile !== false;
    const script = options.useNonce
        ? [
            "'self'",
            "'nonce-{NONCE}'",
            ...(options.strictDynamic ? ["'strict-dynamic'"] : []),
            ...(useAnalytics ? ANALYTICS_SCRIPT : []),
            ...(useTurnstile ? TURNSTILE : []),
            ...(options.scriptSrc ?? []),
        ]
        : [
            "'self'",
            ...(useAnalytics ? ANALYTICS_SCRIPT : []),
            ...(useTurnstile ? TURNSTILE : []),
            ...(options.scriptSrc ?? []),
        ];
    const connect = [
        "'self'",
        ...(useAnalytics ? ANALYTICS_CONNECT : []),
        ...(useTurnstile ? TURNSTILE : []),
        ...(options.connectSrc ?? []),
    ];
    const img = ["'self'", "data:", ...(useAnalytics ? ANALYTICS_IMG : []), ...(options.imgSrc ?? [])];
    const frame = useTurnstile ? TURNSTILE : ["'none'"];
    return [
        `default-src 'self'`,
        `base-uri 'self'`,
        `object-src 'none'`,
        `frame-ancestors 'none'`,
        `form-action 'self'`,
        `script-src ${script.join(" ")}`,
        // Styles are authored per site and compiled; inline style attributes are
        // unavoidable with utility CSS, so this is the one relaxation we accept.
        `style-src 'self' 'unsafe-inline'`,
        `img-src ${img.join(" ")}`,
        `font-src 'self'`,
        `connect-src ${connect.join(" ")}`,
        `frame-src ${frame.join(" ")}`,
        `manifest-src 'self'`,
        `upgrade-insecure-requests`,
    ].join("; ");
}
/** Substitutes a real nonce into a CSP built by buildCsp. */
export function cspWithNonce(csp, nonce) {
    return csp.replaceAll("{NONCE}", nonce);
}
/** Cryptographically random, base64, per response. */
export function generateNonce() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes));
}
/** The full header set for a site's vercel.json. */
export function securityHeaders(options = {}) {
    return [
        { key: "Content-Security-Policy", value: buildCsp(options) },
        {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
        },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()",
        },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "X-DNS-Prefetch-Control", value: "off" },
    ];
}
/** Ready-to-write vercel.json headers block. */
export function vercelHeadersConfig(options = {}) {
    return {
        headers: [{ source: "/(.*)", headers: securityHeaders(options) }],
    };
}
//# sourceMappingURL=headers.js.map