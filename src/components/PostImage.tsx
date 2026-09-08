/**
 * An image attached to a post.
 *
 * Width and height come from the stored dimensions so the row does not jump as
 * the picture loads, which is the CLS budget in §4.1. A plain <img> rather than
 * next/image: these are already re-encoded and size-capped on upload, so the
 * optimiser would add a remote-pattern config and a round trip for nothing.
 */
export function PostImage({
  url,
  width,
  height,
  alt,
  small = false,
}: {
  url: string | null;
  width: number | null;
  height: number | null;
  alt: string;
  small?: boolean;
}) {
  if (!url) return null;
  return (
    <figure className={small ? "post-image-wrap post-image-small" : "post-image-wrap"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        width={width ?? 1200}
        height={height ?? 800}
        className="post-image"
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}
