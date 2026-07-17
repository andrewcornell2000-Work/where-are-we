import { getStroke } from "perfect-freehand";

// Convert a set of points into a filled SVG path that looks like a crayon stroke.
export function strokePath(points: Array<[number, number]>, size: number): string {
  if (points.length === 0) return "";
  const outline = getStroke(points, {
    size,
    thinning: 0.55,
    smoothing: 0.6,
    streamline: 0.5,
    simulatePressure: true,
    last: true,
  });
  if (!outline.length) return "";
  return outlineToPath(outline);
}

function outlineToPath(points: number[][]): string {
  const d = points.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", points[0][0], points[0][1], "Q"] as (string | number)[],
  );
  d.push("Z");
  return d.join(" ");
}
