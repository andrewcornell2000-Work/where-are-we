import type { NodePos, WawNode, WawSection } from "../types";
import { nodeSize } from "./geometry";

// Daily view layout: a single column of today's cards, grouped by section in
// section order. (The project view uses the elkjs flowchart in elklayout.ts.)
// Pinned (user-dragged) cards keep their position.

const ROW_GAP = 56;
const GROUP_GAP = 96;
const START_X = 140;
const START_Y = 140;

export interface DailyLayout {
  positions: Record<string, NodePos>;
  /** Section header labels: id, title, y position of the group start. */
  headers: Array<{ id: string; title: string; x: number; y: number }>;
}

export function layoutDaily(
  nodes: WawNode[],
  sections: WawSection[],
  pinned: Record<string, NodePos>,
): DailyLayout {
  const positions: Record<string, NodePos> = {};
  const headers: DailyLayout["headers"] = [];

  const ordered = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const groups: Array<{ id: string; title: string; nodes: WawNode[] }> = [];
  for (const s of ordered) {
    const members = nodes.filter((n) => n.section === s.id);
    if (members.length) groups.push({ id: s.id, title: s.title, nodes: members });
  }
  const ungrouped = nodes.filter((n) => !n.section || !ordered.some((s) => s.id === n.section));
  if (ungrouped.length) groups.push({ id: "__log", title: "Log", nodes: ungrouped });

  let y = START_Y;
  for (const g of groups) {
    headers.push({ id: g.id, title: g.title, x: START_X, y: y - 18 });
    for (const node of g.nodes) {
      if (pinned[node.id]) {
        positions[node.id] = pinned[node.id];
        continue;
      }
      const { h } = nodeSize(node);
      positions[node.id] = { x: START_X, y };
      y += h + ROW_GAP;
    }
    y += GROUP_GAP - ROW_GAP;
  }
  return { positions, headers };
}
