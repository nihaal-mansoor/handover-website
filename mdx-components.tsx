import type { MDXComponents } from "mdx/types";

/**
 * Required by the App Router. Article prose is styled by .prose in globals.css
 * rather than per-element classes here, so MDX output stays clean HTML.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    table: (props) => (
      <div style={{ overflowX: "auto" }}>
        <table {...props} />
      </div>
    ),
  };
}
