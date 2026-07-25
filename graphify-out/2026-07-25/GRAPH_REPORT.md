# Graph Report - Where Are We  (2026-07-25)

## Corpus Check
- 36 files · ~21,034 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 268 nodes · 470 edges · 13 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8b2b482f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- devDependencies
- NodeShape.tsx
- compilerOptions
- index.mjs
- Where Are We
- CanvasView.tsx
- Toolbar.tsx
- Rect
- elk-bundled.d.ts
- Where things stand
- StrokeShape.tsx

## God Nodes (most connected - your core abstractions)
1. `App()` - 17 edges
2. `compilerOptions` - 17 edges
3. `Rect` - 13 edges
4. `WawNode` - 12 edges
5. `HANDOFF — Where Are We: canvas reliability pass` - 9 edges
6. `CanvasView()` - 8 edges
7. `nodeSize()` - 8 edges
8. `routeEdge()` - 8 edges
9. `Phases (execute in order; verify before next)` - 8 edges
10. `HANDOVER — Where Are We v2 (verification complete, ready to use)` - 8 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `startServer()`  [EXTRACTED]
  bin/waw.mjs → server/index.mjs
- `Props` --references--> `Rect`  [EXTRACTED]
  src/canvas/SectionShape.tsx → src/lib/geometry.ts
- `App()` --calls--> `useLive()`  [EXTRACTED]
  src/App.tsx → src/lib/useLive.ts
- `Props` --references--> `Lod`  [EXTRACTED]
  src/canvas/CanvasView.tsx → src/canvas/lod.ts
- `Props` --references--> `Camera`  [EXTRACTED]
  src/canvas/CanvasView.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (13 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.08
Nodes (25): concurrently, elkjs, devDependencies, concurrently, elkjs, perfect-freehand, react, react-dom (+17 more)

### Community 1 - "devDependencies"
Cohesion: 0.08
Nodes (23): chokidar, bin, where-are-we, dependencies, chokidar, ws, description, files (+15 more)

### Community 2 - "NodeShape.tsx"
Cohesion: 0.10
Nodes (25): DrawnPath(), Props, EdgeShape, Props, Lod, NodeShape, Props, Props (+17 more)

### Community 3 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2021, src, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx (+14 more)

### Community 4 - "index.mjs"
Cohesion: 0.14
Nodes (20): AGENTS_SNIPPET(), args, CURSOR_RULE(), cwd, dataDir, getFlag(), init(), main() (+12 more)

### Community 5 - "Where Are We"
Cohesion: 0.12
Nodes (15): A good habit, Hard rules, Instructions for AI assistants working in this project, The file format, Use graphify for accurate connections, What you do, and when, Writing card copy, Data schema (`where-are-we.json`) (+7 more)

### Community 6 - "CanvasView.tsx"
Cohesion: 0.22
Nodes (14): CanvasView(), Drag, EdgeItem, EraseTarget, Props, statusDotCenter(), Props, StrokeShape() (+6 more)

### Community 7 - "Toolbar.tsx"
Cohesion: 0.40
Nodes (5): Tool, CRAYON_PICKS, Props, Toolbar(), TOOLS

### Community 9 - "Rect"
Cohesion: 0.11
Nodes (41): App(), nowIso(), todayStr(), NodeItem, SectionItem, lodForScale(), Analysis, analyze() (+33 more)

### Community 10 - "elk-bundled.d.ts"
Cohesion: 0.13
Nodes (14): ELK, ElkEdgeSection, ElkExtendedEdge, elkjs/lib/elk.bundled.js, ElkLabel, ElkNode, ElkPoint, Live (+6 more)

### Community 11 - "Where things stand"
Cohesion: 0.22
Nodes (8): 2026-07-24 canvas reliability pass (HANDOFF-CANVAS-FIX.md), Board state (data/where-are-we.json), Gotchas that still apply, HANDOVER — Where Are We v2 (verification complete, ready to use), Machine setup notes (fresh machine), What this project is, What to do next (nothing is blocked), Where things stand

### Community 12 - "StrokeShape.tsx"
Cohesion: 0.11
Nodes (18): Constraints, Context, Do not, Escalate to owner (batch), Gotchas (from HANDOVER.md), HANDOFF — Where Are We: canvas reliability pass, Known bug cluster (Bugbot + prior audit), Outcome (+10 more)

## Knowledge Gaps
- **108 isolated node(s):** `args`, `cwd`, `dataDir`, `name`, `version` (+103 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useLive()` connect `elk-bundled.d.ts` to `Rect`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `App.tsx` to `devDependencies`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `args`, `cwd`, `dataDir` to the rest of the system?**
  _108 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `NodeShape.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._