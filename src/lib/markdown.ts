import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/**
 * Markdown from the database, rendered at request time.
 *
 * Authors are admins, so this is not the main line of defence, but content
 * rendered as raw HTML is exactly where a compromised account does the most
 * damage. Sanitise anyway.
 */
marked.setOptions({ gfm: true, breaks: false });

export function renderMarkdown(md: string): string {
  let raw = marked.parse(md, { async: false }) as string;

  // A markdown image on its own line becomes a figure, with its alt text shown
  // as the caption. Charts need a caption; decorative images should not be
  // written on their own line.
  raw = raw.replace(
    /<p>(<img [^>]*?alt="([^"]*)"[^>]*>)<\/p>/g,
    (_m, img: string, alt: string) =>
      alt.trim()
        ? `<figure>${img}<figcaption>${alt}</figcaption></figure>`
        : `<figure>${img}</figure>`,
  );
  return sanitizeHtml(raw, {
    allowedTags: [
      "h2", "h3", "h4", "p", "a", "ul", "ol", "li", "blockquote", "strong", "em",
      "code", "pre", "hr", "br", "table", "thead", "tbody", "tr", "th", "td",
      "img", "figure", "figcaption", "del", "sup", "sub",
    ],
    allowedAttributes: {
      a: ["href", "title", "rel", "target"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      th: ["scope"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["https", "mailto"],
    transformTags: {
      // External links must not hand the opener away.
      a: (name, attrs) => ({
        tagName: "a",
        attribs: /^https?:\/\//i.test(attrs["href"] ?? "")
          ? { ...attrs, rel: "noopener noreferrer" }
          : attrs,
      }),
      img: (name, attrs) => ({ tagName: "img", attribs: { ...attrs, loading: "lazy" } }),
    },
  });
}

/** Reading time, matching the MDX path so the two sources agree. */
export function readingMinutes(md: string): number {
  const words = md.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
