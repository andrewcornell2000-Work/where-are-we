import { memo, useMemo } from "react";
import type { Rect } from "../lib/geometry";
import { crayonRoundedRect, seedFrom } from "../lib/rough";
import { CRAYON } from "../lib/theme";
import { DrawnPath } from "./DrawnPath";

interface Props {
  id: string;
  title: string;
  rect: Rect;
  color?: string;
  done: number;
  total: number;
  draw: boolean;
  baseDelayMs?: number;
  onDone?: (id: string) => void;
}

export const SectionShape = memo(function SectionShape({
  id,
  title,
  rect,
  color = CRAYON.chalkWhite,
  done,
  total,
  draw,
  baseDelayMs = 0,
  onDone,
}: Props) {
  const seed = useMemo(() => seedFrom(id), [id]);
  const paths = useMemo(
    () =>
      crayonRoundedRect(rect.x, rect.y, rect.w, rect.h, 26, {
        color,
        seed,
        strokeWidth: 2.2,
        roughness: 2.6,
        bowing: 2,
      }),
    [rect.x, rect.y, rect.w, rect.h, color, seed],
  );

  // Progress ring (SVG arc via dasharray on a circle).
  const ringR = 15;
  const ringC = 2 * Math.PI * ringR;
  const frac = total > 0 ? done / total : 0;
  const ringX = rect.x + rect.w - 34;
  const ringY = rect.y + 34;
  const complete = total > 0 && done === total;

  return (
    <g className="section" pointerEvents="none">
      {paths.map((p, i) => (
        <DrawnPath
          key={i}
          d={p.d}
          stroke={p.stroke || color}
          strokeWidth={p.strokeWidth || 2.2}
          draw={draw}
          delayMs={baseDelayMs + i * 110}
          durationMs={620}
          opacity={0.5}
          onDone={i === paths.length - 1 && onDone ? () => onDone(id) : undefined}
        />
      ))}

      <text x={rect.x + 26} y={rect.y + 44} className="section-title" style={{ fill: color }}>
        {title}
      </text>

      {total > 0 && (
        <g opacity={0.9}>
          <circle cx={ringX} cy={ringY} r={ringR} fill="none" strokeWidth={2.5} opacity={0.2} style={{ stroke: color }} />
          <circle
            cx={ringX}
            cy={ringY}
            r={ringR}
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${ringC * frac} ${ringC}`}
            transform={`rotate(-90 ${ringX} ${ringY})`}
            style={{ stroke: complete ? CRAYON.green : color }}
          />
          <text x={ringX} y={ringY + 4} className="section-count" style={{ fill: complete ? CRAYON.green : color }}>
            {done}/{total}
          </text>
        </g>
      )}
    </g>
  );
});
