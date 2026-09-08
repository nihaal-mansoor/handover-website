import { Skeleton, LoadingRegion } from "@/components/Skeleton";

/** Matches the discussions shell: rail, feed of rows, about panel. */
export default function Loading() {
  return (
    <div className="shell">
      <div className="app-grid">
        <aside className="rail-left" aria-hidden="true">
          <div className="rail-sticky"><Skeleton lines={8} /></div>
        </aside>
        <div className="feed">
          <LoadingRegion>
            <div className="sk sk-title" style={{ width: "40%" }} aria-hidden="true" />
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="border-b border-rule py-m" aria-hidden="true">
                <div className="sk sk-line" style={{ width: "72%", height: "1.3em" }} />
                <div className="sk sk-line" style={{ width: "35%" }} />
              </div>
            ))}
          </LoadingRegion>
        </div>
        <aside className="rail-right" aria-hidden="true">
          <div className="rail-sticky"><Skeleton lines={6} /></div>
        </aside>
      </div>
    </div>
  );
}
