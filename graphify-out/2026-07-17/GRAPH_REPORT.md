# Graph Report - Where Are We  (2026-07-17)

## Corpus Check
- 32 files · ~15,446 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 207 nodes · 385 edges · 11 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `Rect` - 13 edges
3. `WawNode` - 12 edges
4. `App()` - 11 edges
5. `CanvasView()` - 8 edges
6. `Where Are We` - 8 edges
7. `startServer()` - 7 edges
8. `CRAYON` - 7 edges
9. `NodePos` - 7 edges
10. `scripts` - 6 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `startServer()`  [EXTRACTED]
  bin/waw.mjs → server/index.mjs
- `App()` --calls--> `useLive()`  [EXTRACTED]
  src/App.tsx → src/lib/useLive.ts
- `NodeItem` --references--> `Rect`  [EXTRACTED]
  src/canvas/CanvasView.tsx → src/lib/geometry.ts
- `Props` --references--> `Camera`  [EXTRACTED]
  src/canvas/CanvasView.tsx → src/types.ts
- `Props` --references--> `NodePos`  [EXTRACTED]
  src/canvas/CanvasView.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (11 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.18
Nodes (14): Live, useLive(), wsUrl(), Camera, ClientMessage, EdgeStyle, EMPTY_LAYOUT, NodeLink (+6 more)

### Community 1 - "devDependencies"
Cohesion: 0.07
Nodes (29): bin, where-are-we, dependencies, chokidar, ws, description, devDependencies, concurrently (+21 more)

### Community 2 - "NodeShape.tsx"
Cohesion: 0.12
Nodes (21): SectionItem, DrawnPath(), Props, EdgeShape, Props, NodeShape, Props, Props (+13 more)

### Community 3 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 4 - "index.mjs"
Cohesion: 0.14
Nodes (20): AGENTS_SNIPPET(), args, CURSOR_RULE(), cwd, dataDir, getFlag(), init(), main() (+12 more)

### Community 5 - "Where Are We"
Cohesion: 0.12
Nodes (14): A good habit, Hard rules, Instructions for AI assistants working in this project, The file format, Use graphify for accurate connections, What you do, and when, Data schema (`where-are-we.json`), How it works (+6 more)

### Community 6 - "CanvasView.tsx"
Cohesion: 0.20
Nodes (15): CanvasView(), Drag, EdgeItem, EraseTarget, Props, statusDotCenter(), Props, StrokeShape() (+7 more)

### Community 7 - "Toolbar.tsx"
Cohesion: 0.15
Nodes (13): Tool, CRAYON, CRAYON_PICKS, NOTE: use these via `style={{ stroke/fill/color: ... }}` — SVG *presentation, statusColor(), statusLabel(), Status, ViewKind (+5 more)

### Community 9 - "Rect"
Cohesion: 0.17
Nodes (21): App(), nowIso(), todayStr(), NodeItem, Analysis, analyze(), DailyLayout, layoutDaily() (+13 more)

### Community 10 - "elk-bundled.d.ts"
Cohesion: 0.20
Nodes (7): ELK, ElkEdgeSection, ElkExtendedEdge, elkjs/lib/elk.bundled.js, ElkLabel, ElkNode, ElkPoint

## Knowledge Gaps
- **79 isolated node(s):** `args`, `cwd`, `dataDir`, `name`, `version` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useLive()` connect `App.tsx` to `Rect`, `elk-bundled.d.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `args`, `cwd`, `dataDir` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `NodeShape.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `index.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.13852813852813853 - nodes in this community are weakly interconnected._
- **Should `Where Are We` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._