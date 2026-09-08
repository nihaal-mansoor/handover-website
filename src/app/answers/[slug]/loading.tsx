import { Skeleton, LoadingRegion } from "@/components/Skeleton";

/** The article shape: headline, byline, reading column, a figure, more text. */
export default function Loading() {
  return (
    <article className="col py-xl">
      <LoadingRegion>
        <div className="sk sk-title" style={{ width: "85%" }} aria-hidden="true" />
        <div className="sk sk-line" style={{ width: "40%" }} aria-hidden="true" />
        <div className="mt-l"><Skeleton lines={6} /></div>
        <div className="sk sk-block mt-l" aria-hidden="true" />
        <div className="mt-l"><Skeleton lines={5} /></div>
      </LoadingRegion>
    </article>
  );
}
