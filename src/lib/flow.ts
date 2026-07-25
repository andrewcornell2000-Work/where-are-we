import type { WawEdge, WawNode } from "../types";

// A dependency graph branches: one card can unblock several others at once.
// That is accurate, but it draws as a fan and the board stops reading as
// "what do I do, then what". Linearising picks ONE order consistent with the
// dependencies and connects the cards in a single chain, so the board reads
// 1 -> 2 -> 3. The real dependencies are untouched and still drive the
// critical path and the "do this next" pick.

/**
 * Topological order over project cards, tie-broken by section order so the
 * chain follows the sections the user already arranged (0 -> 1 -> 2 ...).
 * Cards caught in a dependency cycle are appended rather than dropped.
 */
export function linearOrder(
  nodes: WawNode[],
  edges: WawEdge[],
  sectionOrder: Map<string, number>,
): string[] {
  const ids = nodes.map((n) => n.id);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const position = new Map(ids.map((id, i) => [id, i]));

  const deps = new Map<string, Set<string>>(ids.map((id) => [id, new Set()]));
  for (const n of nodes) {
    for (const d of n.blockedBy ?? []) if (byId.has(d)) deps.get(n.id)!.add(d);
  }
  for (const e of edges) {
    if (byId.has(e.from) && byId.has(e.to)) deps.get(e.to)!.add(e.from);
  }

  const succ = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const [id, set] of deps) for (const d of set) succ.get(d)!.push(id);

  const indeg = new Map(ids.map((id) => [id, deps.get(id)!.size]));
  const rank = (id: string) => {
    const n = byId.get(id)!;
    const sec = sectionOrder.get(n.section ?? "") ?? 9999;
    return sec * 10000 + (position.get(id) ?? 0);
  };

  const ready = ids.filter((id) => indeg.get(id) === 0);
  const out: string[] = [];
  while (ready.length) {
    // Always take the lowest-ranked available card, so the chain advances in
    // section order instead of wandering between them.
    ready.sort((a, b) => rank(a) - rank(b));
    const id = ready.shift()!;
    out.push(id);
    for (const s of succ.get(id)!) {
      indeg.set(s, indeg.get(s)! - 1);
      if (indeg.get(s) === 0) ready.push(s);
    }
  }
  const seen = new Set(out);
  for (const id of [...ids].sort((a, b) => rank(a) - rank(b))) if (!seen.has(id)) out.push(id);
  return out;
}

/** Consecutive pairs of a linear order, as edges. */
export function spineEdges(order: string[]): WawEdge[] {
  const out: WawEdge[] = [];
  for (let i = 0; i < order.length - 1; i++) {
    out.push({ id: `flow-${order[i]}__${order[i + 1]}`, from: order[i], to: order[i + 1] });
  }
  return out;
}
