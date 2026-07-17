# Graph Report - where-are-we  (2026-07-17)

## Corpus Check
- 33 files · ~16,662 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 238 nodes · 415 edges · 12 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7aeea853`
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
- `Props` --references--> `Rect`  [EXTRACTED]
  src/canvas/SectionShape.tsx → src/lib/geometry.ts
- `App()` --calls--> `useLive()`  [EXTRACTED]
  src/App.tsx → src/lib/useLive.ts
- `Props` --references--> `Camera`  [EXTRACTED]
  src/canvas/CanvasView.tsx → src/types.ts
- `Props` --references--> `NodePos`  [EXTRACTED]
  src/canvas/CanvasView.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (12 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.08
Nodes (25): concurrently, elkjs, devDependencies, concurrently, elkjs, perfect-freehand, react, react-dom (+17 more)

### Community 1 - "devDependencies"
Cohesion: 0.09
Nodes (22): chokidar, bin, where-are-we, dependencies, chokidar, ws, description, files (+14 more)

### Community 2 - "NodeShape.tsx"
Cohesion: 0.11
Nodes (21): DrawnPath(), Props, EdgeShape, Props, Props, SectionShape, emitFlakes(), polylineMidpoint() (+13 more)

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
Cohesion: 0.19
Nodes (16): CanvasView(), Drag, EdgeItem, EraseTarget, Props, NodeShape, statusDotCenter(), Props (+8 more)

### Community 7 - "Toolbar.tsx"
Cohesion: 0.40
Nodes (5): Tool, CRAYON_PICKS, Props, Toolbar(), TOOLS

### Community 9 - "Rect"
Cohesion: 0.12
Nodes (35): App(), nowIso(), todayStr(), NodeItem, SectionItem, Props, Analysis, analyze() (+27 more)

### Community 10 - "elk-bundled.d.ts"
Cohesion: 0.13
Nodes (14): ELK, ElkEdgeSection, ElkExtendedEdge, elkjs/lib/elk.bundled.js, ElkLabel, ElkNode, ElkPoint, Live (+6 more)

### Community 11 - "Where things stand"
Cohesion: 0.22
Nodes (8): Gotchas the next agent should know, HANDOVER — Where Are We v2 (paused mid-verification), How to resume, v2 features implemented (all plan sections), Verification already PASSED (live browser via Playwright MCP), Verification REMAINING (was mid-flight when paused), What this project is, Where things stand

## Knowledge Gaps
- **90 isolated node(s):** `args`, `cwd`, `dataDir`, `name`, `version` (+85 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useLive()` connect `elk-bundled.d.ts` to `Rect`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `App.tsx` to `devDependencies`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `args`, `cwd`, `dataDir` to the rest of the system?**
  _90 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `NodeShape.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11397849462365592 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._