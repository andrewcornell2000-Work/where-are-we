// Shared data model for "Where Are We" (v2).
//
// Two data stores on disk:
//   <dataDir>/where-are-we.json  -> AI-owned CONTENT (sections + nodes + edges).
//   <dataDir>/layout.local.json  -> APP-owned LAYOUT (pins, strokes, manual items,
//                                   overrides, hidden ids, camera).
//
// Merged by id at render time so the AI can update content without ever stomping
// what the user arranged or edited by hand.

export type Status = "todo" | "doing" | "done";
export type ViewKind = "project" | "daily";

export interface NodeLink {
  file: string;
  line?: number;
}

/** A labeled container that groups cards in the flowchart. */
export interface WawSection {
  id: string;
  title: string;
  /** Optional crayon color hint (hex). */
  color?: string;
  /** Lower = earlier in the flow / higher in lists. */
  order?: number;
}

export interface WawNode {
  id: string;
  title: string;
  status: Status;
  note?: string;
  link?: NodeLink;
  view: ViewKind;
  /** YYYY-MM-DD, required for daily nodes so they can be filtered by day. */
  day?: string;
  /** Section (container) this card belongs to. */
  section?: string;
  /** Free-form grouping label; used as a color hint. */
  category?: string;
  /** For a daily node: the id of the project node it connects back to. */
  projectRef?: string;
  /** Ids of nodes that must be done before this one (drives ready/critical path). */
  blockedBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export type EdgeStyle = "solid" | "dashed";

export interface WawEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  style?: EdgeStyle;
}

/** Contents of where-are-we.json (AI-owned). */
export interface WawContent {
  version: number;
  title?: string;
  sections?: WawSection[];
  nodes: WawNode[];
  edges: WawEdge[];
}

export interface NodePos {
  x: number;
  y: number;
  w?: number;
  h?: number;
}

export interface FreehandStroke {
  id: string;
  points: Array<[number, number]>;
  color: string;
  size: number;
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

/** User edits applied on top of AI cards (AI file stays AI-owned). */
export interface NodeOverride {
  title?: string;
  note?: string;
  status?: Status;
}

/** Contents of layout.local.json (app-owned). */
export interface WawLayout {
  version: number;
  /** Cards the user dragged: their position wins over auto-layout until Auto-arrange. */
  pinned: Record<string, NodePos>;
  strokes: FreehandStroke[];
  /** Nodes the user added by hand on the canvas (never written to the AI file). */
  manualNodes: WawNode[];
  /** Connections the user drew by hand (kept out of the AI file). */
  manualEdges: WawEdge[];
  /** Ids of AI nodes hidden with the eraser (reversible, non-destructive). */
  hiddenIds: string[];
  /** Ids of AI edges hidden with the eraser. */
  hiddenEdgeIds: string[];
  /** User edits (title/note/status) layered over AI cards. */
  overrides: Record<string, NodeOverride>;
  camera?: Camera;
  settings?: WawSettings;
}

/** Display preferences. Optional so pre-existing layout files stay valid. */
export interface WawSettings {
  /**
   * Scales card width and card text together (0.8-1.6, default 1). Both move
   * as one so the JS-computed card geometry keeps matching the rendered text.
   */
  cardScale?: number;
  /** Snap dragged cards to a grid and to neighbours' edges. */
  snap?: boolean;
}

/** Messages exchanged over the WebSocket. */
export type ServerMessage =
  | { type: "state"; content: WawContent; layout: WawLayout }
  | { type: "error"; message: string };

export type ClientMessage = { type: "saveLayout"; layout: WawLayout };

export const EMPTY_LAYOUT: WawLayout = {
  version: 2,
  pinned: {},
  strokes: [],
  manualNodes: [],
  manualEdges: [],
  hiddenIds: [],
  hiddenEdgeIds: [],
  overrides: {},
};

export function nextStatus(s: Status): Status {
  return s === "todo" ? "doing" : s === "doing" ? "done" : "todo";
}
