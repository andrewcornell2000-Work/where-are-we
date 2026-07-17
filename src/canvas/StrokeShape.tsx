import { useMemo } from "react";
import type { FreehandStroke } from "../types";
import { strokePath } from "../lib/freehand";

interface Props {
  stroke: FreehandStroke;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function StrokeShape({ stroke, onPointerDown }: Props) {
  const d = useMemo(() => strokePath(stroke.points, stroke.size), [stroke.points, stroke.size]);
  if (!d) return null;
  return (
    <path
      d={d}
      stroke="none"
      opacity={0.95}
      onPointerDown={onPointerDown}
      style={{ fill: stroke.color, cursor: onPointerDown ? "pointer" : "default" }}
    />
  );
}
