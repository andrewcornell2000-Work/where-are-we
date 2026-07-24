import type ELK from "elkjs/lib/elk.bundled.js";
import type { ElkNode, ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { WawEdge, WawNode, WawSection } from "../types";
import type { Rect } from "./geometry";
import { nodeSize } from "./geometry";

// Structured flowchart layout via the Eclipse Layout Kernel (layered / Sugiyama).
// Sections become ELK compound nodes, cards their children, and edges are routed
// orthogonally with bend points that avoid cards and section boundaries.
//
// Graphs here are small (tens of cards), so we run the bundled main-thread build;
// layout is still async (promise-based). elkjs is ~1.4 MB minified, so it is
// loaded lazily via dynamic import to keep it out of the main chunk.

let elkPromise: Promise<ELK> | null = null;
function getElk(): Promise<ELK> {
  elkPromise ??= import("elkjs/lib/elk.bundled.js").then((m) => new m.default());
  return elkPromise;
}

export interface FlowLayout {
  /** Absolute card rects by node id. */
  rects: Record<string, Rect>;
  /** Absolute section container rects by section id. */
  sections: Record<string, Rect>;
  /** Absolute edge polylines by edge id (start, bends..., end). */
  routes: Record<string, Array<[number, number]>>;
}

const SECTION_PAD_TOP = 78;
const SECTION_PAD = 34;

export async function layoutFlow(
  nodes: WawNode[],
  edges: WawEdge[],
  sections: WawSection[],
): Promise<FlowLayout> {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const usedSections = sections
    .filter((s) => nodes.some((n) => n.section === s.id))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sectionIds = new Set(usedSections.map((s) => s.id));

  const cardChild = (n: WawNode): ElkNode => {
    const { w, h } = nodeSize(n);
    return { id: n.id, width: w, height: h };
  };

  const children: ElkNode[] = [
    ...usedSections.map((s) => ({
      id: s.id,
      layoutOptions: {
        "elk.padding": `[top=${SECTION_PAD_TOP},left=${SECTION_PAD},bottom=${SECTION_PAD},right=${SECTION_PAD}]`,
      },
      children: nodes.filter((n) => n.section === s.id).map(cardChild),
    })),
    ...nodes.filter((n) => !n.section || !sectionIds.has(n.section)).map(cardChild),
  ];

  const elkEdges: ElkExtendedEdge[] = edges
    .filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to))
    .map((e) => ({ id: e.id, sources: [e.from], targets: [e.to] }));

  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.spacing.nodeNodeBetweenLayers": "110",
      "elk.spacing.nodeNode": "56",
      "elk.spacing.componentComponent": "90",
      "elk.spacing.edgeNode": "28",
      "elk.spacing.edgeEdge": "18",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.layered.crossingMinimization.forceNodeModelOrder": "false",
      "elk.padding": "[top=60,left=60,bottom=60,right=60]",
    },
    children,
    edges: elkEdges,
  };

  const elk = await getElk();
  const out = await elk.layout(graph);

  const rects: Record<string, Rect> = {};
  const sectionRects: Record<string, Rect> = {};

  // Walk the tree accumulating parent offsets -> absolute coordinates.
  const absOrigin: Record<string, [number, number]> = { root: [0, 0] };
  const walk = (node: ElkNode, ox: number, oy: number) => {
    for (const child of node.children ?? []) {
      const x = ox + (child.x ?? 0);
      const y = oy + (child.y ?? 0);
      const r: Rect = { x, y, w: child.width ?? 0, h: child.height ?? 0 };
      absOrigin[child.id] = [x, y];
      if (sectionIds.has(child.id)) {
        sectionRects[child.id] = r;
      } else {
        rects[child.id] = r;
      }
      walk(child, x, y);
    }
  };
  walk(out, 0, 0);

  // Edge sections' coordinates are relative to the edge's container node.
  const routes: Record<string, Array<[number, number]>> = {};
  const collectEdges = (node: ElkNode) => {
    for (const e of node.edges ?? []) {
      const [cx, cy] = absOrigin[e.container ?? node.id] ?? [0, 0];
      const sec = e.sections?.[0];
      if (!sec) continue;
      const pts: Array<[number, number]> = [
        [sec.startPoint.x + cx, sec.startPoint.y + cy],
        ...(sec.bendPoints ?? []).map((p): [number, number] => [p.x + cx, p.y + cy]),
        [sec.endPoint.x + cx, sec.endPoint.y + cy],
      ];
      routes[e.id] = pts;
    }
    for (const child of node.children ?? []) collectEdges(child);
  };
  collectEdges(out);

  return { rects, sections: sectionRects, routes };
}
