import { Skeleton, LoadingRegion } from "@/components/Skeleton";

/**
 * The home page, and the fallback for any route without a closer loading file.
 * Mirrors the masthead plus three-column shell so the click lands on something
 * the same shape as what arrives.
 */
export default function Loading() {
  return (
    <>
      <div className="shell grid items-end gap-m py-l lg:grid-cols-[1.4fr_1fr]">
        <div aria-hidden="true">
          <div className="sk sk-title" style={{ width: "80%" }} />
          <div className="sk sk-line" style={{ width: "55%" }} />
        </div>
      </div>
      <div className="shell">
        <div className="app-grid">
          <div className="rail-left" aria-hidden="true">
            <div className="rail-sticky"><Skeleton lines={8} /></div>
          </div>
          <div className="feed">
            <LoadingRegion>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="border-b border-rule py-m" aria-hidden="true">
                  <div className="sk sk-line" style={{ width: "70%", height: "1.4em" }} />
                  <div className="sk sk-line" style={{ width: "90%" }} />
                  <div className="sk sk-line" style={{ width: "30%" }} />
                </div>
              ))}
            </LoadingRegion>
          </div>
          <div className="rail-right" aria-hidden="true">
            <div className="rail-sticky"><Skeleton lines={6} /></div>
          </div>
        </div>
      </div>
    </>
  );
}

