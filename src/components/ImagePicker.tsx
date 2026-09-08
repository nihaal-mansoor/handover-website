"use client";

import { useId, useRef, useState, useTransition } from "react";
import { uploadPostImage, type UploadResult } from "@/lib/upload";

export interface PickedImage {
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Attach one image to a post.
 *
 * It uploads as soon as a file is chosen rather than on submit, so the poster
 * finds out immediately that a file is too large or unreadable, instead of
 * losing a written post to a failed submit.
 */
export function ImagePicker({
  value,
  onChange,
  disabled,
}: {
  value: PickedImage | null;
  onChange: (v: PickedImage | null) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function choose(file: File | undefined) {
    if (!file) return;
    setError(null);
    start(async () => {
      const form = new FormData();
      form.set("image", file);
      const res: UploadResult = await uploadPostImage(form);
      if (!res.ok || !res.url) {
        setError(res.message);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      onChange({ url: res.url, width: res.width ?? 1, height: res.height ?? 1 });
    });
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        disabled={disabled || pending}
        onChange={(e) => choose(e.target.files?.[0])}
      />

      {value ? (
        <figure className="post-image-edit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.url}
            alt=""
            width={value.width}
            height={value.height}
            className="post-image"
          />
          <figcaption className="mt-2xs">
            <button
              type="button"
              className="post-action post-action-danger"
              onClick={() => {
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Remove image
            </button>
          </figcaption>
        </figure>
      ) : (
        <label htmlFor={inputId} className="post-action image-add">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          {pending ? "Uploading…" : "Add image"}
        </label>
      )}

      {error && <p role="status" className="meta mt-2xs" style={{ color: "#B3271E" }}>{error}</p>}
    </div>
  );
}
