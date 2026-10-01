"use client";

// Canvas density-heatmap renderer (classic alpha-accumulation + colour LUT).

export interface HeatPoint {
  x: number;
  y: number;
  weight?: number;
}

const LUT_STOPS: Array<[number, [number, number, number]]> = [
  [0.0, [0, 0, 0]],
  [0.2, [20, 60, 220]],
  [0.35, [30, 160, 230]],
  [0.5, [60, 200, 120]],
  [0.62, [180, 220, 60]],
  [0.75, [250, 210, 50]],
  [0.88, [245, 130, 40]],
  [1.0, [235, 60, 50]],
];

function buildLut(): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const v = i / 255;
    let lo = LUT_STOPS[0];
    let hi = LUT_STOPS[LUT_STOPS.length - 1];
    for (let s = 0; s < LUT_STOPS.length - 1; s++) {
      if (v >= LUT_STOPS[s][0] && v <= LUT_STOPS[s + 1][0]) {
        lo = LUT_STOPS[s];
        hi = LUT_STOPS[s + 1];
        break;
      }
    }
    const span = hi[0] - lo[0] || 1;
    const p = (v - lo[0]) / span;
    lut[i * 3] = lo[1][0] + (hi[1][0] - lo[1][0]) * p;
    lut[i * 3 + 1] = lo[1][1] + (hi[1][1] - lo[1][1]) * p;
    lut[i * 3 + 2] = lo[1][2] + (hi[1][2] - lo[1][2]) * p;
  }
  return lut;
}

let cachedLut: Uint8ClampedArray | null = null;

export interface HeatmapOptions {
  radius?: number; // px in final canvas space
  strength?: number; // alpha contribution per point (0-1)
  opacity?: number; // final overlay opacity
  scale?: number; // canvas is drawn at this scale then stretched
}

/**
 * Renders a density heatmap onto `canvas`.
 * Coordinates in `points` are expressed in final-canvas pixel space.
 */
export function drawHeatmap(
  canvas: HTMLCanvasElement,
  points: HeatPoint[],
  opts: HeatmapOptions = {}
) {
  const {
    radius = 46,
    strength = 0.14,
    opacity = 0.85,
    scale = 2,
  } = opts;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (points.length === 0) return;

  // 1. Accumulate alpha on a downscaled offscreen buffer.
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.round(canvas.width / scale));
  off.height = Math.max(1, Math.round(canvas.height / scale));
  const octx = off.getContext("2d");
  if (!octx) return;
  const r = Math.max(2, radius / scale);
  for (const p of points) {
    const ax = (p.x / canvas.width) * off.width;
    const ay = (p.y / canvas.height) * off.height;
    const g = octx.createRadialGradient(ax, ay, 0, ax, ay, r);
    g.addColorStop(0, `rgba(0,0,0,${strength * (p.weight ?? 1)})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    octx.fillStyle = g;
    octx.fillRect(ax - r, ay - r, r * 2, r * 2);
  }

  // 2. Colourise by alpha through the LUT.
  if (!cachedLut) cachedLut = buildLut();
  const img = octx.getImageData(0, 0, off.width, off.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a === 0) continue;
    const idx = Math.min(255, a) * 3;
    d[i] = cachedLut[idx];
    d[i + 1] = cachedLut[idx + 1];
    d[i + 2] = cachedLut[idx + 2];
    d[i + 3] = Math.min(255, Math.round(a * 1.9));
  }
  octx.putImageData(img, 0, 0);

  // 3. Blit onto the target canvas.
  ctx.globalAlpha = opacity;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
}

/** Maps a 0..1 value to a "reach" colour (teal -> amber -> red, low reach = red). */
export function reachColor(fraction: number, alpha = 0.55): string {
  const stops: Array<[number, [number, number, number]]> = [
    [0, [235, 70, 60]],
    [0.35, [245, 158, 11]],
    [0.7, [20, 184, 166]],
    [1, [15, 118, 110]],
  ];
  const v = Math.max(0, Math.min(1, fraction));
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let s = 0; s < stops.length - 1; s++) {
    if (v >= stops[s][0] && v <= stops[s + 1][0]) {
      lo = stops[s];
      hi = stops[s + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const p = (v - lo[0]) / span;
  const c = [
    Math.round(lo[1][0] + (hi[1][0] - lo[1][0]) * p),
    Math.round(lo[1][1] + (hi[1][1] - lo[1][1]) * p),
    Math.round(lo[1][2] + (hi[1][2] - lo[1][2]) * p),
  ];
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
}
