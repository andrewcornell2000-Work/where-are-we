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
  if (override?.h) return { w, h: override.h };
  // Mirror the rendered card: 22px v-padding + 15px status row, then the
  // hand-written title (21px/1.05 ≈ 22px per line, clamped to 3 in CSS) and
  // the note (14px/1.2 ≈ 17px per line, clamped to 4).
  const textW = w - 28;
  const titleLines = Math.min(3, Math.max(1, Math.ceil(node.title.length / Math.max(1, Math.floor(textW / 10.5)))));
  let h = 40 + titleLines * 22;
  if (node.note) {
    const perLine = Math.max(1, Math.floor(textW / 8.2));
    const noteLines = Math.min(4, Math.max(1, Math.ceil(node.note.length / perLine)));
    h += 3 + noteLines * 17;
  }
  if (node.link || node.projectRef) h += 20;
  return { w, h: Math.max(NODE_MIN_H, h + 8) };
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

export function inflate(r: Rect, m: number): Rect {
  return { x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m };
}

export function rectsOverlap(a: Rect, b: Rect, margin = 0): boolean {
  return (
    a.x < b.x + b.w + margin &&
    a.x + a.w + margin > b.x &&
    a.y < b.y + b.h + margin &&
    a.y + a.h + margin > b.y
  );
}

/** True if any segment of the polyline passes through the rect (sampled). */
export function polylineHitsRect(pts: Array<[number, number]>, r: Rect): boolean {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 10));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      if (pointInRect(r, ax + (bx - ax) * t, ay + (by - ay) * t)) return true;
    }
  }
  return false;
}

export function polylineHitsAny(pts: Array<[number, number]>, rects: Rect[]): boolean {
  return rects.some((r) => polylineHitsRect(pts, r));
}

// Obstacle-aware fallback router for edges whose ELK route is stale or missing
// (e.g. an endpoint was pinned by hand). Straight anchor line when clear;
// otherwise an orthogonal A* over a coarse grid (with a turn penalty so routes
// stay mostly straight). Straight line as last resort if no path exists.
export function routeEdge(from: Rect, to: Rect, obstacles: Rect[]): Array<[number, number]> {
  const obs = obstacles.map((o) => inflate(o, 8));
  const [fcx, fcy] = rectCenter(from);
  const [tcx, tcy] = rectCenter(to);
  const straight: Array<[number, number]> = [edgeAnchor(from, tcx, tcy), edgeAnchor(to, fcx, fcy)];
  if (!polylineHitsAny(straight, obs)) return straight;

  const CELL = 30;
  const everything = [...obs, from, to];
  const minX = Math.min(...everything.map((r) => r.x)) - 90;
  const minY = Math.min(...everything.map((r) => r.y)) - 90;
  const maxX = Math.max(...everything.map((r) => r.x + r.w)) + 90;
  const maxY = Math.max(...everything.map((r) => r.y + r.h)) + 90;
  const cols = Math.ceil((maxX - minX) / CELL);
  const rows = Math.ceil((maxY - minY) / CELL);
  if (cols * rows > 60000) return straight;

  const blocked = new Uint8Array(cols * rows);
  for (const o of obs) {
    const c0 = Math.max(0, Math.floor((o.x - minX) / CELL));
    const c1 = Math.min(cols - 1, Math.floor((o.x + o.w - minX) / CELL));
    const r0 = Math.max(0, Math.floor((o.y - minY) / CELL));
    const r1 = Math.min(rows - 1, Math.floor((o.y + o.h - minY) / CELL));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) blocked[r * cols + c] = 1;
  }

  const clampCell = (x: number, y: number): [number, number] => [
    Math.min(cols - 1, Math.max(0, Math.floor((x - minX) / CELL))),
    Math.min(rows - 1, Math.max(0, Math.floor((y - minY) / CELL))),
  ];
  const [sc, sr] = clampCell(fcx, fcy);
  const [gc, gr] = clampCell(tcx, tcy);

  // A* over (cell, incoming direction); cost 1 per step + 2 per turn.
  const DIRS: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const stateCount = cols * rows * 4;
  const dist = new Float64Array(stateCount).fill(Infinity);
  const prev = new Int32Array(stateCount).fill(-1);
  const h = (c: number, r: number) => Math.abs(c - gc) + Math.abs(r - gr);
  // Tiny binary-heap-free frontier: sorted-insertion array is fine at this size.
  const open: Array<[number, number]> = []; // [f, state]
  const push = (f: number, s: number) => {
    let i = open.length;
    open.push([f, s]);
    while (i > 0 && open[i][0] < open[i - 1][0]) {
      [open[i], open[i - 1]] = [open[i - 1], open[i]];
      i--;
    }
  };
  for (let d = 0; d < 4; d++) {
    const s = (sr * cols + sc) * 4 + d;
    dist[s] = 0;
    push(h(sc, sr), s);
  }
  let goalState = -1;
  while (open.length) {
    const [, s] = open.shift()!;
    const d = s % 4;
    const cell = (s - d) / 4;
    const c = cell % cols;
    const r = (cell - c) / cols;
    if (c === gc && r === gr) {
      goalState = s;
      break;
    }
    for (let nd = 0; nd < 4; nd++) {
      const nc = c + DIRS[nd][0];
      const nr = r + DIRS[nd][1];
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      if (blocked[nr * cols + nc] && !(nc === gc && nr === gr)) continue;
      const ns = (nr * cols + nc) * 4 + nd;
      const cost = dist[s] + 1 + (nd === d ? 0 : 2);
      if (cost < dist[ns]) {
        dist[ns] = cost;
        prev[ns] = s;
        push(cost + h(nc, nr), ns);
      }
    }
  }
  if (goalState < 0) return straight;

  const cellPts: Array<[number, number]> = [];
  for (let s = goalState; s >= 0; s = prev[s]) {
    const cell = (s - (s % 4)) / 4;
    const c = cell % cols;
    const r = (cell - c) / cols;
    cellPts.unshift([minX + (c + 0.5) * CELL, minY + (r + 0.5) * CELL]);
    if (dist[s] === 0) break;
  }
  // Compress collinear runs.
  const pts: Array<[number, number]> = [];
  for (const p of cellPts) {
    const n = pts.length;
    if (
      n >= 2 &&
      ((pts[n - 1][0] === pts[n - 2][0] && pts[n - 1][0] === p[0]) ||
        (pts[n - 1][1] === pts[n - 2][1] && pts[n - 1][1] === p[1]))
    ) {
      pts[n - 1] = p;
    } else {
      pts.push(p);
    }
  }
  // Trim interior points swallowed by the endpoint cards, then attach to borders.
  while (pts.length > 1 && pointInRect(inflate(from, 4), pts[1][0], pts[1][1])) pts.shift();
  while (pts.length > 1 && pointInRect(inflate(to, 4), pts[pts.length - 2][0], pts[pts.length - 2][1])) pts.pop();
  if (pts.length < 2) return straight;
  pts[0] = edgeAnchor(from, pts[1][0], pts[1][1]);
  pts[pts.length - 1] = edgeAnchor(to, pts[pts.length - 2][0], pts[pts.length - 2][1]);
  return pts;
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
