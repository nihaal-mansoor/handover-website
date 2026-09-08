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
  // A wide table has to scroll in its own box or it pushes the whole page
  // sideways on a phone. The MDX path wraps tables the same way.
  raw = raw.replace(/<table>/g, '<div class="table-scroll"><table>')
           .replace(/<\/table>/g, "</table></div>");

  return sanitizeHtml(raw, {
    allowedTags: [
      "h2", "h3", "h4", "p", "a", "ul", "ol", "li", "blockquote", "strong", "em",
      "code", "pre", "hr", "br", "table", "thead", "tbody", "tr", "th", "td",
      "img", "figure", "figcaption", "del", "sup", "sub", "div",
    ],
    // Only the table wrapper may carry a class; everything else is stripped, so
    // article markdown cannot reach into the stylesheet.
    allowedClasses: { div: ["table-scroll"] },
    allowedAttributes: {
      div: ["class"],
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

/**
 * Markdown written by a reader, not an admin.
 *
 * Same sanitiser, deliberately narrower: no images (a post's image goes through
 * the upload path, which re-encodes it, rather than letting anyone embed a
 * remote URL that would leak the reader's IP to whoever hosts it), no headings
 * competing with the page's own outline, and every link forced to
 * rel="nofollow noopener noreferrer" so the forum cannot be farmed for SEO.
 */
export function renderPost(md: string): string {
  const raw = marked.parse(md, { async: false }) as string;
  return sanitizeHtml(raw, {
    allowedTags: [
      "p", "a", "ul", "ol", "li", "blockquote", "strong", "em", "code", "pre",
      "hr", "br", "table", "thead", "tbody", "tr", "th", "td", "del",
    ],
    allowedAttributes: {
      a: ["href", "title", "rel", "target"],
      th: ["scope"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    transformTags: {
      a: (name, attrs) => ({
        tagName: "a",
        attribs: { ...attrs, rel: "nofollow noopener noreferrer", target: "_blank" },
      }),
      // A reader's heading would sit at the same level as the page's own and
      // break the single-outline rule in §4.2.
      h1: "strong", h2: "strong", h3: "strong", h4: "strong", h5: "strong", h6: "strong",
    },
  });
}
