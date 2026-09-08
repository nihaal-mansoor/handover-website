/**
 * Placeholder shapes for a route that has not arrived yet.
 *
 * aria-hidden with a single polite status message alongside: announcing a dozen
 * grey boxes tells a screen reader user nothing, whereas "Loading" does.
 */
export function Skeleton({ lines = 3, width = "100%" }: { lines?: number; width?: string }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="sk sk-line"
          style={{ width: i === lines - 1 ? "62%" : width }}
        />
      ))}
    </div>
  );
}

export function LoadingRegion({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className="sr-only" role="status">Loading</span>
      {children}
    </>
  );
}
