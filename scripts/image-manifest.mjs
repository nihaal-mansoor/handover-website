/**
 * Records the pixel size of every local image, so markdown can be rendered with
 * width and height on each <img>.
 *
 *   node scripts/image-manifest.mjs
 *
 * Markdown has no syntax for dimensions, so an image in an article body shipped
 * with none, and the browser could not reserve its space until the bytes
 * arrived. That is a layout shift on the largest element on the page, which is
 * most of the CLS budget in §4.1.
 *
 * Generated rather than hardcoded: a lookup keyed on "/images/charts/" would
 * silently be wrong the first time an image of another shape is added.
 */
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public", "images");
const OUT = path.join(process.cwd(), "src", "lib", "image-sizes.json");

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(png|jpe?g|webp|avif|gif)$/i.test(e.name)) out.push(full);
  }
  return out;
}

const files = await walk(ROOT);
const map = {};
for (const f of files) {
  const { width, height } = await sharp(f).metadata();
  if (!width || !height) continue;
  map["/" + path.relative(path.join(process.cwd(), "public"), f).split(path.sep).join("/")] =
    { w: width, h: height };
}
await writeFile(OUT, JSON.stringify(map, null, 2) + "\n", "utf8");
console.log(`${Object.keys(map).length} images measured -> src/lib/image-sizes.json`);
