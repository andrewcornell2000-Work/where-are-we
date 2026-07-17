# Graph Report - where-are-we  (2026-07-17)

## Corpus Check
- 33 files · ~16,355 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 237 nodes · 406 edges · 13 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8997a6c8`
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
1. `compilerOptions` - 17 edges
2. `App()` - 11 edges
3. `Rect` - 11 edges
4. `WawNode` - 11 edges
5. `CanvasView()` - 8 edges
6. `Where Are We` - 8 edges
7. `startServer()` - 7 edges
8. `CRAYON` - 7 edges
9. `NodePos` - 7 edges
10. `HANDOVER — Where Are We v2 (verification complete, ready to use)` - 7 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `startServer()`  [EXTRACTED]
  bin/waw.mjs → server/index.mjs
- `Props` --references--> `Rect`  [EXTRACTED]
  src/canvas/SectionShape.tsx → src/lib/geometry.ts
- `Props` --references--> `Camera`  [EXTRACTED]
  src/canvas/CanvasView.tsx → src/types.ts
- `Props` --references--> `NodePos`  [EXTRACTED]
  src/canvas/CanvasView.tsx → src/types.ts
- `CanvasView()` --calls--> `emitFlakes()`  [EXTRACTED]
  src/canvas/CanvasView.tsx → src/lib/flakes.ts

## Import Cycles
- None detected.

## Communities (13 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.08
Nodes (25): concurrently, elkjs, devDependencies, concurrently, elkjs, perfect-freehand, react, react-dom (+17 more)

### Community 1 - "devDependencies"
Cohesion: 0.09
Nodes (22): chokidar, bin, where-are-we, dependencies, chokidar, ws, description, files (+14 more)

### Community 2 - "NodeShape.tsx"
Cohesion: 0.13
Nodes (17): DrawnPath(), Props, EdgeShape, Props, Props, SectionShape, emitFlakes(), polylineMidpoint() (+9 more)

### Community 3 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2021, src, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx (+14 more)

### Community 4 - "index.mjs"
Cohesion: 0.14
Nodes (20): AGENTS_SNIPPET(), args, CURSOR_RULE(), cwd, dataDir, getFlag(), init(), main() (+12 more)

### Community 5 - "Where Are We"
Cohesion: 0.12
Nodes (14): A good habit, Hard rules, Instructions for AI assistants working in this project, The file format, Use graphify for accurate connections, What you do, and when, Data schema (`where-are-we.json`), How it works (+6 more)

### Community 6 - "CanvasView.tsx"
Cohesion: 0.12
Nodes (23): CanvasView(), Drag, EdgeItem, EraseTarget, NodeItem, SectionItem, NodeShape, Props (+15 more)

### Community 7 - "Toolbar.tsx"
Cohesion: 0.40
Nodes (5): Tool, CRAYON_PICKS, Props, Toolbar(), TOOLS

### Community 9 - "Rect"
Cohesion: 0.11
Nodes (33): App(), nowIso(), todayStr(), Analysis, analyze(), DailyLayout, layoutDaily(), FlowLayout (+25 more)

### Community 10 - "elk-bundled.d.ts"
Cohesion: 0.20
Nodes (7): ELK, ElkEdgeSection, ElkExtendedEdge, elkjs/lib/elk.bundled.js, ElkLabel, ElkNode, ElkPoint

### Community 11 - "Where things stand"
Cohesion: 0.25
Nodes (7): Board state (data/where-are-we.json), Gotchas that still apply, HANDOVER — Where Are We v2 (verification complete, ready to use), Machine setup notes (fresh machine), What this project is, What to do next (nothing is blocked), Where things stand

### Community 12 - "StrokeShape.tsx"
Cohesion: 0.39
Nodes (6): Props, Props, StrokeShape(), outlineToPath(), strokePath(), FreehandStroke

## Knowledge Gaps
- **89 isolated node(s):** `args`, `cwd`, `dataDir`, `name`, `version` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useLive()` connect `Rect` to `elk-bundled.d.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `App.tsx` to `devDependencies`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `args`, `cwd`, `dataDir` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `NodeShape.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._