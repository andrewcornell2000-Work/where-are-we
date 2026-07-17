import type { NodePos, WawNode } from "../types";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const NODE_W = 220;
export const NODE_MIN_H = 74;

export function nodeSize(node: WawNode, override?: NodePos): { w: number; h: number } {
  const w = override?.w ?? NODE_W;
  let h = override?.h ?? NODE_MIN_H;
  if (!override?.h && node.note) {
    // rough extra height for wrapped note text
    const perLine = Math.floor((w - 28) / 8.2);
    const lines = Math.max(1, Math.ceil(node.note.length / Math.max(1, perLine)));
    h = NODE_MIN_H + Math.min(lines, 4) * 16 + 6;
  }
  if (!override?.h && (node.link || node.projectRef)) h += 18;
  return { w, h };
}

export function rectOf(node: WawNode, pos: NodePos): Rect {
  const { w, h } = nodeSize(node, pos);
  return { x: pos.x, y: pos.y, w, h };
}

export function rectCenter(r: Rect): [number, number] {
  return [r.x + r.w / 2, r.y + r.h / 2];
}

// Point on the border of rect `r` in the direction of point (px,py).
export function edgeAnchor(r: Rect, px: number, py: number): [number, number] {
  const [cx, cy] = rectCenter(r);
  const dx = px - cx;
  const dy = py - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const hw = r.w / 2;
  const hh = r.h / 2;
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  return [cx + dx * scale, cy + dy * scale];
}

// Rounded-rectangle SVG path data.
export function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M${x + rr},${y}`,
    `H${x + w - rr}`,
    `A${rr},${rr} 0 0 1 ${x + w},${y + rr}`,
    `V${y + h - rr}`,
    `A${rr},${rr} 0 0 1 ${x + w - rr},${y + h}`,
    `H${x + rr}`,
    `A${rr},${rr} 0 0 1 ${x},${y + h - rr}`,
    `V${y + rr}`,
    `A${rr},${rr} 0 0 1 ${x + rr},${y}`,
    "Z",
  ].join(" ");
}

export function pointInRect(r: Rect, px: number, py: number): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function distToSegment(
  px: number,
  py: number,
  a: [number, number],
  b: [number, number],
): number {
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function distToPolyline(px: number, py: number, pts: Array<[number, number]>): number {
  if (pts.length === 1) return Math.hypot(pts[0][0] - px, pts[0][1] - py);
  let min = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    min = Math.min(min, distToSegment(px, py, pts[i], pts[i + 1]));
  }
  return min;
}

/** Point halfway along a polyline's total length (for edge labels). */
export function polylineMidpoint(pts: Array<[number, number]>): [number, number] {
  if (pts.length === 0) return [0, 0];
  if (pts.length === 1) return pts[0];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  }
  let rem = total / 2;
  for (let i = 0; i < pts.length - 1; i++) {
    const seg = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (rem <= seg) {
      const t = seg === 0 ? 0 : rem / seg;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
    }
    rem -= seg;
  }
  return pts[pts.length - 1];
}
