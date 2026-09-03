# Handover — dubairealestateadvice.com

An independent guide to the Dubai property buying process. Seven stages, what each
costs, and where transactions stall.

**No listings. Nothing is sold here.** See `CLAUDE.md` §1 in the parent directory.

## Run

```bash
npm install
npm run dev
npm run gate     # build + HTML validation + compliance scan
```

## Environment

Copy `.env.example` to `.env`. The site builds and renders without any of it; the
lead form needs `DATABASE_URL`, `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`,
`RESEND_API_KEY` and `LEAD_FROM_EMAIL`.

Analytics IDs go in `site.config.ts` — empty strings disable the tags entirely.

## Notes

- **No React.** The checklist is native `<details>` plus ~1 KB of DOM code in
  `/enhance.js`. Total JS is 2.3 KB gzipped.
- **No inline scripts.** `consent.js` and `enhance.js` are prerendered endpoints so
  the CSP needs no nonce and no `unsafe-inline`.
- **No Astro adapter.** `/api/lead.ts` is a native Vercel Function.
- `vercel.json` is generated — edit `site-kit/src/security/headers.ts`, then run
  `node scripts-gen-vercel.mjs`.
