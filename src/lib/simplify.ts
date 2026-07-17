import { distToSegment } from "./geometry";

// Ramer-Douglas-Peucker simplification for freehand strokes: raw pointer samples
// arrive at up to 120 Hz, which balloons the layout file. Epsilon in world units.
export function simplifyStroke(
  points: Array<[number, number]>,
  epsilon = 1.2,
): Array<[number, number]> {
  if (points.length <= 2) return points;
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;

  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop()!;
    let maxDist = 0;
    let maxIdx = -1;
    for (let i = start + 1; i < end; i++) {
      const d = distToSegment(points[i][0], points[i][1], points[start], points[end]);
      if (d > maxDist) {
        maxDist = d;
        maxIdx = i;
      }
    }
    if (maxDist > epsilon && maxIdx > 0) {
      keep[maxIdx] = true;
      stack.push([start, maxIdx], [maxIdx, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}
