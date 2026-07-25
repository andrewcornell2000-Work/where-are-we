import { memo, useMemo } from "react";
import { polylineMidpoint, roundCorners } from "../lib/geometry";
import { crayonArrowHead, crayonPolyline, seedFrom } from "../lib/rough";
import { CRAYON } from "../lib/theme";
import { DrawnPath } from "./DrawnPath";

interface Props {
  id: string;
  /** Routed polyline in world coordinates (start, bends..., end). */
  points: Array<[number, number]>;
  color?: string;
  label?: string;
  draw: boolean;
  dimmed?: boolean;
  quiet?: boolean;
  critical?: boolean;
  baseDelayMs?: number;
  onDone?: (id: string) => void;
}

export const EdgeShape = memo(function EdgeShape({
  id,
  points,
  color = CRAYON.grey,
  label,
  draw,
  dimmed = false,
  quiet = false,
  critical = false,
  baseDelayMs = 0,
  onDone,
}: Props) {
  const seed = useMemo(() => seedFrom(id), [id]);
  const strokeColor = critical ? CRAYON.gold : color;

  // Soften the orthogonal corners so the route reads as one flowing line.
  const smoothed = useMemo(() => roundCorners(points), [points]);

  const linePaths = useMemo(
    () => crayonPolyline(smoothed, { color: strokeColor, seed, strokeWidth: quiet ? 2.2 : 3 }),
    [smoothed, strokeColor, seed, quiet],
  );

  const headPaths = useMemo(() => {
    if (points.length < 2) return [];
    const [x2, y2] = points[points.length - 1];
    const [x1, y1] = points[points.length - 2];
    return crayonArrowHead(x1, y1, x2, y2, {
      color: strokeColor,
      seed,
      strokeWidth: quiet ? 2.2 : 3,
    });
  }, [points, strokeColor, seed, quiet]);

  if (points.length < 2) return null;
  const [mx, my] = polylineMidpoint(points);

  return (
    <g style={{ opacity: dimmed ? 0.3 : quiet ? 0.45 : 1 }} className={critical ? "glow-gold" : undefined}>
      {linePaths.map((p, i) => (
        <DrawnPath
          key={`l${i}`}
          d={p.d}
          stroke={p.stroke || strokeColor}
          strokeWidth={p.strokeWidth || 2.6}
          draw={draw}
          delayMs={baseDelayMs + i * 90}
          durationMs={460}
        />
      ))}
      {headPaths.map((p, i) => (
        <DrawnPath
          key={`h${i}`}
          d={p.d}
          stroke={p.stroke || strokeColor}
          strokeWidth={p.strokeWidth || 2.6}
          draw={draw}
          delayMs={baseDelayMs + linePaths.length * 90 + 120 + i * 60}
          durationMs={260}
          onDone={i === headPaths.length - 1 && onDone ? () => onDone(id) : undefined}
        />
      ))}
      {label && (
        <foreignObject x={mx - 60} y={my - 14} width={120} height={28} pointerEvents="none">
          <div className="edge-label">{label}</div>
        </foreignObject>
      )}
    </g>
  );
});
