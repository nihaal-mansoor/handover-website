import type { MDXComponents } from "mdx/types";

/**
 * Required by the App Router. Article prose is styled by .prose in globals.css
 * rather than per-element classes here, so MDX output stays clean HTML.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    // Mirrors the wrapper the database renderer emits (src/lib/markdown.ts), so
    // an article reads identically whichever path served it.
    table: (props) => (
      <div className="table-scroll">
        <table {...props} />
      </div>
    ),
  };
}
