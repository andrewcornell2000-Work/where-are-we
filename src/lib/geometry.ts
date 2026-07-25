import type { NodePos, WawNode } from "../types";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const NODE_W = 220;
export const NODE_MIN_H = 74;

export function nodeSize(node: WawNode, override?: NodePos, cardScale = 1): { w: number; h: number } {
  const w = override?.w ?? NODE_W * cardScale;
  if (override?.h) return { w, h: override.h };
  // Mirror the rendered card: 22px v-padding + 15px status row, then the
  // hand-written title (21px/1.05 ≈ 22px per line, clamped to 3 in CSS) and
  // the note (14px/1.2 ≈ 17px per line, clamped to 4).
  // Text and padding scale with the card, so line counts are scale-invariant
  // and only the vertical metrics need multiplying.
  const textW = w - 28 * cardScale;
  const titleLines = Math.min(
    3,
    Math.max(1, Math.ceil(node.title.length / Math.max(1, Math.floor(textW / (10.5 * cardScale))))),
  );
  let h = (40 + titleLines * 22) * cardScale;
  if (node.note) {
    const perLine = Math.max(1, Math.floor(textW / (8.2 * cardScale)));
    const noteLines = Math.min(4, Math.max(1, Math.ceil(node.note.length / perLine)));
    h += (3 + noteLines * 17) * cardScale;
  }
  if (node.link || node.projectRef) h += 20 * cardScale;
  return { w, h: Math.max(NODE_MIN_H * cardScale, h + 8 * cardScale) };
}

export function rectOf(node: WawNode, pos: NodePos, cardScale = 1): Rect {
  const { w, h } = nodeSize(node, pos, cardScale);
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

export const SNAP_GRID = 20;

/**
 * Snap a dragged position to a grid, and prefer alignment with a nearby card's
 * edge or centre when one is close. Returns the adjusted position plus the
 * guide lines that justified it, so the canvas can show why it snapped.
 */
export function snapPosition(
  pos: { x: number; y: number },
  size: { w: number; h: number },
  others: Rect[],
  tolerance = 9,
): { x: number; y: number; guides: Array<{ axis: "x" | "y"; at: number }> } {
  const guides: Array<{ axis: "x" | "y"; at: number }> = [];
  let x = Math.round(pos.x / SNAP_GRID) * SNAP_GRID;
  let y = Math.round(pos.y / SNAP_GRID) * SNAP_GRID;

  // Alignment with a neighbour beats the raw grid when it is closer.
  let bestX: { d: number; v: number; at: number } | null = null;
  let bestY: { d: number; v: number; at: number } | null = null;
  for (const o of others) {
    for (const [cand, at] of [
      [o.x, o.x],
      [o.x + o.w - size.w, o.x + o.w],
      [o.x + o.w / 2 - size.w / 2, o.x + o.w / 2],
    ] as Array<[number, number]>) {
      const d = Math.abs(pos.x - cand);
      if (d <= tolerance && (!bestX || d < bestX.d)) bestX = { d, v: cand, at };
    }
    for (const [cand, at] of [
      [o.y, o.y],
      [o.y + o.h - size.h, o.y + o.h],
      [o.y + o.h / 2 - size.h / 2, o.y + o.h / 2],
    ] as Array<[number, number]>) {
      const d = Math.abs(pos.y - cand);
      if (d <= tolerance && (!bestY || d < bestY.d)) bestY = { d, v: cand, at };
    }
  }
  if (bestX) {
    x = bestX.v;
    guides.push({ axis: "x", at: bestX.at });
  }
  if (bestY) {
    y = bestY.v;
    guides.push({ axis: "y", at: bestY.at });
  }
  return { x, y, guides };
}

/**
 * Replace each sharp corner of a polyline with a short arc of sample points, so
 * an orthogonal route reads as a flowing line rather than a staircase. Purely
 * cosmetic: hit-testing and clearance still use the original points.
 */
export function roundCorners(
  pts: Array<[number, number]>,
  radius = 18,
): Array<[number, number]> {
  if (pts.length < 3) return pts;
  const out: Array<[number, number]> = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    if (inLen < 1 || outLen < 1) continue;
    const r = Math.min(radius, inLen / 2, outLen / 2);
    const ax = cx - ((cx - px) / inLen) * r;
    const ay = cy - ((cy - py) / inLen) * r;
    const bx = cx + ((nx - cx) / outLen) * r;
    const by = cy + ((ny - cy) / outLen) * r;
    // Quadratic through the corner, sampled so rough.js can sketch it.
    const STEPS = 5;
    for (let s = 0; s <= STEPS; s++) {
      const t = s / STEPS;
      const mt = 1 - t;
      out.push([
        mt * mt * ax + 2 * mt * t * cx + t * t * bx,
        mt * mt * ay + 2 * mt * t * cy + t * t * by,
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * Last-resort route that goes around every obstacle instead of through them.
 * Used when A* cannot find a lane: a long way round still reads as a
 * connection, whereas a straight line across three cards reads as a mistake.
 */
function detourRoute(from: Rect, to: Rect, obs: Rect[]): Array<[number, number]> {
  const all = [...obs, from, to];
  const above = Math.min(...all.map((r) => r.y)) - 40;
  const below = Math.max(...all.map((r) => r.y + r.h)) + 40;

  // The vertical runs must leave their card through a column that is actually
  // clear, otherwise the detour drives straight through whatever is stacked
  // above or below it.
  const clearColumn = (r: Rect, lane: number): number => {
    const yTop = Math.min(lane, r.y);
    const yBot = Math.max(lane, r.y + r.h);
    const column = (x: number): boolean =>
      !obs.some((o) => x > o.x && x < o.x + o.w && yBot > o.y && yTop < o.y + o.h);
    const centre = r.x + r.w / 2;
    if (column(centre)) return centre;
    for (let step = 12; step <= 400; step += 12) {
      if (column(r.x - step)) return r.x - step;
      if (column(r.x + r.w + step)) return r.x + r.w + step;
    }
    return centre;
  };

  const overCost = from.y - above + (to.y - above);
  const underCost = below - (from.y + from.h) + (below - (to.y + to.h));
  const lane = overCost <= underCost ? above : below;
  const fx = clearColumn(from, lane);
  const tx = clearColumn(to, lane);
  const fy = lane === above ? from.y : from.y + from.h;
  const ty = lane === above ? to.y : to.y + to.h;
  return [
    [fx, fy],
    [fx, lane],
    [tx, lane],
    [tx, ty],
  ];
}

// Obstacle-aware fallback router for edges whose ELK route is stale or missing
// (e.g. an endpoint was pinned by hand). Straight anchor line when clear;
// otherwise an orthogonal A* with a turn penalty so routes stay mostly straight.
//
// The grid must be finer than the gap between two cards, or every lane between
// them reads as blocked and the router gives up. Card spacing is ~34-50px and
// obstacles are padded, so cells stay small; we never fall back to a straight
// line through cards, only to a detour around them.
export function routeEdge(from: Rect, to: Rect, obstacles: Rect[]): Array<[number, number]> {
  // Generous clearance keeps a route clear of the crayon jitter, but a tight
  // board may have no such lane. Rather than give up and cut across cards, try
  // progressively tighter clearances first; only detour if even the tightest
  // fails.
  // Whatever a clearance pass produces is only accepted if the finished
  // polyline actually clears every card. Reconstructing the path (trimming
  // points swallowed by the endpoints, then re-anchoring to the card borders)
  // can reintroduce a segment that cuts a corner, so the result is re-checked
  // rather than trusted.
  const check = obstacles.map((o) => inflate(o, 2));
  for (const pad of [11, 6, 3]) {
    const found = routeWithClearance(from, to, obstacles, pad);
    if (found && !polylineHitsAny(found, check)) return found;
  }
  const detour = detourRoute(from, to, obstacles.map((o) => inflate(o, 3)));
  if (!polylineHitsAny(detour, check)) return detour;
  // Nothing is clean: prefer the detour (around) over a straight line (through).
  return detour;
}

function routeWithClearance(
  from: Rect,
  to: Rect,
  obstacles: Rect[],
  PAD: number,
): Array<[number, number]> | null {
  const obs = obstacles.map((o) => inflate(o, PAD));
  const [fcx, fcy] = rectCenter(from);
  const [tcx, tcy] = rectCenter(to);
  const straight: Array<[number, number]> = [edgeAnchor(from, tcx, tcy), edgeAnchor(to, fcx, fcy)];
  if (!polylineHitsAny(straight, obs)) return straight;

  const everything = [...obs, from, to];
  const minX = Math.min(...everything.map((r) => r.x)) - 90;
  const minY = Math.min(...everything.map((r) => r.y)) - 90;
  const maxX = Math.max(...everything.map((r) => r.x + r.w)) + 90;
  const maxY = Math.max(...everything.map((r) => r.y + r.h)) + 90;
  // Fine enough to slip between cards, coarsened only if the board is huge.
  const MAX_CELLS = 90000;
  let CELL = 10;
  while (Math.ceil((maxX - minX) / CELL) * Math.ceil((maxY - minY) / CELL) > MAX_CELLS) CELL += 4;
  const cols = Math.ceil((maxX - minX) / CELL);
  const rows = Math.ceil((maxY - minY) / CELL);

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
  // Binary heap frontier. The grid is fine enough to slip between cards, so the
  // state space is large and a sorted-array frontier would dominate the cost.
  const heapF: number[] = [];
  const heapS: number[] = [];
  const push = (f: number, s: number) => {
    heapF.push(f);
    heapS.push(s);
    let i = heapF.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heapF[p] <= heapF[i]) break;
      [heapF[p], heapF[i]] = [heapF[i], heapF[p]];
      [heapS[p], heapS[i]] = [heapS[i], heapS[p]];
      i = p;
    }
  };
  const pop = (): number => {
    const top = heapS[0];
    const lastF = heapF.pop()!;
    const lastS = heapS.pop()!;
    if (heapF.length) {
      heapF[0] = lastF;
      heapS[0] = lastS;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heapF.length && heapF[l] < heapF[m]) m = l;
        if (r < heapF.length && heapF[r] < heapF[m]) m = r;
        if (m === i) break;
        [heapF[m], heapF[i]] = [heapF[i], heapF[m]];
        [heapS[m], heapS[i]] = [heapS[i], heapS[m]];
        i = m;
      }
    }
    return top;
  };
  for (let d = 0; d < 4; d++) {
    const s = (sr * cols + sc) * 4 + d;
    dist[s] = 0;
    push(h(sc, sr), s);
  }
  let goalState = -1;
  while (heapF.length) {
    const s = pop();
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
  if (goalState < 0) return null;

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
  if (pts.length < 2) return null;
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
