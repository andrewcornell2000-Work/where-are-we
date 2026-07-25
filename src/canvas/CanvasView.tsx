import { useCallback, useEffect, useRef, useState } from "react";
import type { Camera, FreehandStroke, NodePos, WawNode } from "../types";
import type { Rect } from "../lib/geometry";
import { distToPolyline, pointInRect } from "../lib/geometry";
import { simplifyStroke } from "../lib/simplify";
import { CRAYON } from "../lib/theme";
import { NodeShape, statusDotCenter } from "./NodeShape";
import { EdgeShape } from "./EdgeShape";
import { SectionShape } from "./SectionShape";
import { StrokeShape } from "./StrokeShape";
import type { Lod } from "./lod";
import { strokePath } from "../lib/freehand";
import { emitFlakes } from "../lib/flakes";

export type Tool = "pan" | "select" | "draw" | "connect" | "text" | "eraser";

export interface NodeItem {
  node: WawNode;
  rect: Rect;
  draw: boolean;
  delay: number;
  selected: boolean;
  dimmed?: boolean;
  critical?: boolean;
  isNext?: boolean;
  /** Ghost/preview cards are rendered but never hit-tested or persisted. */
  interactive: boolean;
  projectRefTitle?: string;
}

export interface EdgeItem {
  id: string;
  points: Array<[number, number]>;
  color?: string;
  label?: string;
  draw: boolean;
  delay: number;
  dimmed?: boolean;
  critical?: boolean;
  erasable: boolean;
}

export interface SectionItem {
  id: string;
  title: string;
  rect: Rect;
  color?: string;
  done: number;
  total: number;
  draw: boolean;
  delay: number;
}

export type EraseTarget =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string }
  | { kind: "stroke"; id: string };

interface Props {
  sections: SectionItem[];
  nodes: NodeItem[];
  edges: EdgeItem[];
  strokes: FreehandStroke[];
  tool: Tool;
  color: string;
  camera: Camera;
  lod: Lod;
  connectSourceId: string | null;
  onCamera: (c: Camera) => void;
  onSelect: (id: string | null) => void;
  onMoveNode: (id: string, pos: NodePos) => void;
  onResizeNode: (id: string, pos: NodePos) => void;
  onAddNode: (pos: { x: number; y: number }) => void;
  onAddStroke: (s: FreehandStroke) => void;
  onConnectClick: (nodeId: string) => void;
  onErase: (t: EraseTarget) => void;
  onCycleStatus: (id: string) => void;
  onEditRequest: (id: string) => void;
  onAnimDone: (id: string) => void;
}

type Drag =
  | { kind: "none" }
  | { kind: "pan"; startX: number; startY: number; camX: number; camY: number }
  | { kind: "node"; id: string; offX: number; offY: number }
  | { kind: "resize"; id: string; rx: number; ry: number }
  | { kind: "draw" };

const MIN_SCALE = 0.15;
const MAX_SCALE = 4;
const MIN_NODE_W = 140;
const MIN_NODE_H = 74;
const RESIZE_GRAB = 16;

export function CanvasView(props: Props) {
  const {
    sections,
    nodes,
    edges,
    strokes,
    tool,
    color,
    camera,
    lod,
    connectSourceId,
    onCamera,
    onSelect,
    onMoveNode,
    onResizeNode,
    onAddNode,
    onAddStroke,
    onConnectClick,
    onErase,
    onCycleStatus,
    onEditRequest,
    onAnimDone,
  } = props;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<Drag>({ kind: "none" });
  // Points live in a ref (committed synchronously on pointer-up regardless of
  // React's state-flush timing) mirrored into state purely for the live preview.
  const drawPtsRef = useRef<Array<[number, number]>>([]);
  const [drawPts, setDrawPts] = useState<Array<[number, number]>>([]);
  const [cursorWorld, setCursorWorld] = useState<[number, number] | null>(null);
  // Shavings shed at the pen tip while the user draws by hand.
  const liveFlakesRef = useRef<SVGGElement | null>(null);
  const lastFlakePtRef = useRef<[number, number] | null>(null);

  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const toWorld = useCallback((clientX: number, clientY: number): [number, number] => {
    const cam = cameraRef.current;
    const rect = svgRef.current?.getBoundingClientRect();
    const sx = clientX - (rect?.left ?? 0);
    const sy = clientY - (rect?.top ?? 0);
    return [(sx - cam.x) / cam.scale, (sy - cam.y) / cam.scale];
  }, []);

  const hitNode = useCallback(
    (wx: number, wy: number): NodeItem | null => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        if (!nodes[i].interactive) continue;
        if (pointInRect(nodes[i].rect, wx, wy)) return nodes[i];
      }
      return null;
    },
    [nodes],
  );

  const hitEdge = useCallback(
    (wx: number, wy: number): EdgeItem | null => {
      const tol = 14 / Math.max(0.4, cameraRef.current.scale);
      for (let i = edges.length - 1; i >= 0; i--) {
        if (!edges[i].erasable) continue;
        if (distToPolyline(wx, wy, edges[i].points) <= tol) return edges[i];
      }
      return null;
    },
    [edges],
  );

  const hitStroke = useCallback(
    (wx: number, wy: number): FreehandStroke | null => {
      for (let i = strokes.length - 1; i >= 0; i--) {
        const s = strokes[i];
        const tol = Math.max(16, s.size + 10);
        if (distToPolyline(wx, wy, s.points) <= tol) return s;
      }
      return null;
    },
    [strokes],
  );

  const hitStatusDot = useCallback(
    (wx: number, wy: number): NodeItem | null => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        if (!nodes[i].interactive) continue;
        const { cx, cy, r } = statusDotCenter(nodes[i].rect);
        if (Math.hypot(wx - cx, wy - cy) <= r) return nodes[i];
      }
      return null;
    },
    [nodes],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      try {
        svgRef.current?.setPointerCapture(e.pointerId);
      } catch {
        /* capture is best-effort */
      }
      const [wx, wy] = toWorld(e.clientX, e.clientY);
      const node = hitNode(wx, wy);

      if (tool === "connect") {
        if (node) onConnectClick(node.node.id);
        return;
      }
      if (tool === "text") {
        if (!node) onAddNode({ x: wx, y: wy });
        return;
      }
      if (tool === "eraser") {
        if (node) {
          onErase({ kind: "node", id: node.node.id });
          return;
        }
        const edge = hitEdge(wx, wy);
        if (edge) {
          onErase({ kind: "edge", id: edge.id });
          return;
        }
        const s = hitStroke(wx, wy);
        if (s) onErase({ kind: "stroke", id: s.id });
        return;
      }
      if (tool === "draw") {
        dragRef.current = { kind: "draw" };
        drawPtsRef.current = [[wx, wy]];
        lastFlakePtRef.current = [wx, wy];
        setDrawPts(drawPtsRef.current);
        return;
      }

      // select / pan tools
      // Resize handle of the selected card wins over everything (it hangs
      // slightly outside the rect, so test before node hit).
      if (tool === "select") {
        const sel = nodes.find((n) => n.selected && n.interactive);
        if (sel) {
          const grab = RESIZE_GRAB / Math.max(0.4, cameraRef.current.scale);
          const cx = sel.rect.x + sel.rect.w;
          const cy = sel.rect.y + sel.rect.h;
          if (Math.abs(wx - cx) <= grab && Math.abs(wy - cy) <= grab) {
            dragRef.current = { kind: "resize", id: sel.node.id, rx: sel.rect.x, ry: sel.rect.y };
            return;
          }
        }
      }
      const dotHit = hitStatusDot(wx, wy);
      if (dotHit) {
        onCycleStatus(dotHit.node.id);
        return;
      }
      if (tool === "select" && node) {
        onSelect(node.node.id);
        dragRef.current = { kind: "node", id: node.node.id, offX: wx - node.rect.x, offY: wy - node.rect.y };
        return;
      }
      if (tool === "select" && !node) onSelect(null);
      const cam = cameraRef.current;
      dragRef.current = { kind: "pan", startX: e.clientX, startY: e.clientY, camX: cam.x, camY: cam.y };
    },
    [tool, nodes, toWorld, hitNode, hitEdge, hitStroke, hitStatusDot, onConnectClick, onAddNode, onErase, onSelect, onCycleStatus],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!e.isPrimary) return;
      const [wx, wy] = toWorld(e.clientX, e.clientY);
      if (tool === "connect" && connectSourceId) setCursorWorld([wx, wy]);

      const drag = dragRef.current;
      if (drag.kind === "pan") {
        onCamera({
          ...cameraRef.current,
          x: drag.camX + (e.clientX - drag.startX),
          y: drag.camY + (e.clientY - drag.startY),
        });
      } else if (drag.kind === "node") {
        onMoveNode(drag.id, { x: wx - drag.offX, y: wy - drag.offY });
      } else if (drag.kind === "resize") {
        onResizeNode(drag.id, {
          x: drag.rx,
          y: drag.ry,
          w: Math.max(MIN_NODE_W, wx - drag.rx),
          h: Math.max(MIN_NODE_H, wy - drag.ry),
        });
      } else if (drag.kind === "draw") {
        drawPtsRef.current = [...drawPtsRef.current, [wx, wy]];
        setDrawPts(drawPtsRef.current);
        // Shed crayon shavings at the pen tip as the user draws.
        const group = liveFlakesRef.current;
        const last = lastFlakePtRef.current;
        if (group && (!last || Math.hypot(wx - last[0], wy - last[1]) > 5)) {
          emitFlakes(group, wx, wy, color, 6);
          lastFlakePtRef.current = [wx, wy];
        }
      }
    },
    [tool, connectSourceId, toWorld, onCamera, onMoveNode, onResizeNode, color],
  );

  const onPointerUp = useCallback(() => {
    lastFlakePtRef.current = null;
    const drag = dragRef.current;
    if (drag.kind === "draw" && drawPtsRef.current.length > 1) {
      const s: FreehandStroke = {
        id: `stroke-${Date.now()}-${Math.floor(Math.random() * 1e5)}`,
        points: simplifyStroke(drawPtsRef.current),
        color,
        size: 6,
      };
      onAddStroke(s);
    }
    drawPtsRef.current = [];
    setDrawPts([]);
    dragRef.current = { kind: "none" };
  }, [color, onAddStroke]);

  const onDoubleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const [wx, wy] = toWorld(e.clientX, e.clientY);
      const node = hitNode(wx, wy);
      if (node) onEditRequest(node.node.id);
    },
    [toWorld, hitNode, onEditRequest],
  );

  // Native wheel listener (React attaches wheel passively; we must preventDefault
  // so browser page-zoom via Ctrl+wheel doesn't fight canvas zoom).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, cam.scale * factor));
      const wx = (sx - cam.x) / cam.scale;
      const wy = (sy - cam.y) / cam.scale;
      onCamera({ scale: newScale, x: sx - wx * newScale, y: sy - wy * newScale });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [onCamera]);

  const cursor =
    tool === "pan"
      ? "grab"
      : tool === "draw"
        ? "crosshair"
        : tool === "eraser"
          ? "cell"
          : tool === "text"
            ? "text"
            : tool === "connect"
              ? "crosshair"
              : "default";

  const connectSource = connectSourceId ? nodes.find((n) => n.node.id === connectSourceId) : undefined;

  return (
    <svg
      ref={svgRef}
      className="canvas"
      style={{ cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      <rect className="paper" x={0} y={0} width="100%" height="100%" />

      <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}>
        {/* layer 1: section containers */}
        {sections.map((s) => (
          <SectionShape
            key={s.id}
            id={s.id}
            title={s.title}
            rect={s.rect}
            color={s.color}
            done={s.done}
            total={s.total}
            draw={s.draw}
            baseDelayMs={s.delay}
            onDone={onAnimDone}
          />
        ))}

        {/* layer 2: routed edges */}
        {edges.map((ed) => (
          <EdgeShape
            key={ed.id}
            id={ed.id}
            points={ed.points}
            color={ed.color}
            label={ed.label}
            draw={ed.draw}
            dimmed={ed.dimmed}
            critical={ed.critical}
            baseDelayMs={ed.delay}
            onDone={onAnimDone}
          />
        ))}

        {/* layer 3: freehand crayon strokes */}
        {strokes.map((s) => (
          <StrokeShape key={s.id} stroke={s} />
        ))}

        {/* layer 4: cards on top */}
        {nodes.map((it) => (
          <NodeShape
            key={it.node.id}
            node={it.node}
            rect={it.rect}
            selected={it.selected}
            draw={it.draw}
            lod={lod}
            dimmed={it.dimmed}
            critical={it.critical}
            isNext={it.isNext}
            baseDelayMs={it.delay}
            projectRefTitle={it.projectRefTitle}
            onDone={onAnimDone}
          />
        ))}

        {/* resize handle: bottom-right corner of the selected card */}
        {tool === "select" &&
          nodes
            .filter((n) => n.selected && n.interactive)
            .map((n) => {
              const cx = n.rect.x + n.rect.w;
              const cy = n.rect.y + n.rect.h;
              return (
                <g key={`rs-${n.node.id}`} style={{ cursor: "nwse-resize" }}>
                  <path
                    d={`M${cx - 14},${cy + 4} L${cx + 4},${cy + 4} L${cx + 4},${cy - 14}`}
                    fill="none"
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={0.85}
                    style={{ stroke: CRAYON.chalkWhite }}
                  />
                </g>
              );
            })}

        {/* live freehand preview + crayon shavings at the pen tip */}
        {drawPts.length > 1 && (
          <path d={strokePath(drawPts, 6)} stroke="none" opacity={0.95} style={{ fill: color }} />
        )}
        <g ref={liveFlakesRef} pointerEvents="none" />

        {/* connect-mode source highlight + preview line */}
        {connectSource && (
          <rect
            x={connectSource.rect.x - 7}
            y={connectSource.rect.y - 7}
            width={connectSource.rect.w + 14}
            height={connectSource.rect.h + 14}
            rx={18}
            fill="none"
            strokeWidth={2}
            strokeDasharray="4 6"
            opacity={0.8}
            style={{ stroke: CRAYON.chalkWhite }}
          />
        )}
        {connectSource && cursorWorld && (
          <line
            x1={connectSource.rect.x + connectSource.rect.w / 2}
            y1={connectSource.rect.y + connectSource.rect.h / 2}
            x2={cursorWorld[0]}
            y2={cursorWorld[1]}
            strokeWidth={2}
            strokeDasharray="3 6"
            opacity={0.6}
            style={{ stroke: CRAYON.chalkWhite }}
          />
        )}
      </g>
    </svg>
  );
}
