import type { WawEdge, WawNode } from "../types";

// Dependency analysis over the project view:
//  - deps: blockedBy plus incoming edges (an edge A -> B means B depends on A)
//  - ready: not done + every dependency done
//  - critical path: longest chain of incomplete work through the dependency DAG
//  - next: the first ready card on the critical path (the single next move)

export interface Analysis {
  ready: Set<string>;
  criticalNodes: Set<string>;
  criticalEdges: Set<string>;
  nextId: string | null;
  doneCount: number;
  totalCount: number;
  donePct: number;
  sectionProgress: Record<string, { done: number; total: number }>;
}

export function analyze(projectNodes: WawNode[], edges: WawEdge[]): Analysis {
  const byId = new Map(projectNodes.map((n) => [n.id, n]));

  const deps = new Map<string, Set<string>>();
  for (const n of projectNodes) {
    deps.set(n.id, new Set((n.blockedBy ?? []).filter((d) => byId.has(d))));
  }
  for (const e of edges) {
    if (byId.has(e.from) && byId.has(e.to)) deps.get(e.to)!.add(e.from);
  }

  const isDone = (id: string) => byId.get(id)?.status === "done";

  const ready = new Set<string>();
  for (const n of projectNodes) {
    if (n.status === "done") continue;
    const d = deps.get(n.id)!;
    if ([...d].every(isDone)) ready.add(n.id);
  }

  // Longest path through INCOMPLETE nodes (done nodes are already behind us).
  const incomplete = projectNodes.filter((n) => n.status !== "done").map((n) => n.id);
  const incompleteSet = new Set(incomplete);
  const succ = new Map<string, string[]>();
  const indeg = new Map<string, number>();
  for (const id of incomplete) {
    succ.set(id, []);
    indeg.set(id, 0);
  }
  for (const id of incomplete) {
    for (const d of deps.get(id)!) {
      if (incompleteSet.has(d)) {
        succ.get(d)!.push(id);
        indeg.set(id, (indeg.get(id) ?? 0) + 1);
      }
    }
  }

  // Kahn topological order (nodes stuck in cycles are simply left out).
  const order: string[] = [];
  const queue = incomplete.filter((id) => (indeg.get(id) ?? 0) === 0);
  const indegWork = new Map(indeg);
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const s of succ.get(id)!) {
      indegWork.set(s, indegWork.get(s)! - 1);
      if (indegWork.get(s) === 0) queue.push(s);
    }
  }

  // DP over topo order: longest chain ending at each node.
  const best = new Map<string, number>();
  const bestPrev = new Map<string, string | null>();
  for (const id of order) {
    best.set(id, 1);
    bestPrev.set(id, null);
  }
  for (const id of order) {
    for (const s of succ.get(id)!) {
      if ((best.get(id) ?? 0) + 1 > (best.get(s) ?? 0)) {
        best.set(s, (best.get(id) ?? 0) + 1);
        bestPrev.set(s, id);
      }
    }
  }

  let endId: string | null = null;
  let endLen = 0;
  for (const [id, len] of best) {
    if (len > endLen) {
      endLen = len;
      endId = id;
    }
  }

  const criticalNodes = new Set<string>();
  const chain: string[] = [];
  let cur: string | null = endId;
  while (cur) {
    chain.unshift(cur);
    criticalNodes.add(cur);
    cur = bestPrev.get(cur) ?? null;
  }

  const criticalEdges = new Set<string>();
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i];
    const b = chain[i + 1];
    for (const e of edges) {
      if (e.from === a && e.to === b) criticalEdges.add(e.id);
    }
  }

  const nextId = chain.find((id) => ready.has(id)) ?? [...ready].sort()[0] ?? null;

  const doneCount = projectNodes.filter((n) => n.status === "done").length;
  const totalCount = projectNodes.length;
  const donePct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const sectionProgress: Record<string, { done: number; total: number }> = {};
  for (const n of projectNodes) {
    if (!n.section) continue;
    const sp = (sectionProgress[n.section] ??= { done: 0, total: 0 });
    sp.total++;
    if (n.status === "done") sp.done++;
  }

  return { ready, criticalNodes, criticalEdges, nextId, doneCount, totalCount, donePct, sectionProgress };
}
