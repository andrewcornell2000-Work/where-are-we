import { memo, useMemo } from "react";
import type { WawNode } from "../types";
import type { Rect } from "../lib/geometry";
import { crayonCircle, crayonRoundedRect, seedFrom } from "../lib/rough";
import { statusColor, statusLabel, CRAYON } from "../lib/theme";
import { DrawnPath } from "./DrawnPath";

interface Props {
  node: WawNode;
  rect: Rect;
  selected: boolean;
  draw: boolean;
  dimmed?: boolean;
  critical?: boolean;
  isNext?: boolean;
  baseDelayMs?: number;
  projectRefTitle?: string;
  onDone?: (id: string) => void;
}

const STROKE_STEP = 130;

/** Geometry of the clickable status dot (top-right corner of the card). */
export function statusDotCenter(rect: Rect): { cx: number; cy: number; r: number } {
  return { cx: rect.x + rect.w - 20, cy: rect.y + 20, r: 12 };
}

export const NodeShape = memo(function NodeShape({
  node,
  rect,
  selected,
  draw,
  dimmed = false,
  critical = false,
  isNext = false,
  baseDelayMs = 0,
  projectRefTitle,
  onDone,
}: Props) {
  const color = statusColor(node.status);
  const seed = useMemo(() => seedFrom(node.id), [node.id]);
  const paths = useMemo(
    () => crayonRoundedRect(rect.x, rect.y, rect.w, rect.h, 16, { color, seed, strokeWidth: 3 }),
    [rect.x, rect.y, rect.w, rect.h, color, seed],
  );
  const dot = statusDotCenter(rect);
  const dotPaths = useMemo(
    () =>
      crayonCircle(dot.cx, dot.cy, dot.r * 2 - 6, {
        color,
        seed: seed + 7,
        fill: color,
        strokeWidth: 2,
      }),
    [dot.cx, dot.cy, dot.r, color, seed],
  );

  const titleDelay = baseDelayMs + (draw ? paths.length * STROKE_STEP + 120 : 0);
  const groupOpacity = dimmed ? 0.42 : 1;

  return (
    <g style={{ opacity: groupOpacity }} data-node-id={node.id}>
      {critical && (
        <rect
          className="glow-gold"
          x={rect.x - 5}
          y={rect.y - 5}
          width={rect.w + 10}
          height={rect.h + 10}
          rx={18}
          fill="none"
          strokeWidth={2.5}
          opacity={0.85}
          style={{ stroke: CRAYON.gold }}
        />
      )}
      {selected && (
        <rect
          x={rect.x - 9}
          y={rect.y - 9}
          width={rect.w + 18}
          height={rect.h + 18}
          rx={20}
          fill="none"
          strokeWidth={1.5}
          strokeDasharray="2 7"
          opacity={0.75}
          style={{ stroke: CRAYON.chalkWhite }}
        />
      )}

      {paths.map((p, i) => (
        <DrawnPath
          key={i}
          d={p.d}
          stroke={p.stroke || color}
          strokeWidth={p.strokeWidth || 3}
          draw={draw}
          delayMs={baseDelayMs + i * STROKE_STEP}
          durationMs={520}
          onDone={i === paths.length - 1 && onDone ? () => onDone(node.id) : undefined}
        />
      ))}

      <foreignObject x={rect.x} y={rect.y} width={rect.w} height={rect.h} pointerEvents="none">
        <div
          className={`node-body ${draw ? "writein" : ""}`}
          style={{ animationDelay: `${titleDelay}ms` }}
        >
          <div className="node-status" style={{ color }}>
            {statusLabel(node.status)}
            {isNext && <span className="next-tag">next up</span>}
          </div>
          <div className="node-title">{node.title}</div>
          {node.note && <div className="node-note">{node.note}</div>}
          {node.link && (
            <div
              className="node-chip"
              title={`${node.link.file}${node.link.line ? ":" + node.link.line : ""}`}
            >
              ↪ {shortFile(node.link.file)}
              {node.link.line ? `:${node.link.line}` : ""}
            </div>
          )}
          {projectRefTitle && <div className="node-chip ref">↳ {projectRefTitle}</div>}
        </div>
      </foreignObject>

      {/* status dot: crayon circle, clickable (hit-tested in CanvasView) */}
      <g style={{ opacity: draw ? 0 : 1, transition: "opacity .3s" }}>
        {dotPaths.map((p, i) => (
          <path
            key={`d${i}`}
            d={p.d}
            strokeWidth={p.strokeWidth || 2}
            opacity={0.95}
            style={{
              fill: p.fill && p.fill !== "none" ? color : "none",
              stroke: p.stroke || color,
            }}
          />
        ))}
      </g>
    </g>
  );
});

function shortFile(f: string): string {
  const parts = f.split(/[\\/]/);
  return parts[parts.length - 1] || f;
}
