import { Skeleton, LoadingRegion } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="shell">
      <div className="app-grid">
        <aside className="rail-left" aria-hidden="true">
          <div className="rail-sticky"><Skeleton lines={8} /></div>
        </aside>
        <div className="feed">
          <LoadingRegion>
            <div className="sk sk-title" style={{ width: "35%" }} aria-hidden="true" />
            <Skeleton lines={7} />
          </LoadingRegion>
        </div>
        <aside className="rail-right" aria-hidden="true">
          <div className="rail-sticky"><Skeleton lines={6} /></div>
        </aside>
      </div>
    </div>
  );
}
