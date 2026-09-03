# Handover — dubairealestateadvice.com

A publication answering the questions people actually ask about buying property in
Dubai. Medium-style single-column long-read.

**No listings. Nothing is sold here.** See `CLAUDE.md` §1 in the parent directory.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run typecheck
```

## Where things live

| Path | What |
|---|---|
| `content/answers/*.mdx` | Articles. Frontmatter: `title`, `dek`, `topic`, `published`, optional `updated`, `sourceNote` |
| `src/lib/content.ts` | Reads and indexes the MDX; derives topics and read time |
| `src/app/answers/[slug]` | Article page, statically generated |
| `src/app/topics/[slug]` | Topic cluster pages, derived from frontmatter |
| `src/app/forum` | Placeholder. Ships in phase 4 |

## Writing an answer

Add an `.mdx` file to `content/answers/`. The filename is the slug. Topics are
created automatically from the `topic` field, so keep the spelling consistent.

`sourceNote` is for your own reference (where the question came from). **It is never
rendered.** Use the questions you collect as topics and write original answers;
reproducing someone's post verbatim is both a licensing problem and thin content.

## Phases

1. **Blog platform** — done
2. Content: original answers to collected questions
3. Comments: auth (Google + email/password), pre-moderation queue
4. Forum: threads, only once moderation is proven on comments

## Notes

- `site-kit` is a sibling package compiled to `dist/`. Turbopack cannot resolve
  raw TypeScript from `node_modules`, hence `transpilePackages` plus a widened
  `turbopack.root` for the symlink.
- Security headers come from `site-kit/security` via `next.config.mjs`.
