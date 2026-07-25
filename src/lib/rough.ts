import rough from "roughjs";
import { roundedRectPath } from "./geometry";

// One shared generator. We use the *generator* (not the canvas/svg renderer) so
// we get raw SVG path strings back and can animate them ourselves via
// stroke-dashoffset (the "line draws itself" effect).
//
// Every shape sets disableMultiStroke: true. rough.js defaults to sketching each
// outline twice, which at these line weights reads as a confusing double line
// rather than a crayon stroke. One wobbly pass plus the page's chalk grain gives
// the hand-drawn feel without the doubling (and halves the paths we animate).
const generator = rough.generator();

export interface RoughPath {
  d: string;
  stroke: string;
  strokeWidth: number;
  fill?: string;
}

// Deterministic seed from a string so a node re-renders with the same wobble.
export function seedFrom(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // rough.js treats seed 0 as "randomize every call" — avoid it.
  return ((h >>> 0) % 2147483647) || 1;
}

interface CrayonOpts {
  color: string;
  strokeWidth?: number;
  roughness?: number;
  bowing?: number;
  seed?: number;
  fill?: string;
  fillStyle?: string;
  fillWeight?: number;
}

export function crayonRoundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  opts: CrayonOpts,
): RoughPath[] {
  const d = roundedRectPath(x, y, w, h, radius);
  const drawable = generator.path(d, {
    stroke: opts.color,
    strokeWidth: opts.strokeWidth ?? 3,
    roughness: opts.roughness ?? 2.1,
    bowing: opts.bowing ?? 1.6,
    seed: opts.seed ?? 1,
    fill: opts.fill,
    fillStyle: opts.fillStyle ?? "hachure",
    fillWeight: opts.fillWeight ?? 1.4,
    hachureGap: 7,
    disableMultiStroke: true,
    preserveVertices: false,
  });
  return generator.toPaths(drawable);
}

// A routed multi-segment crayon line (e.g. ELK orthogonal edge with bend points).
export function crayonPolyline(
  points: Array<[number, number]>,
  opts: CrayonOpts,
): RoughPath[] {
  if (points.length < 2) return [];
  const d = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
  const drawable = generator.path(d, {
    stroke: opts.color,
    strokeWidth: opts.strokeWidth ?? 2.6,
    roughness: opts.roughness ?? 1.4,
    bowing: opts.bowing ?? 1.2,
    seed: opts.seed ?? 1,
    disableMultiStroke: true,
  });
  return generator.toPaths(drawable);
}

// A hand-drawn circle (status dots, progress rings).
export function crayonCircle(
  cx: number,
  cy: number,
  diameter: number,
  opts: CrayonOpts,
): RoughPath[] {
  const drawable = generator.circle(cx, cy, diameter, {
    stroke: opts.color,
    strokeWidth: opts.strokeWidth ?? 2.4,
    roughness: opts.roughness ?? 1.4,
    bowing: opts.bowing ?? 1,
    seed: opts.seed ?? 1,
    fill: opts.fill,
    fillStyle: opts.fillStyle ?? "solid",
    disableMultiStroke: true,
  });
  return generator.toPaths(drawable);
}

export function crayonLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: CrayonOpts,
): RoughPath[] {
  const drawable = generator.line(x1, y1, x2, y2, {
    stroke: opts.color,
    strokeWidth: opts.strokeWidth ?? 2.6,
    roughness: opts.roughness ?? 1.8,
    bowing: opts.bowing ?? 2.2,
    seed: opts.seed ?? 1,
    disableMultiStroke: true,
  });
  return generator.toPaths(drawable);
}

// A short hand-drawn arrowhead at (tx,ty), pointing along the direction from (fx,fy).
export function crayonArrowHead(
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  opts: CrayonOpts,
): RoughPath[] {
  const angle = Math.atan2(ty - fy, tx - fx);
  const len = 14;
  const spread = 0.5;
  const a1x = tx - len * Math.cos(angle - spread);
  const a1y = ty - len * Math.sin(angle - spread);
  const a2x = tx - len * Math.cos(angle + spread);
  const a2y = ty - len * Math.sin(angle + spread);
  const d = `M${a1x},${a1y} L${tx},${ty} L${a2x},${a2y}`;
  const drawable = generator.path(d, {
    stroke: opts.color,
    strokeWidth: opts.strokeWidth ?? 2.6,
    roughness: opts.roughness ?? 1.6,
    bowing: opts.bowing ?? 1,
    seed: opts.seed ?? 1,
    disableMultiStroke: true,
  });
  return generator.toPaths(drawable);
}
