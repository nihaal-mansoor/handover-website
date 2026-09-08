"use server";

import { put } from "@vercel/blob";
import sharp from "sharp";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";

/**
 * One image per post, re-encoded on the way in.
 *
 * The file is never stored as uploaded. It is decoded, resized and written back
 * out as WebP, which does three things at once:
 *
 *  - strips every metadata block, so a photo taken on a phone cannot carry the
 *    poster's GPS coordinates into a public page. This is the one protection
 *    that costs nothing and it is why re-encoding is not optional;
 *  - guarantees the bytes we serve are an image we produced, so a file that is
 *    only pretending to be a PNG cannot be stored and served back;
 *  - caps the size, since a modern phone photo is several megabytes and would
 *    wreck the page budget in §4.1.
 *
 * The content type is sniffed from the bytes rather than trusted from the
 * upload, because the browser-supplied type is attacker-controlled.
 *
 * Note the scanners in site-kit read text. Nothing here can tell that a picture
 * is a listing with a price on it, so an image is published on the poster's
 * word alone and is removed after the fact.
 */

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 1600;

export interface UploadResult {
  readonly ok: boolean;
  readonly message: string;
  readonly url?: string;
  readonly width?: number;
  readonly height?: number;
}

/** Magic bytes. The declared MIME type is not evidence of anything. */
function sniff(b: Buffer): "jpeg" | "png" | "webp" | "gif" | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && b.subarray(1, 4).toString("ascii") === "PNG") return "png";
  if (b.subarray(0, 3).toString("ascii") === "GIF") return "gif";
  if (
    b.subarray(0, 4).toString("ascii") === "RIFF" &&
    b.subarray(8, 12).toString("ascii") === "WEBP"
  ) return "webp";
  return null;
}

export async function uploadPostImage(form: FormData): Promise<UploadResult> {
  if (!db) return { ok: false, message: "Uploads are unavailable." };
  if (!process.env["BLOB_READ_WRITE_TOKEN"]) {
    return { ok: false, message: "Image uploads are not configured." };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { ok: false, message: "Sign in to add an image." };
  const [account] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!account) return { ok: false, message: "Sign in to add an image." };
  if (account.bannedAt) return { ok: false, message: "This account cannot post." };

  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "No image was selected." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "That image is larger than 8 MB. Please use a smaller one." };
  }

  const input = Buffer.from(await file.arrayBuffer());
  const kind = sniff(input);
  if (!kind) {
    return { ok: false, message: "That file is not a JPEG, PNG, WebP or GIF." };
  }

  let output: Buffer;
  let width: number;
  let height: number;
  try {
    // animated:true keeps a GIF moving instead of silently flattening it to
    // its first frame.
    const img = sharp(input, { animated: kind === "gif", limitInputPixels: 50_000_000 });
    const meta = await img.metadata();
    if (!meta.width || !meta.height) throw new Error("no dimensions");

    const resized = img.resize({
      width: Math.min(meta.width, MAX_EDGE),
      withoutEnlargement: true,
    });
    output = await resized.webp({ quality: 82, effort: 4 }).toBuffer();

    const outMeta = await sharp(output, { animated: kind === "gif" }).metadata();
    width = outMeta.width ?? meta.width;
    // An animated WebP reports the height of every frame stacked together.
    height = outMeta.pageHeight ?? outMeta.height ?? meta.height;
  } catch {
    return { ok: false, message: "That image could not be read. Try a different file." };
  }

  try {
    // addRandomSuffix keeps one poster's filename from overwriting another's,
    // and stops the stored path from being guessable.
    const blob = await put(`posts/${crypto.randomUUID()}.webp`, output, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: true,
      cacheControlMaxAge: 31_536_000,
    });
    return { ok: true, message: "Added.", url: blob.url, width, height };
  } catch (err) {
    console.error("[upload] blob write failed", err);
    return { ok: false, message: "That image could not be saved. Please try again." };
  }
}
