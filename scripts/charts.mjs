/**
 * Chart primitives.
 *
 * Deliberately hand-built SVG rather than a charting library: these render at
 * build time to static PNGs, so there is no runtime, no hydration and nothing
 * to hold to the CWV budget. One scale per chart, never two y-axes.
 *
 * Palette validated with the dataviz validator against both surfaces:
 *   node scripts/validate_palette.js "#1A7F4B,#C2410C,#1D4ED8" --mode light --surface "#F7F4ED"
 */
export const W = 1200, H = 630;
export const PALETTE = ["#1A7F4B", "#C2410C", "#1D4ED8"];
export const INK = "#242424", MUTED = "#6B6B6B", FAINT = "#A79F91";
export const SURFACE = "#F7F4ED", GRID = "#E1DBCE";
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const SERIF = "Charter, Georgia, serif";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmt = (n) => n.toLocaleString("en-GB");

export function frame({ title, subtitle, source, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${SURFACE}"/>
  <text x="64" y="74" font-family="${SANS}" font-size="34" font-weight="700" fill="${INK}" letter-spacing="-0.7">${esc(title)}</text>
  <text x="64" y="110" font-family="${SERIF}" font-size="21" fill="${MUTED}">${esc(subtitle)}</text>
  ${body}
  <text x="64" y="${H - 30}" font-family="${SANS}" font-size="15" fill="${FAINT}">${esc(source)}</text>
</svg>`;
}

/** Shared plot geometry. One y-scale, always. */
function plot({ left = 90, right = 210, top = 150, bottom = 90 } = {}) {
  return { x0: left, x1: W - right, y0: top, y1: H - bottom };
}

export function lineChart({ title, subtitle, source, series, xLabels, yTicks = 5, yFormat = fmt, yFrom }) {
  const p = plot();
  const all = series.flatMap((s) => s.values.filter((v) => v != null));
  const lo = yFrom ?? Math.min(...all), hi = Math.max(...all);
  const pad = (hi - lo) * 0.12 || 1;
  const min = yFrom ?? lo - pad, max = hi + pad;
  const n = xLabels.length;
  const X = (i) => p.x0 + (i * (p.x1 - p.x0)) / (n - 1);
  const Y = (v) => p.y1 - ((v - min) / (max - min)) * (p.y1 - p.y0);

  let g = "";
  for (let t = 0; t <= yTicks; t++) {
    const v = min + ((max - min) * t) / yTicks, y = Y(v);
    g += `<line x1="${p.x0}" y1="${y}" x2="${p.x1}" y2="${y}" stroke="${GRID}" stroke-width="1"/>
      <text x="${p.x0 - 14}" y="${y + 5}" text-anchor="end" font-family="${SANS}" font-size="15" fill="${MUTED}">${esc(yFormat(v))}</text>`;
  }
  xLabels.forEach((lab, i) => {
    g += `<text x="${X(i)}" y="${p.y1 + 30}" text-anchor="middle" font-family="${SANS}" font-size="15" fill="${MUTED}">${esc(lab)}</text>`;
  });

  series.forEach((s, si) => {
    const c = PALETTE[si % PALETTE.length];
    const pts = s.values.map((v, i) => (v == null ? null : [X(i), Y(v)])).filter(Boolean);
    g += `<polyline fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
      points="${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}"/>`;
    const [lx, ly] = pts[pts.length - 1];
    // A 2px surface ring keeps the endpoint legible where marks overlap.
    g += `<circle cx="${lx}" cy="${ly}" r="6.5" fill="${c}" stroke="${SURFACE}" stroke-width="2"/>`;
    // Direct label: identity is never colour alone.
    g += `<text x="${lx + 16}" y="${ly + 6}" font-family="${SANS}" font-size="17" font-weight="600" fill="${c}">${esc(s.name)}</text>`;
    if (s.endValue !== false) {
      g += `<text x="${lx + 16}" y="${ly + 27}" font-family="${SANS}" font-size="15" fill="${MUTED}">${esc(yFormat(s.values.at(-1)))}</text>`;
    }
  });

  return frame({ title, subtitle, source, body: g });
}

export function barChart({ title, subtitle, source, labels, values, valueLabels, highlight = -1, colour = PALETTE[0] }) {
  const p = plot({ left: 90, right: 90, top: 155, bottom: 95 });
  const max = Math.max(...values) * 1.16;
  const n = values.length;
  const slot = (p.x1 - p.x0) / n;
  const bw = Math.min(slot * 0.52, 130);

  let g = "";
  g += `<line x1="${p.x0}" y1="${p.y1}" x2="${p.x1}" y2="${p.y1}" stroke="${GRID}" stroke-width="1"/>`;
  values.forEach((v, i) => {
    const h = (v / max) * (p.y1 - p.y0);
    const x = p.x0 + slot * i + (slot - bw) / 2;
    const c = i === highlight ? PALETTE[1] : colour;
    // 4px rounded data-end, anchored to the baseline.
    g += `<path d="M${x} ${p.y1} L${x} ${p.y1 - h + 4} Q${x} ${p.y1 - h} ${x + 4} ${p.y1 - h}
      L${x + bw - 4} ${p.y1 - h} Q${x + bw} ${p.y1 - h} ${x + bw} ${p.y1 - h + 4} L${x + bw} ${p.y1} Z" fill="${c}"/>`;
    g += `<text x="${x + bw / 2}" y="${p.y1 - h - 16}" text-anchor="middle" font-family="${SANS}" font-size="21" font-weight="700" fill="${INK}">${esc(valueLabels[i])}</text>`;
    g += `<text x="${x + bw / 2}" y="${p.y1 + 32}" text-anchor="middle" font-family="${SANS}" font-size="17" fill="${MUTED}">${esc(labels[i])}</text>`;
  });
  return frame({ title, subtitle, source, body: g });
}

export function rowChart({ title, subtitle, source, labels, values, valueLabels }) {
  const p = plot({ left: 300, right: 130, top: 150, bottom: 60 });
  const max = Math.max(...values) * 1.1;
  const n = values.length;
  const slot = (p.y1 - p.y0) / n;
  const bh = Math.min(slot * 0.62, 42);

  let g = "";
  values.forEach((v, i) => {
    const w = (v / max) * (p.x1 - p.x0);
    const y = p.y0 + slot * i + (slot - bh) / 2;
    // Magnitude is one hue: darker means larger.
    const t = 0.35 + 0.65 * (v / Math.max(...values));
    const c = `rgba(26,127,75,${t.toFixed(2)})`;
    g += `<path d="M${p.x0} ${y} L${p.x0 + w - 4} ${y} Q${p.x0 + w} ${y} ${p.x0 + w} ${y + 4}
      L${p.x0 + w} ${y + bh - 4} Q${p.x0 + w} ${y + bh} ${p.x0 + w - 4} ${y + bh} L${p.x0} ${y + bh} Z" fill="${c}"/>`;
    g += `<text x="${p.x0 - 16}" y="${y + bh / 2 + 6}" text-anchor="end" font-family="${SANS}" font-size="17" fill="${INK}">${esc(labels[i])}</text>`;
    g += `<text x="${p.x0 + w + 14}" y="${y + bh / 2 + 6}" font-family="${SANS}" font-size="17" font-weight="600" fill="${MUTED}">${esc(valueLabels[i])}</text>`;
  });
  return frame({ title, subtitle, source, body: g });
}
