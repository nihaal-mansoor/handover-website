import { Skeleton, LoadingRegion } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="shell">
      <div className="app-grid">
        <div className="rail-left" aria-hidden="true">
          <div className="rail-sticky"><Skeleton lines={8} /></div>
        </div>
        <div className="feed">
          <LoadingRegion>
            <div className="sk sk-title" style={{ width: "35%" }} aria-hidden="true" />
            <Skeleton lines={7} />
          </LoadingRegion>
        </div>
        <div className="rail-right" aria-hidden="true">
          <div className="rail-sticky"><Skeleton lines={6} /></div>
        </div>
      </div>
    </div>
  );
}
